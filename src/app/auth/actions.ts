"use server";

import {
  getActiveProfile,
  getRoleDestination,
} from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

const GENERIC_LOGIN_ERROR =
  "Unable to sign in with those credentials.";

export type LoginResult =
  | {
      success: true;
      destination: "/dashboard";
    }
  | {
      success: false;
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

  /*
   * Phase 2B2 integration boundary: rememberMe is validated but must not
   * change cookie persistence until the supported SSR adapter is proven.
   */
  void record.rememberMe;

  const supabase = await createClient();
  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
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

export async function logout(): Promise<{
  success: boolean;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    return { success: !error };
  } catch {
    return { success: false };
  }
}
