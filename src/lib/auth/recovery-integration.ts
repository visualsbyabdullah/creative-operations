import "server-only";

import {
  auditSecurityEvent,
  enforceRateLimit,
} from "@/lib/security/auth-security";
import type { RequestSecurityContext } from "@/lib/security/request-context";

export type RecoverySecurityEvent =
  | "password_reset_requested"
  | "password_recovery_verified"
  | "password_reset_succeeded"
  | "password_reset_failed"
  | "password_recovery_rejected";

export async function checkRecoveryRateLimit(
  operation: "request" | "callback" | "reset",
  context: RequestSecurityContext,
  targetedIdentifier?: string,
) {
  if (operation === "callback") {
    return [
      await enforceRateLimit(
        "recovery_callback_ip",
        context,
      ),
    ];
  }

  if (operation === "request") {
    return [
      await enforceRateLimit(
        "forgot_password_ip",
        context,
      ),
      ...(targetedIdentifier
        ? [
            await enforceRateLimit(
              "forgot_password_targeted",
              context,
              [targetedIdentifier],
            ),
          ]
        : []),
    ];
  }

  return [
    await enforceRateLimit(
      "reset_password_ip",
      context,
    ),
    ...(targetedIdentifier
      ? [
          await enforceRateLimit(
            "reset_password_targeted",
            context,
            [targetedIdentifier],
          ),
        ]
      : []),
  ];
}

export async function recordRecoverySecurityEvent(
  event: RecoverySecurityEvent,
  context: RequestSecurityContext,
  actorUserId?: string,
) {
  const result =
    event === "password_reset_requested"
      ? "accepted"
      : event.endsWith("_succeeded") ||
          event === "password_recovery_verified"
        ? "succeeded"
        : "failed";
  const isProviderOnlyEvent =
    event === "password_reset_requested" ||
    event === "password_recovery_verified" ||
    event === "password_reset_succeeded";

  return auditSecurityEvent(
    context,
    event,
    result,
    isProviderOnlyEvent
      ? { provider: "supabase" }
      : {
          provider: "supabase",
          reason_code:
            event === "password_recovery_rejected"
              ? "invalid_recovery"
              : "provider_rejected",
        },
    actorUserId,
  );
}
