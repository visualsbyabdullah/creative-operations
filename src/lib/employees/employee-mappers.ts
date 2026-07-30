import type {
  EmployeeDetail,
  EmployeeDirectoryRow,
} from "@/lib/employees/employee-types";
import type { AppRole } from "@/types/auth";

export function mapEmployee(row: Record<string, unknown>): EmployeeDirectoryRow {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    avatarUrl: row.avatar_url as string | null,
    role: row.role as AppRole,
    department: row.department as EmployeeDirectoryRow["department"],
    isActive: Boolean(row.is_active),
    managerId: row.manager_id as string | null,
    managerFullName: row.manager_full_name as string | null,
    activeTaskCount: Number(row.active_task_count),
    completedTaskCount: Number(row.completed_task_count),
    reviewPendingCount: Number(row.review_pending_count),
    delayedTaskCount: Number(row.delayed_task_count),
    progressPercent: row.progress_percent === null ? null : Number(row.progress_percent),
    workloadStatus: row.workload_status as EmployeeDirectoryRow["workloadStatus"],
    updatedAt: String(row.updated_at),
    nextCursor: null,
  };
}

export function mapEmployeeDetail(row: Record<string, unknown>): EmployeeDetail {
  return {
    ...mapEmployee(row),
    phone: row.phone as string | null,
    timezone: row.timezone as string | null,
    jobTitle: row.job_title as string | null,
  };
}
