"use server";

import {
  getActiveProfileForUser,
  getRoleDestination,
} from "@/lib/auth/authorization";
import { modeFromRememberMe } from "@/lib/auth/persistence";
import {
  checkRecoveryRateLimit,
  recordRecoverySecurityEvent,
} from "@/lib/auth/recovery-integration";
import {
  auditSecurityEvent,
  clearRateLimit,
  emailIdentifier,
  enforceRateLimit,
  isBlocked,
  recoveryContextIdentifier,
  securityContext,
} from "@/lib/security/auth-security";
import {
  assertRecoveryConfiguration,
  AUTH_RECOVERY_COOKIE_NAME,
  getTrustedAppOrigin,
  recoveryCookieDeletionOptions,
  verifyRecoveryState,
} from "@/lib/auth/recovery-state";
import {
  clearAuthPersistenceCookie,
  createClient,
} from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { invitationCookieDeletionOptions } from "@/lib/auth/invitation-state";

const GENERIC_LOGIN_ERROR =
  "Unable to sign in with those credentials.";
const GENERIC_RECOVERY_MESSAGE =
  "If an account exists for this email, password reset instructions have been sent.";
const GENERIC_RESET_ERROR =
  "We could not reset your password. Request a new reset link and try again.";

export type LoginResult =
  | {
      success: true;
      destination: "/dashboard";
    }
  | {
      success: false;
      message: string;
    };

export type ForgotPasswordResult = {
  success: true;
  message: string;
};

export type ResetPasswordResult =
  | {
      success: true;
      destination: "/login?state=password_reset";
    }
  | {
      success: false;
      code:
        | "invalid_recovery"
        | "password_mismatch"
        | "password_policy"
        | "reset_failed";
      message: string;
    };

