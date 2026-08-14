import "server-only";

import { validateSetPasswordInput } from "@shared/auth/set-password-validation";

type PasswordClient = {
  auth: {
    updateUser(input: {
      password: string;
    }): Promise<{ error: unknown | null }>;
  };
};

type CompletionResult =
  | {
      ok: true;
      destination:
        | "/dashboard"
        | "/inactive"
        | "/auth/signout?reason=denied";
    }
  | { ok: false };

export type SetInvitationPasswordResult =
  | {
      ok: true;
      destination:
        | "/dashboard"
        | "/inactive"
        | "/auth/signout?reason=denied";
    }
  | {
      ok: false;
      code:
        | "validation_failed"
        | "password_policy"
        | "password_mismatch"
        | "invitation_expired";
      message: string;
    };

const SAFE_UPDATE_ERROR =
  "We could not create your password. Ask your administrator to resend the invitation.";

export async function setInvitationPassword(
  input: unknown,
  client: PasswordClient,
  finishAcceptance: () => Promise<CompletionResult>,
): Promise<SetInvitationPasswordResult> {
  const parsed = validateSetPasswordInput(input);
  if (!parsed.ok) return parsed;

  try {
    const { error } = await client.auth.updateUser({
      password: parsed.password,
    });
    if (error) {
      return {
        ok: false,
        code: "invitation_expired",
        message: SAFE_UPDATE_ERROR,
      };
    }

    const completion = await finishAcceptance();
    if (!completion.ok) {
      return {
        ok: false,
        code: "invitation_expired",
        message: SAFE_UPDATE_ERROR,
      };
    }

    return completion;
  } catch {
    return {
      ok: false,
      code: "invitation_expired",
      message: SAFE_UPDATE_ERROR,
    };
  }
}
