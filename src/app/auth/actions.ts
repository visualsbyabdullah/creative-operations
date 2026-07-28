"use server";

import {
  getActiveProfile,
  getRoleDestination,
} from "@/lib/auth/authorization";
import { modeFromRememberMe } from "@/lib/auth/persistence";
import {
  checkRecoveryRateLimit,
  recordRecoverySecurityEvent,
} from "@/lib/auth/recovery-integration";
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
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
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
    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  const persistenceMode =
    modeFromRememberMe(record.rememberMe);

  const supabase = await createClient(
    persistenceMode,
  );
  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    await clearAuthPersistenceCookie();

    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

  const profileResult = await getActiveProfile();

  if (profileResult.status !== "active") {
    await supabase.auth.signOut({
      scope: "local",
    });
    await clearAuthPersistenceCookie();

    return {
      success: false,
      message: GENERIC_LOGIN_ERROR,
    };
  }

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
  await checkRecoveryRateLimit("request");

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
  await checkRecoveryRateLimit("reset");

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
      user?.id,
    );

    return {
      success: false,
      code: "invalid_recovery",
      message:
        "This password reset link is invalid or has expired. Request a new link.",
    };
  }

  const { error } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) {
    await recordRecoverySecurityEvent(
      "password_reset_failed",
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
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });
    await clearAuthPersistenceCookie();

    return { success: !error };
  } catch {
    await clearAuthPersistenceCookie();
    return { success: false };
  }
}
