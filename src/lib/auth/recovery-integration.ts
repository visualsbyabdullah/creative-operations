import "server-only";

export type RecoverySecurityEvent =
  | "password_reset_requested"
  | "password_recovery_verified"
  | "password_reset_succeeded"
  | "password_reset_failed"
  | "password_recovery_rejected";

/*
 * Phase 2B4 integration boundary. Callers are deliberately isolated from
 * provider details so a shared atomic limiter can be inserted here without
 * changing recovery business logic. This phase does not claim enforcement.
 */
export async function checkRecoveryRateLimit(
  operation: "request" | "callback" | "reset",
) {
  void operation;
  return { allowed: true as const };
}

/*
 * Phase 2B4 durable audit boundary. This intentionally performs no logging
 * or persistence; the later append-only sink will implement this contract.
 */
export async function recordRecoverySecurityEvent(
  event: RecoverySecurityEvent,
  actorUserId?: string,
) {
  void event;
  void actorUserId;
}
