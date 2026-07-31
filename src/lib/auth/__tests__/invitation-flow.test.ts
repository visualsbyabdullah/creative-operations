import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { establishInvitationFromFragment } from "@/lib/auth/invitation-client-flow";
import {
  clearSensitiveAuthFragment,
  parseInvitationFragment,
} from "@/lib/auth/invitation-fragment";
import { setInvitationPassword } from "@/lib/auth/set-invitation-password";
import { validateSetPasswordInput } from "@/lib/auth/set-password-validation";
import {
  AUTH_INVITATION_MAX_AGE_SECONDS,
  createInvitationState,
  verifyInvitationState,
} from "@/lib/auth/invitation-state";
import {
  SAFE_INVITATION_ERROR,
  validateInviteTokenInput,
  verifyInviteToken,
} from "@/lib/auth/accept-invite";

const accessToken = "access-token-test-value";
const refreshToken = "refresh-token-test-value";
const validHash =
  `#access_token=${accessToken}&refresh_token=${refreshToken}&type=invite`;
const invitedUserId =
  "11111111-1111-4111-8111-111111111111";

afterEach(() => {
  vi.unstubAllEnvs();
});

function browserState() {
  return {
    history: {
      replaceState: vi.fn(),
    },
    location: {
      pathname: "/login",
      search: "",
    },
  };
}

function sessionClient(error: unknown = null) {
  return {
    auth: {
      setSession: vi.fn().mockResolvedValue({ error }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

describe("implicit invitation flow", () => {
  it("parses only a complete invitation fragment", () => {
    expect(parseInvitationFragment(validHash)).toEqual({
      ok: true,
      accessToken,
      refreshToken,
    });
  });

  it("rejects a missing access token", () => {
    expect(
      parseInvitationFragment(
        `#refresh_token=${refreshToken}&type=invite`,
      ),
    ).toEqual({
      ok: false,
      code: "missing_access_token",
    });
  });

  it("rejects a missing refresh token", () => {
    expect(
      parseInvitationFragment(
        `#access_token=${accessToken}&type=invite`,
      ),
    ).toEqual({
      ok: false,
      code: "missing_refresh_token",
    });
  });

  it("rejects the wrong auth type and malformed fragments", () => {
    expect(
      parseInvitationFragment(
        `#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`,
      ),
    ).toEqual({
      ok: false,
      code: "invalid_type",
    });
    expect(
      parseInvitationFragment(
        `${validHash}&redirect_to=https%3A%2F%2Fattacker.example`,
      ),
    ).toEqual({
      ok: false,
      code: "malformed_fragment",
    });
  });

  it("clears the fragment from browser history", () => {
    const browser = browserState();

    clearSensitiveAuthFragment(
      browser.history,
      browser.location,
    );

    expect(
      browser.history.replaceState,
    ).toHaveBeenCalledWith(null, "", "/login");
  });

  it("establishes the session and redirects to set-password", async () => {
    const browser = browserState();
    const client = sessionClient();

    const result =
      await establishInvitationFromFragment(
        validHash,
        browser.history,
        browser.location,
        client,
        vi.fn().mockResolvedValue({ ok: true }),
      );

    expect(client.auth.setSession).toHaveBeenCalledWith({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    expect(result).toEqual({
      ok: true,
      destination: "/auth/set-password",
    });
  });

  it("maps session establishment failure without returning tokens", async () => {
    const browser = browserState();
    const result =
      await establishInvitationFromFragment(
        validHash,
        browser.history,
        browser.location,
        sessionClient(new Error("provider details")),
        vi.fn(),
      );
    const serialized = JSON.stringify(result);

    expect(result).toEqual({
      ok: false,
      code: "invalid_invitation",
    });
    expect(serialized).not.toContain(accessToken);
    expect(serialized).not.toContain(refreshToken);
    expect(
      browser.history.replaceState,
    ).toHaveBeenCalled();
  });

  it("leaves an ordinary login without a fragment unaffected", async () => {
    const browser = browserState();
    const client = sessionClient();

    const result =
      await establishInvitationFromFragment(
        "",
        browser.history,
        browser.location,
        client,
        vi.fn(),
      );

    expect(result).toEqual({
      ok: false,
      code: "not_invitation",
    });
    expect(client.auth.setSession).not.toHaveBeenCalled();
    expect(
      browser.history.replaceState,
    ).not.toHaveBeenCalled();
  });
});

describe("scanner-resistant invitation flow", () => {
  const tokenHash =
    "opaque-provider_token-hash.value-1234567890";

  it("accepts an opaque provider token with a fixed invite type", () => {
    expect(
      validateInviteTokenInput(
        tokenHash,
        "invite",
      ),
    ).toEqual({
      ok: true,
      tokenHash,
    });
    expect(
      validateInviteTokenInput(
        undefined,
        "invite",
      ),
    ).toEqual({
      ok: false,
      message: SAFE_INVITATION_ERROR,
    });
    expect(
      validateInviteTokenInput(
        "too-short",
        "invite",
      ),
    ).toEqual({
      ok: false,
      message: SAFE_INVITATION_ERROR,
    });
    expect(
      validateInviteTokenInput(
        `${tokenHash}\ninvalid`,
        "invite",
      ),
    ).toEqual({
      ok: false,
      message: SAFE_INVITATION_ERROR,
    });
    expect(
      validateInviteTokenInput(
        tokenHash,
        "recovery",
      ),
    ).toEqual({
      ok: false,
      message: SAFE_INVITATION_ERROR,
    });
  });

  it("verifies only after the acceptance operation runs", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: invitedUserId,
          invited_at: "2026-07-31T00:00:00Z",
        },
      },
      error: null,
    });

    expect(verifyOtp).not.toHaveBeenCalled();
    const result = await verifyInviteToken(
      tokenHash,
      "invite",
      { auth: { verifyOtp } },
    );

    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: tokenHash,
      type: "invite",
    });
    expect(result).toEqual({
      ok: true,
      userId: invitedUserId,
    });
  });

  it("maps provider failures to an error without sensitive values", async () => {
    const result = await verifyInviteToken(
      tokenHash,
      "invite",
      {
        auth: {
          verifyOtp: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error(
              `used token ${tokenHash}`,
            ),
          }),
        },
      },
    );
    const serialized = JSON.stringify(result);

    expect(result).toEqual({
      ok: false,
      message: SAFE_INVITATION_ERROR,
    });
    expect(serialized).not.toContain(tokenHash);
    expect(serialized).not.toContain(
      "used token",
    );
  });
});

