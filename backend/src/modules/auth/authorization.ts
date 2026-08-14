import "server-only";

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

import { createClient } from "@backend/supabase/server";
import {
  isAppRole,
  type AppRole,
  type EmployeeProfile,
} from "@shared/contracts/auth";

export const PROFILE_COLUMNS =
  "id, email, full_name, role, department, job_title, avatar_path, avatar_url, timezone, is_active, created_at, updated_at";

export const isManagementRole = (role: AppRole) =>
  role === "manager" || role === "hr";

export const isEmployeeRole = (role: AppRole) =>
  role === "graphic_designer" ||
  role === "video_editor";

export function getRoleDestination(
  role: AppRole,
) {
  // Both role-specific views are dispatched by the existing dashboard route.
  switch (role) {
    case "manager":
    case "hr":
    case "graphic_designer":
    case "video_editor":
      return "/dashboard" as const;
  }
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return error ? null : user;
}

export type ProfileLookup =
  | { status: "active"; profile: EmployeeProfile }
  | {
      status:
        | "unauthenticated"
        | "verification_failed"
        | "missing"
        | "inactive"
        | "invalid_role";
    };

export async function getActiveProfileForUser(
  supabase: SupabaseClient,
  user: User,
): Promise<ProfileLookup> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return { status: "missing" };
  if (!isAppRole(data.role)) return { status: "invalid_role" };
  if (data.is_active !== true) return { status: "inactive" };
  return { status: "active", profile: data as EmployeeProfile };
}

async function lookupActiveProfile(): Promise<ProfileLookup> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError?.name ===
    "AuthSessionMissingError"
  ) {
    return { status: "unauthenticated" };
  }

  if (userError || !user) {
    return {
      status: "verification_failed",
    };
  }

  return getActiveProfileForUser(supabase, user);
}

export const getActiveProfile = cache(lookupActiveProfile);
