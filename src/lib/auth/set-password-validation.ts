export type SetPasswordValidation =
  | {
      ok: true;
      password: string;
    }
  | {
      ok: false;
      code:
        | "validation_failed"
        | "password_policy"
        | "password_mismatch";
      message: string;
    };

export function validateSetPasswordInput(
  input: unknown,
): SetPasswordValidation {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return {
      ok: false,
      code: "validation_failed",
      message: "Enter and confirm your new password.",
    };
  }

  const keys = Object.keys(input);
  if (
    keys.length !== 2 ||
    !keys.includes("password") ||
    !keys.includes("confirmation")
  ) {
    return {
      ok: false,
      code: "validation_failed",
      message: "Enter and confirm your new password.",
    };
  }

  const record = input as Record<string, unknown>;
  if (
    typeof record.password !== "string" ||
    typeof record.confirmation !== "string"
  ) {
    return {
      ok: false,
      code: "validation_failed",
      message: "Enter and confirm your new password.",
    };
  }

  if (
    record.password.trim().length === 0 ||
    record.password.length < 12 ||
    record.password.length > 4096
  ) {
    return {
      ok: false,
      code: "password_policy",
      message:
        "Use between 12 and 4096 characters for your new password.",
    };
  }

  if (record.password !== record.confirmation) {
    return {
      ok: false,
      code: "password_mismatch",
      message:
        "The password confirmation does not match.",
    };
  }

  return {
    ok: true,
    password: record.password,
  };
}
