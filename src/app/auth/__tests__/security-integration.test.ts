import {
  readFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  applyAuthCookiePersistence,
} from "@/lib/auth/persistence";
import {
  describe,
  expect,
  it,
} from "vitest";

const authRoot = join(
  process.cwd(),
  "src",
  "app",
  "auth",
);

describe("authentication security integration", () => {
  it("keeps recovery limiter calls before provider operations", () => {
    const actions = readFileSync(
      join(authRoot, "actions.ts"),
      "utf8",
    );
    const callback = readFileSync(
      join(
        authRoot,
        "callback",
        "exchange",
        "route.ts",
      ),
      "utf8",
    );
    const callbackPage = readFileSync(
      join(authRoot, "callback", "page.tsx"),
      "utf8",
    );
    const invitationActions = readFileSync(
      join(authRoot, "invitation-actions.ts"),
      "utf8",
    );

    expect(
      actions.indexOf(
        'checkRecoveryRateLimit(\n      "request"',
      ),
    ).toBeLessThan(
      actions.indexOf(
        "supabase.auth.resetPasswordForEmail",
      ),
    );
    expect(
      callback.indexOf("checkRecoveryRateLimit"),
    ).toBeLessThan(
      callback.indexOf(
        "exchangeCodeForSession",
      ),
    );
    expect(actions).toContain(
      '"password_recovery_rejected"',
    );
    expect(callback).toContain(
      '"password_recovery_verified"',
    );
    expect(actions).toContain(
      'new URL(\n        "/auth/callback",\n        getTrustedAppOrigin(),',
    );
    expect(actions).not.toContain(
      "NEXT_PUBLIC_SITE_URL",
    );
    expect(callback).not.toContain(
      'request.headers.get("host")',
    );
    expect(callback).not.toContain(
      'request.headers.get("referer")',
    );
    expect(callback).toContain(
      'redirectType === "recovery"',
    );
    expect(callback).toContain(
      'redirectType === "invite"',
    );
    expect(callback).toContain(
      '"/reset-password"',
    );
    expect(callback).toContain(
      '"/auth/set-password"',
    );
    expect(callbackPage).toContain(
      "<InvitationFragmentHandler />",
    );
    expect(callbackPage).toContain(
      'redirect(`/auth/callback/exchange?',
    );
    expect(invitationActions).toContain(
      "supabase.auth.getClaims()",
    );
    expect(invitationActions).toContain(
      '.method === "otp"',
    );
    expect(invitationActions.indexOf(
      "verifyInvitationState(",
    )).toBeLessThan(
      invitationActions.indexOf(
        "setInvitationPassword(",
      ),
    );
  });

  it("preserves Remember Me cookie behavior and deletion writes", () => {
    const source = [
      {
        name: "sb-auth",
        value: "value",
        options: { path: "/" },
      },
      {
        name: "sb-old",
        value: "",
        options: { path: "/", maxAge: 0 },
      },
    ];
    const persistent = applyAuthCookiePersistence(
      source,
      "persistent",
    );
    const session = applyAuthCookiePersistence(
      source,
      "session",
    );

    expect(persistent[0].options.maxAge).toBe(
      2_592_000,
    );
    expect(session[0].options.maxAge).toBeUndefined();
    expect(persistent[1]).toEqual(source[1]);
    expect(session[1]).toEqual(source[1]);
  });

  it("checks the login invitation fragment before rendering credentials", () => {
    const loginPage = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "login",
        "page.tsx",
      ),
      "utf8",
    );

    expect(loginPage).toContain(
      "<InvitationFragmentHandler>",
    );
    expect(loginPage.indexOf(
      "<InvitationFragmentHandler>",
    )).toBeLessThan(
      loginPage.indexOf("<LoginForm"),
    );
  });

  it("keeps token-hash invitation verification user-triggered and fixed-destination", () => {
    const acceptPage = readFileSync(
      join(
        authRoot,
        "accept-invite",
        "page.tsx",
      ),
      "utf8",
    );
    const acceptAction = readFileSync(
      join(
        authRoot,
        "accept-invite",
        "actions.ts",
      ),
      "utf8",
    );

    expect(acceptPage).not.toContain(
      "verifyOtp",
    );
    expect(acceptPage).toContain(
      "AcceptInviteForm",
    );
    expect(acceptAction).toContain(
      "verifyInviteToken(",
    );
    expect(acceptAction).toContain(
      'redirect("/auth/set-password")',
    );
    expect(acceptAction).not.toContain(
      'formData.get("next")',
    );
    expect(acceptAction).not.toContain(
      "console.",
    );
  });
});
