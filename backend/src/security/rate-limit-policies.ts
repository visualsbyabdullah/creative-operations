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

export const BUSINESS_RATE_LIMIT_POLICIES = {
  profile_write: { limit: 20, windowSeconds: 600 },
  employee_directory_read: { limit: 120, windowSeconds: 60 },
  employee_detail_read: { limit: 120, windowSeconds: 60 },
  employee_manage: { limit: 30, windowSeconds: 3600 },
  employee_status_change: { limit: 30, windowSeconds: 3600 },
  employee_role_change: { limit: 20, windowSeconds: 3600 },
  employee_invitation: { limit: 10, windowSeconds: 3600 },
  employee_invitation_retry: { limit: 20, windowSeconds: 3600 },
  brand_read: { limit: 120, windowSeconds: 60 },
  brand_mutation: { limit: 30, windowSeconds: 3600 },
  department_read: { limit: 120, windowSeconds: 60 },
  department_mutation: { limit: 30, windowSeconds: 3600 },
  avatar_upload: { limit: 10, windowSeconds: 600 },
  avatar_replace: { limit: 10, windowSeconds: 600 },
  avatar_remove: { limit: 10, windowSeconds: 600 },
  task_attachment_upload: { limit: 20, windowSeconds: 600 },
  task_attachment_remove: { limit: 30, windowSeconds: 600 },
  submission_attachment_upload: { limit: 20, windowSeconds: 600 },
  submission_attachment_remove: { limit: 20, windowSeconds: 600 },
  management_attachment_remove: { limit: 30, windowSeconds: 600 },
  storage_signed_url: { limit: 120, windowSeconds: 60 },
} as const;

export type AuthRateLimitPolicy =
  | keyof typeof AUTH_RATE_LIMIT_POLICIES
  | keyof typeof BUSINESS_RATE_LIMIT_POLICIES;

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
  const policies = {
    ...AUTH_RATE_LIMIT_POLICIES,
    ...BUSINESS_RATE_LIMIT_POLICIES,
  };
  const windowSeconds = policies[policy].windowSeconds;

  return Math.min(
    windowSeconds,
    Math.max(1, Math.ceil(value)),
  );
}
