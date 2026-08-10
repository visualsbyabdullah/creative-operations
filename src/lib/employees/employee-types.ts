import type { AppRole } from "@/types/auth";

export type Department = "graphic_design" | "video_editing" | null;
export type WorkloadStatus = "On Track" | "Review Pending" | "Delayed";

export type EmployeeDirectoryRow = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: AppRole;
  department: Department;
  isActive: boolean;
  managerId: string | null;
  managerFullName: string | null;
  activeTaskCount: number;
  completedTaskCount: number;
  reviewPendingCount: number;
  delayedTaskCount: number;
  progressPercent: number | null;
  workloadStatus: WorkloadStatus;
  updatedAt: string;
  nextCursor: string | null;
};

export type EmployeeDetail = EmployeeDirectoryRow & {
  phone: string | null;
  timezone: string | null;
  jobTitle: string | null;
};

