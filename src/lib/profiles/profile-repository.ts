import { createClient } from "@/lib/supabase/server";

export const SELF_PROFILE_COLUMNS =
  "id,email,full_name,role,department,job_title,phone,timezone,avatar_path,avatar_url,is_active,manager_id,updated_at";

export async function readSelfProfile(profileId: string) {
  const client = await createClient();
  const [profile, preferences] = await Promise.all([
    client.from("profiles").select(SELF_PROFILE_COLUMNS).eq("id", profileId).maybeSingle(),
    client.from("notification_preferences").select(
      "new_task_assignments,deadline_reminders,revision_requests,approval_updates,publishing_updates,email_enabled,in_app_enabled",
    ).eq("profile_id", profileId).maybeSingle(),
  ]);
  if (profile.error || !profile.data || preferences.error) return null;
  return { profile: profile.data, preferences: preferences.data };
}

export async function updateSelfSettings(parameters: Record<string, unknown>) {
  const client = await createClient();
  return client.rpc("update_own_settings_v2", parameters);
}
