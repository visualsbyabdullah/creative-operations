import type { AppRole } from "@shared/contracts/auth";

export type NotificationPreferences = {
  newTaskAssignments: boolean;
  deadlineReminders: boolean;
  revisionRequests: boolean;
  approvalUpdates: boolean;
  publishingUpdates: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

export type SelfProfile = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  department: string | null;
  jobTitle: string | null;
  phone: string | null;
  timezone: string | null;
  avatarUrl: string | null;
  avatarPath: string | null;
  isActive: boolean;
  managerId: string | null;
  updatedAt: string;
  preferences: NotificationPreferences;
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  newTaskAssignments: true,
  deadlineReminders: true,
  revisionRequests: true,
  approvalUpdates: true,
  publishingUpdates: true,
  emailEnabled: true,
  inAppEnabled: true,
};
