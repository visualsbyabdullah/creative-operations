export const AUDIT_EVENT_TYPES = [
  "login_succeeded",
  "login_failed",
  "logout_succeeded",
  "logout_failed",
  "password_reset_requested",
  "password_recovery_verified",
  "password_recovery_rejected",
  "password_reset_succeeded",
  "password_reset_failed",
  "inactive_account_denied",
  "missing_profile_denied",
  "invalid_role_denied",
  "authentication_verification_failed",
  "rate_limit_exceeded",
  "recovery_state_invalid",
  "session_cleanup_performed",
  "security_dependency_unavailable",
] as const;

export type AuthAuditEventType =
  (typeof AUDIT_EVENT_TYPES)[number];

export type AuthAuditResult =
  | "succeeded"
  | "failed"
  | "denied"
  | "accepted"
  | "cleaned"
  | "unavailable";

const ALLOWED_VALUES = {
  reason_code: new Set([
    "invalid_credentials",
    "inactive_account",
    "missing_profile",
    "invalid_role",
    "verification_failed",
    "invalid_recovery",
    "provider_rejected",
    "rate_limited",
    "dependency_unavailable",
  ]),
  provider: new Set(["supabase"]),
  persistence_mode: new Set([
    "session",
    "persistent",
  ]),
  limiter_policy: new Set([
    "login_targeted",
    "login_ip",
    "forgot_password_targeted",
    "forgot_password_ip",
    "recovery_callback_ip",
    "reset_password_targeted",
    "reset_password_ip",
  ]),
  profile_status: new Set([
    "active",
    "inactive",
    "missing",
    "invalid_role",
  ]),
  role: new Set([
    "manager",
    "hr",
    "graphic_designer",
    "video_editor",
  ]),
  logout_scope: new Set(["local", "global"]),
  cleanup_kind: new Set([
    "recovery",
    "persistence",
    "session",
  ]),
  http_method: new Set(["GET", "POST"]),
} as const;

const EVENT_KEYS: Record<
  AuthAuditEventType,
  ReadonlySet<string>
> = {
  login_succeeded: new Set([
    "provider",
    "persistence_mode",
    "role",
  ]),
  login_failed: new Set([
    "provider",
    "reason_code",
    "persistence_mode",
  ]),
  logout_succeeded: new Set(["logout_scope"]),
  logout_failed: new Set([
    "logout_scope",
    "reason_code",
  ]),
  password_reset_requested: new Set(["provider"]),
  password_recovery_verified: new Set(["provider"]),
  password_recovery_rejected: new Set([
    "provider",
    "reason_code",
  ]),
  password_reset_succeeded: new Set(["provider"]),
  password_reset_failed: new Set([
    "provider",
    "reason_code",
  ]),
  inactive_account_denied: new Set([
    "profile_status",
  ]),
  missing_profile_denied: new Set([
    "profile_status",
  ]),
  invalid_role_denied: new Set([
    "profile_status",
  ]),
  authentication_verification_failed: new Set([
    "reason_code",
  ]),
  rate_limit_exceeded: new Set([
    "limiter_policy",
    "retry_after_seconds",
  ]),
  recovery_state_invalid: new Set([
    "reason_code",
  ]),
  session_cleanup_performed: new Set([
    "cleanup_kind",
  ]),
  security_dependency_unavailable: new Set([
    "reason_code",
    "limiter_policy",
  ]),
};

export function sanitizeAuditMetadata(
  eventType: AuthAuditEventType,
  input: Record<string, unknown> = {},
) {
  const allowedKeys = EVENT_KEYS[eventType];
  const output: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!allowedKeys.has(key)) {
      throw new Error("Forbidden audit metadata key.");
    }

    if (key === "retry_after_seconds") {
      if (
        !Number.isInteger(value) ||
        (value as number) < 1 ||
        (value as number) > 3600
      ) {
        throw new Error("Invalid audit metadata value.");
      }
      output[key] = value as number;
      continue;
    }

    const allowed =
      ALLOWED_VALUES[
        key as keyof typeof ALLOWED_VALUES
      ];

    if (
      typeof value !== "string" ||
      value.length > 128 ||
      !allowed?.has(value as never)
    ) {
      throw new Error("Invalid audit metadata value.");
    }

    output[key] = value;
  }

  if (
    Buffer.byteLength(JSON.stringify(output), "utf8") >
    2048
  ) {
    throw new Error("Audit metadata is too large.");
  }

  return output;
}
