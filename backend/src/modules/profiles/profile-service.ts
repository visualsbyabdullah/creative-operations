import "server-only";

import { getActiveProfile } from "@backend/modules/auth/authorization";
import { mapSelfProfile } from "@backend/modules/profiles/profile-mappers";
import { readSelfProfileResult, updateSelfSettings } from "@backend/modules/profiles/profile-repository";
import { parseSelfProfileUpdate } from "@backend/modules/profiles/profile-schemas";
import type { ActionResult } from "@shared/contracts/action-result";
import {
  businessRateLimitDenied,
  enforceBusinessRateLimit,
} from "@backend/security/business-rate-limit";

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

export async function requestSelfEmailChange(input: unknown): Promise<ActionResult<true>> {
  const email = input && typeof input === "object" && !Array.isArray(input) &&
    Object.keys(input).every((key) => key === "email") &&
    typeof (input as Record<string, unknown>).email === "string"
    ? String((input as Record<string, unknown>).email).trim().toLowerCase()
    : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await getActiveProfile();
  if (actor.status !== "active") return { ok: false, code: "unauthenticated" };
  if (actor.profile.email.toLowerCase() === email) {
    return { ok: false, code: "validation_failed" };
  }
  const limit = await enforceBusinessRateLimit("profile_write", actor.profile.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const { createClient } = await import("@backend/supabase/server");
  const client = await createClient();
  const { error } = await client.auth.updateUser({ email });
  if (!error) return { ok: true, data: true };
  if (
    error.code === "email_exists" ||
    error.code === "user_already_exists" ||
    error.status === 422
  ) {
    return { ok: false, code: "email_conflict" };
  }
  return { ok: false, code: "temporarily_unavailable" };
}

export async function changeSelfPassword(input: unknown): Promise<ActionResult<true>> {
  const record = input && typeof input === "object" && !Array.isArray(input) &&
    Object.keys(input).every((key) => ["currentPassword", "newPassword", "confirmation"].includes(key))
    ? input as Record<string, unknown> : null;
  const currentPassword = typeof record?.currentPassword === "string" ? record.currentPassword : "";
  const newPassword = typeof record?.newPassword === "string" ? record.newPassword : "";
  const confirmation = typeof record?.confirmation === "string" ? record.confirmation : "";
  if (!currentPassword || newPassword !== confirmation || newPassword.length < 12 || newPassword.length > 4096) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await getActiveProfile();
  if (actor.status !== "active") return { ok: false, code: "unauthenticated" };
  const limit = await enforceBusinessRateLimit("profile_write", actor.profile.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const { createClient } = await import("@backend/supabase/server");
  const client = await createClient();
  const verified = await client.auth.signInWithPassword({
    email: actor.profile.email,
    password: currentPassword,
  });
  if (verified.error) return { ok: false, code: "forbidden" };
  const { error } = await client.auth.updateUser({ password: newPassword });
  return error ? { ok: false, code: "temporarily_unavailable" } : { ok: true, data: true };
}
