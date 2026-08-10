import {
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
  type SelfProfile,
} from "@/lib/profiles/profile-types";
import type { AppRole } from "@/types/auth";

export function mapPreferences(row: Record<string, unknown> | null): NotificationPreferences {
  if (!row) return DEFAULT_PREFERENCES;
  return {
    newTaskAssignments: Boolean(row.new_task_assignments),
    deadlineReminders: Boolean(row.deadline_reminders),
    revisionRequests: Boolean(row.revision_requests),
    approvalUpdates: Boolean(row.approval_updates),
    publishingUpdates: Boolean(row.publishing_updates),
    emailEnabled: Boolean(row.email_enabled),
    inAppEnabled: Boolean(row.in_app_enabled),
  };
}

export function mapSelfProfile(
  row: Record<string, unknown>,
  preferences: Record<string, unknown> | null,
): SelfProfile {
  return {
    id: String(row.id),
    email: String(row.email),
    fullName: String(row.full_name),
    role: row.role as AppRole,
    department: row.department as string | null,
    jobTitle: row.job_title as string | null,
    phone: row.phone as string | null,
    timezone: row.timezone as string | null,
    avatarUrl: row.avatar_url as string | null,
    avatarPath: row.avatar_path as string | null,
    isActive: Boolean(row.is_active),
    managerId: row.manager_id as string | null,
    updatedAt: String(row.updated_at),
    preferences: mapPreferences(preferences),
  };
}
