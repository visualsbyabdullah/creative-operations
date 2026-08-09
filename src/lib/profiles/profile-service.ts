import { getActiveProfile } from "@/lib/auth/authorization";
import { mapSelfProfile } from "@/lib/profiles/profile-mappers";
import { readSelfProfileResult, updateSelfSettings } from "@/lib/profiles/profile-repository";
import { parseSelfProfileUpdate } from "@/lib/profiles/profile-schemas";
import type { ActionResult } from "@/lib/shared/action-result";
import {
  businessRateLimitDenied,
  enforceBusinessRateLimit,
} from "@/lib/security/business-rate-limit";

export async function getSelfProfileResult() {
  const actor = await getActiveProfile();
  if (actor.status !== "active") {
    return { status: "error" as const };
  }
  const result = await readSelfProfileResult(actor.profile.id);
  if (result.status === "error") {
    console.error("Self-profile read unavailable.", {
      source: result.source,
      code: result.code,
    });
    return { status: "error" as const };
  }
  if (result.status === "missing") return result;
  return {
    status: "ok" as const,
    profile: mapSelfProfile(
      result.profile,
      result.preferences,
    ),
  };
}

export async function getSelfProfile() {
  const result = await getSelfProfileResult();
  return result.status === "ok"
    ? result.profile
    : null;
}

export async function saveSelfProfile(input: unknown): Promise<ActionResult<true>> {
  const parsed = parseSelfProfileUpdate(input);
  if (!parsed) return { ok: false, code: "validation_failed" };
  const actor = await getActiveProfile();
  if (actor.status !== "active") return { ok: false, code: "unauthenticated" };
  const limit = await enforceBusinessRateLimit("profile_write", actor.profile.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const { error } = await updateSelfSettings({
    p_full_name: parsed.fullName,
    p_avatar_url: parsed.avatarUrl,
    p_phone: parsed.phone,
    p_timezone: parsed.timezone,
    p_preferences: {
      new_task_assignments: parsed.preferences.newTaskAssignments,
      deadline_reminders: parsed.preferences.deadlineReminders,
      revision_requests: parsed.preferences.revisionRequests,
      approval_updates: parsed.preferences.approvalUpdates,
      publishing_updates: parsed.preferences.publishingUpdates,
      email_enabled: parsed.preferences.emailEnabled,
      in_app_enabled: parsed.preferences.inAppEnabled,
    },
    p_expected_updated_at: parsed.expectedUpdatedAt,
  });
  if (!error) return { ok: true, data: true };
  if (error.code === "40001") return { ok: false, code: "stale_update" };
  return { ok: false, code: "temporarily_unavailable" };
}