function normalizeEmail(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function isValidEmail(value: string) {
  return (
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export async function login(
  input: unknown,
): Promise<LoginResult> {
  let context;

  try {
    context = await securityContext("login_action");
  } catch {
    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }
  const ipDecision = await enforceRateLimit(
    "login_ip",
    context,
  );

  if (isBlocked(ipDecision)) {
    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    await auditSecurityEvent(
      context,
      "login_failed",
      "failed",
      {
        provider: "supabase",
        reason_code: "invalid_credentials",
      },
    );
    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  const keys = Object.keys(input);
  if (
    keys.some(
      (key) =>
        key !== "email" &&
        key !== "password" &&
        key !== "rememberMe",
    )
  ) {
    await auditSecurityEvent(
      context,
      "login_failed",
      "failed",
      {
        provider: "supabase",
        reason_code: "invalid_credentials",
      },
    );
    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  const record = input as Record<string, unknown>;
  const email = normalizeEmail(record.email);
  const password =
    typeof record.password === "string"
      ? record.password
      : "";

  if (
    !isValidEmail(email) ||
    password.length === 0 ||
    password.length > 4096 ||
    typeof record.rememberMe !== "boolean"
  ) {
    await auditSecurityEvent(
      context,
      "login_failed",
      "failed",
      {
        provider: "supabase",
        reason_code: "invalid_credentials",
      },
    );
    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  const persistenceMode =
    modeFromRememberMe(record.rememberMe);
  const emailId = emailIdentifier(email);
  const targetedDecision = await enforceRateLimit(
    "login_targeted",
    context,
    [emailId],
  );

  if (isBlocked(targetedDecision)) {
    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  const supabase = await createClient(
    persistenceMode,
  );
  const { data: signInData, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    await clearAuthPersistenceCookie();
    await auditSecurityEvent(
      context,
      "login_failed",
      "failed",
      {
        provider: "supabase",
        reason_code: "invalid_credentials",
        persistence_mode: persistenceMode,
      },
    );

    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  const profileResult = signInData.user
    ? await getActiveProfileForUser(supabase, signInData.user)
    : { status: "verification_failed" as const };

  if (profileResult.status !== "active") {
    await supabase.auth.signOut({
      scope: "local",
    });
    await clearAuthPersistenceCookie();
    const event =
      profileResult.status === "inactive"
        ? "inactive_account_denied"
        : profileResult.status === "invalid_role"
          ? "invalid_role_denied"
          : profileResult.status === "missing"
            ? "missing_profile_denied"
            : "authentication_verification_failed";
    await auditSecurityEvent(
      context,
      event,
      "denied",
      event === "authentication_verification_failed"
        ? { reason_code: "verification_failed" }
        : {
            profile_status:
              profileResult.status === "inactive"
                ? "inactive"
                : profileResult.status === "invalid_role"
                  ? "invalid_role"
                  : "missing",
          },
    );

    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  (await cookies()).set(invitationCookieDeletionOptions());
  await Promise.all([
    clearRateLimit(
      "login_targeted",
      context,
      [emailId],
    ),
    auditSecurityEvent(
      context,
      "login_succeeded",
      "succeeded",
      {
        provider: "supabase",
        persistence_mode: persistenceMode,
        role: profileResult.profile.role,
      },
      profileResult.profile.id,
    ),
  ]);

  return {
    success: true,
    destination: getRoleDestination(
      profileResult.profile.role,
    ),
  };
}

export async function requestPasswordReset(
  input: unknown,
): Promise<ForgotPasswordResult> {
  const email =
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Object.keys(input).every(
      (key) => key === "email",
    )
      ? normalizeEmail(
          (input as Record<string, unknown>)
            .email,
        )
      : "";

  let context;

  try {
    context = await securityContext(
      "forgot_password_action",
    );
    const decisions = await checkRecoveryRateLimit(
      "request",
      context,
      isValidEmail(email)
        ? emailIdentifier(email)
        : undefined,
    );

    if (isBlocked(...decisions)) {
      return {
        success: true,
        message: GENERIC_RECOVERY_MESSAGE,
      };
    }
  } catch {
    return {
      success: true,
      message: GENERIC_RECOVERY_MESSAGE,
    };
  }

  if (isValidEmail(email)) {
    try {
      assertRecoveryConfiguration();
      const supabase = await createClient();
      const redirectTo = new URL(
        "/auth/callback",
        getTrustedAppOrigin(),
      ).toString();

      await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo },
      );
    } catch {
      // Provider and configuration details are intentionally not public.
    }
  }

  await recordRecoverySecurityEvent(
    "password_reset_requested",
    context,
  );

  return {
    success: true,
    message: GENERIC_RECOVERY_MESSAGE,
  };
}

async function clearRecoveryCookie() {
  const cookieStore = await cookies();
  const options =
    recoveryCookieDeletionOptions();

  cookieStore.set(
    options.name,
    options.value,
    options,
  );
}

export async function resetPassword(
  input: unknown,
): Promise<ResetPasswordResult> {
  let context;

  try {
    context = await securityContext(
      "reset_password_action",
    );
    const [ipDecision] =
      await checkRecoveryRateLimit(
        "reset",
        context,
      );

    if (isBlocked(ipDecision)) {
      return {
        success: false,
        code: "reset_failed",
        message: GENERIC_RESET_ERROR,
      };
    }
  } catch {
    return {
      success: false,
      code: "reset_failed",
      message: GENERIC_RESET_ERROR,
    };
  }

  const record =
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Object.keys(input).every(
      (key) =>
        key === "password" ||
        key === "confirmation",
    )
      ? (input as Record<string, unknown>)
      : null;
  const password =
    typeof record?.password === "string"
      ? record.password
      : "";
  const confirmation =
    typeof record?.confirmation === "string"
      ? record.confirmation
      : "";

  if (password !== confirmation) {
    await recordRecoverySecurityEvent(
      "password_reset_failed",
      context,
    );
    return {
      success: false,
      code: "password_mismatch",
      message:
        "The password confirmation does not match.",
    };
  }

  if (
    password.trim().length === 0 ||
    password.length < 12 ||
    password.length > 4096
  ) {
    await recordRecoverySecurityEvent(
      "password_reset_failed",
      context,
    );
    return {
      success: false,
      code: "password_policy",
      message:
        "Use at least 12 characters for your new password.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const recoveryValue = cookieStore.get(
    AUTH_RECOVERY_COOKIE_NAME,
  )?.value;

  if (
    userError ||
    !user ||
    !verifyRecoveryState(
      recoveryValue,
      user.id,
    )
  ) {
    await clearRecoveryCookie();
    await recordRecoverySecurityEvent(
      "password_recovery_rejected",
      context,
      user?.id,
    );

    return {
      success: false,
      code: "invalid_recovery",
      message:
        "This password reset link is invalid or has expired. Request a new link.",
    };
  }

  const recoveryIdentifier =
    recoveryContextIdentifier(user.id);
  const targetedDecision = await enforceRateLimit(
    "reset_password_targeted",
    context,
    [recoveryIdentifier],
  );

  if (isBlocked(targetedDecision)) {
    return {
      success: false,
      code: "reset_failed",
      message: GENERIC_RESET_ERROR,
    };
  }

  const { error } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) {
    await recordRecoverySecurityEvent(
      "password_reset_failed",
      context,
      user.id,
    );

    return {
      success: false,
      code: "reset_failed",
      message: GENERIC_RESET_ERROR,
    };
  }

  await clearRecoveryCookie();
  await clearAuthPersistenceCookie();
  await auditSecurityEvent(
    context,
    "session_cleanup_performed",
    "cleaned",
    { cleanup_kind: "recovery" },
    user.id,
  );

  const { error: globalSignOutError } =
    await supabase.auth.signOut({
      scope: "global",
    });

  if (globalSignOutError) {
    await supabase.auth.signOut({
      scope: "local",
    });
  }

  await recordRecoverySecurityEvent(
    "password_reset_succeeded",
    context,
    user.id,
  );

  return {
    success: true,
    destination:
      "/login?state=password_reset",
  };
}

export async function logout(): Promise<{
  success: boolean;
}> {
  let context;

  try {
    context = await securityContext("logout_action");
  } catch {
    context = null;
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });
    await clearAuthPersistenceCookie();
    if (context) {
      await auditSecurityEvent(
        context,
        error
          ? "logout_failed"
          : "logout_succeeded",
        error ? "failed" : "succeeded",
        error
          ? {
              logout_scope: "local",
              reason_code: "provider_rejected",
            }
          : { logout_scope: "local" },
      );
      await auditSecurityEvent(
        context,
        "session_cleanup_performed",
        "cleaned",
        { cleanup_kind: "persistence" },
      );
    }

    return { success: !error };
  } catch {
    await clearAuthPersistenceCookie();
    if (context) {
      await auditSecurityEvent(
        context,
        "logout_failed",
        "failed",
        {
          logout_scope: "local",
          reason_code: "provider_rejected",
        },
      );
    }
    return { success: false };
  }
}
