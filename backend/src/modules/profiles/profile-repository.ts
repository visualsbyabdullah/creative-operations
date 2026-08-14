import "server-only";

import { createClient } from "@backend/supabase/server";

export const SELF_PROFILE_COLUMNS =
  "id,email,full_name,role,department,job_title,phone,timezone,avatar_path,avatar_url,is_active,manager_id,updated_at";

export type SelfProfileReadResult =
  | {
      status: "ok";
      profile: Record<string, unknown>;
      preferences: Record<string, unknown> | null;
    }
  | { status: "missing" }
  | {
      status: "error";
      source: "profile" | "preferences";
      code?: string;
    };

export async function readSelfProfileResult(
  profileId: string,
): Promise<SelfProfileReadResult> {
  const client = await createClient();
  const [profile, preferences] = await Promise.all([
    client.from("profiles").select(SELF_PROFILE_COLUMNS).eq("id", profileId).maybeSingle(),
    client.from("notification_preferences").select(
      "new_task_assignments,deadline_reminders,revision_requests,approval_updates,publishing_updates,email_enabled,in_app_enabled",
    ).eq("profile_id", profileId).maybeSingle(),
  ]);
  if (profile.error) {
    return {
      status: "error",
      source: "profile",
      code: profile.error.code,
    };
  }
  if (!profile.data) return { status: "missing" };
  if (preferences.error) {
    return {
      status: "error",
      source: "preferences",
      code: preferences.error.code,
    };
  }
  return {
    status: "ok",
    profile: profile.data,
    preferences: preferences.data,
  };
}

export async function readSelfProfile(profileId: string) {
  const result = await readSelfProfileResult(profileId);
  return result.status === "ok"
    ? {
        profile: result.profile,
        preferences: result.preferences,
      }
    : null;
}

export async function updateSelfSettings(parameters: Record<string, unknown>) {
  const client = await createClient();
  return client.rpc("update_own_settings_v2", parameters);
}
