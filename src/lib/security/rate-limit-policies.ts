export const AUTH_RATE_LIMIT_POLICIES = {
  login_targeted: {
    limit: 5,
    windowSeconds: 900,
  },
  login_ip: {
    limit: 30,
    windowSeconds: 900,
  },
  forgot_password_targeted: {
    limit: 3,
    windowSeconds: 3600,
  },
  forgot_password_ip: {
    limit: 10,
    windowSeconds: 3600,
  },
  recovery_callback_ip: {
    limit: 10,
    windowSeconds: 900,
  },
  reset_password_targeted: {
    limit: 5,
    windowSeconds: 1800,
  },
  reset_password_ip: {
    limit: 15,
    windowSeconds: 1800,
  },
} as const;

export type AuthRateLimitPolicy =
  keyof typeof AUTH_RATE_LIMIT_POLICIES;

export const AUTH_LIMITER_FAILURE_POLICY = {
  login: "closed",
  forgot_password: "closed",
  recovery_callback: "closed",
  reset_password: "closed",
  logout: "open",
  session_cleanup: "open",
} as const;

export function clampRetryAfter(
  policy: AuthRateLimitPolicy,
  value: number,
) {
  const windowSeconds =
    AUTH_RATE_LIMIT_POLICIES[policy].windowSeconds;

  return Math.min(
    windowSeconds,
    Math.max(1, Math.ceil(value)),
  );
}
