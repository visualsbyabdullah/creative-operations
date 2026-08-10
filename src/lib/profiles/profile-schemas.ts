import type { NotificationPreferences } from "@/lib/profiles/profile-types";

export type SelfProfileUpdate = {
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  timezone: string | null;
  preferences: NotificationPreferences;
  expectedUpdatedAt: string;
};

const keys = new Set([
  "fullName",
  "avatarUrl",
  "phone",
  "timezone",
  "preferences",
  "expectedUpdatedAt",
]);
const preferenceKeys = new Set([
  "newTaskAssignments",
  "deadlineReminders",
  "revisionRequests",
  "approvalUpdates",
  "publishingUpdates",
  "emailEnabled",
  "inAppEnabled",
]);

export function parseSelfProfileUpdate(value: unknown): SelfProfileUpdate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !keys.has(key))) return null;
  if (
    typeof input.fullName !== "string" ||
    input.fullName.trim().length < 1 ||
    input.fullName.trim().length > 120 ||
    /[\u0000-\u001f\u007f]/u.test(input.fullName) ||
    (input.avatarUrl !== null &&
      (typeof input.avatarUrl !== "string" ||
        input.avatarUrl.length > 2048 ||
        !input.avatarUrl.startsWith("https://"))) ||
    (input.phone !== null &&
      (typeof input.phone !== "string" ||
        !/^[+0-9 ().-]{3,32}$/u.test(input.phone))) ||
    (input.timezone !== null &&
      (typeof input.timezone !== "string" || input.timezone.length > 64)) ||
    typeof input.expectedUpdatedAt !== "string" ||
    !Number.isFinite(Date.parse(input.expectedUpdatedAt)) ||
    !input.preferences ||
    typeof input.preferences !== "object" ||
    Array.isArray(input.preferences)
  ) return null;

  const preferences = input.preferences as Record<string, unknown>;
  if (
    Object.keys(preferences).length !== preferenceKeys.size ||
    Object.keys(preferences).some((key) => !preferenceKeys.has(key)) ||
    Object.values(preferences).some((item) => typeof item !== "boolean")
  ) return null;

  if (input.timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: input.timezone }).format();
    } catch {
      return null;
    }
  }

  return {
    fullName: input.fullName.trim(),
    avatarUrl: input.avatarUrl,
    phone: input.phone ? input.phone.trim() : null,
    timezone: input.timezone,
    preferences: preferences as NotificationPreferences,
    expectedUpdatedAt: input.expectedUpdatedAt,
  };
}