describe("signed invitation state", () => {
  it("binds a short-lived state to the verified user", () => {
    vi.stubEnv(
      "AUTH_SECURITY_HMAC_SECRET",
      "test-only-secret-with-at-least-thirty-two-characters",
    );
    const state = createInvitationState(
      invitedUserId,
      1_000,
    );

    expect(
      verifyInvitationState(
        state,
        invitedUserId,
        1_001,
      ),
    ).toBe(true);
    expect(
      verifyInvitationState(
        state,
        invitedUserId,
        1_000 +
          AUTH_INVITATION_MAX_AGE_SECONDS,
      ),
    ).toBe(false);
  });

  it("rejects tampered or cross-user invitation state", () => {
    vi.stubEnv(
      "AUTH_SECURITY_HMAC_SECRET",
      "test-only-secret-with-at-least-thirty-two-characters",
    );
    const state = createInvitationState(invitedUserId);

    expect(
      verifyInvitationState(
        `${state}tampered`,
        invitedUserId,
      ),
    ).toBe(false);
    expect(
      verifyInvitationState(
        state,
        "22222222-2222-4222-8222-222222222222",
      ),
    ).toBe(false);
  });
});

describe("invitation password creation", () => {
  it("enforces password length, maximum, and confirmation", () => {
    expect(
      validateSetPasswordInput({
        password: "too-short",
        confirmation: "too-short",
      }),
    ).toMatchObject({
      ok: false,
      code: "password_policy",
    });
    expect(
      validateSetPasswordInput({
        password: "a".repeat(4097),
        confirmation: "a".repeat(4097),
      }),
    ).toMatchObject({
      ok: false,
      code: "password_policy",
    });
    expect(
      validateSetPasswordInput({
        password: "a-valid-password",
        confirmation: "different-password",
      }),
    ).toMatchObject({
      ok: false,
      code: "password_mismatch",
    });
  });

  it("rejects unknown fields", () => {
    expect(
      validateSetPasswordInput({
        password: "a-valid-password",
        confirmation: "a-valid-password",
        redirectTo: "https://attacker.example",
      }),
    ).toMatchObject({
      ok: false,
      code: "validation_failed",
    });
  });

  it.each([
    [false, "/inactive"],
    [true, "/dashboard"],
  ] as const)(
    "updates the password and returns the profile destination",
    async (_active, destination) => {
      const updateUser = vi
        .fn()
        .mockResolvedValue({ error: null });

      const result = await setInvitationPassword(
        {
          password: "a-valid-password",
          confirmation: "a-valid-password",
        },
        { auth: { updateUser } },
        vi.fn().mockResolvedValue({
          ok: true,
          destination,
        }),
      );

      expect(updateUser).toHaveBeenCalledWith({
        password: "a-valid-password",
      });
      expect(result).toEqual({
        ok: true,
        destination,
      });
    },
  );

  it("maps expired or rejected invitation sessions safely", async () => {
    const result = await setInvitationPassword(
      {
        password: "a-valid-password",
        confirmation: "a-valid-password",
      },
      {
        auth: {
          updateUser: vi
            .fn()
            .mockResolvedValue({
              error: new Error("token leaked provider detail"),
            }),
        },
      },
      vi.fn(),
    );

    expect(result).toMatchObject({
      ok: false,
      code: "invitation_expired",
    });
    expect(JSON.stringify(result)).not.toContain(
      "token leaked provider detail",
    );
  });
});
