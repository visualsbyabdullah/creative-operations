export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code:
        | "validation_failed"
        | "unauthenticated"
        | "forbidden"
        | "not_found"
        | "stale_update"
        | "last_manager_protected"
        | "rate_limited"
        | "email_conflict"
        | "invitation_not_completed"
        | "idempotency_conflict"
        | "temporarily_unavailable";
      fieldErrors?: Record<string, string>;
    };
