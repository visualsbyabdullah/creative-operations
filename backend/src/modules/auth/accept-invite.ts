import "server-only";

export const SAFE_INVITATION_ERROR =
  "This invitation is invalid or has expired. Ask your administrator to resend it.";

export type InviteTokenInput =
  | {
      ok: true;
      tokenHash: string;
    }
  | {
      ok: false;
      message: typeof SAFE_INVITATION_ERROR;
    };

type InviteVerificationClient = {
  auth: {
    verifyOtp(input: {
      token_hash: string;
      type: "invite";
    }): Promise<{
      data: {
        user: {
          id: string;
          invited_at?: string | null;
        } | null;
      };
      error: unknown | null;
    }>;
  };
};

const MIN_TOKEN_HASH_LENGTH = 16;
const MAX_TOKEN_HASH_LENGTH = 2048;

function isBoundedOpaqueToken(
  value: string,
) {
  return (
    value.length >= MIN_TOKEN_HASH_LENGTH &&
    value.length <= MAX_TOKEN_HASH_LENGTH &&
    !/[\u0000-\u0020\u007f]/.test(value)
  );
}

export function validateInviteTokenInput(
  tokenHash: unknown,
  type: unknown,
): InviteTokenInput {
  if (
    type !== "invite" ||
    typeof tokenHash !== "string" ||
    !isBoundedOpaqueToken(tokenHash)
  ) {
    return {
      ok: false,
      message: SAFE_INVITATION_ERROR,
    };
  }

  return {
    ok: true,
    tokenHash,
  };
}

export async function verifyInviteToken(
  tokenHash: unknown,
  type: unknown,
  client: InviteVerificationClient,
): Promise<
  | { ok: true; userId: string }
  | {
      ok: false;
      message: typeof SAFE_INVITATION_ERROR;
    }
> {
  const input = validateInviteTokenInput(
    tokenHash,
    type,
  );
  if (!input.ok) return input;

  try {
    const { data, error } =
      await client.auth.verifyOtp({
        token_hash: input.tokenHash,
        type: "invite",
      });

    if (
      error ||
      !data.user ||
      !data.user.invited_at
    ) {
      return {
        ok: false,
        message: SAFE_INVITATION_ERROR,
      };
    }

    return {
      ok: true,
      userId: data.user.id,
    };
  } catch {
    return {
      ok: false,
      message: SAFE_INVITATION_ERROR,
    };
  }
}
