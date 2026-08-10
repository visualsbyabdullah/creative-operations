import { isAppRole, type AppRole } from "@/types/auth";
import type { Department } from "@/lib/employees/employee-types";

export type EmployeeListInput = {
  search: string;
  roles: AppRole[] | null;
  departments: Exclude<Department, null>[] | null;
  isActive: boolean | null;
  sort: "full_name" | "email" | "role" | "department" | "is_active" |
    "active_task_count" | "completed_task_count" | "delayed_task_count" |
    "progress_percent" | "updated_at" | "id";
  direction: "asc" | "desc";
  limit: number;
  cursor: string | null;
};

export type InviteEmployeeInput = {
  email: string;
  fullName: string;
  role: AppRole;
  department: Department;
  managerId: string | null;
};

export type ManagedEmployeeUpdate = {
  profileId: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  timezone: string | null;
  role: AppRole;
  department: Department;
  isActive: boolean;
  managerId: string | null;
  expectedUpdatedAt: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const sorts = new Set<EmployeeListInput["sort"]>([
  "full_name", "email", "role", "department", "is_active",
  "active_task_count", "completed_task_count", "delayed_task_count",
  "progress_percent", "updated_at", "id",
]);

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export function parseEmployeeList(value: unknown): EmployeeListInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const allowed = new Set(["search","roles","departments","isActive","sort","direction","limit","cursor"]);
  if (Object.keys(item).some((key) => !allowed.has(key))) return null;
  const roles = item.roles === null ? null : item.roles;
  const departments = item.departments === null ? null : item.departments;
  if (
    typeof item.search !== "string" || item.search.length > 100 ||
    !Array.isArray(roles) && roles !== null ||
    Array.isArray(roles) && (roles.length > 4 || roles.some((role) => !isAppRole(role))) ||
    !Array.isArray(departments) && departments !== null ||
    Array.isArray(departments) && (departments.length > 2 ||
      departments.some((d) => d !== "graphic_design" && d !== "video_editing")) ||
    typeof item.sort !== "string" || !sorts.has(item.sort as EmployeeListInput["sort"]) ||
    (item.direction !== "asc" && item.direction !== "desc") ||
    !Number.isInteger(item.limit) || Number(item.limit) < 1 || Number(item.limit) > 100 ||
    (item.cursor !== null && (typeof item.cursor !== "string" || item.cursor.length > 1024)) ||
    (item.isActive !== null && typeof item.isActive !== "boolean")
  ) return null;
  return item as EmployeeListInput;
}

export function parseInviteEmployee(value: unknown): InviteEmployeeInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const allowed = new Set(["email","fullName","role","department","managerId"]);
  const normalizedEmail =
    typeof item.email === "string" ? item.email.trim().toLowerCase() : "";
  if (
    Object.keys(item).some((key) => !allowed.has(key)) ||
    normalizedEmail.length > 254 || !EMAIL.test(normalizedEmail) ||
    typeof item.fullName !== "string" || item.fullName.trim().length < 1 ||
    item.fullName.trim().length > 120 || !isAppRole(item.role) ||
    (item.managerId !== null && !isUuid(item.managerId))
  ) return null;
  const department = item.department;
  if (
    (item.role === "graphic_designer" && department !== "graphic_design") ||
    (item.role === "video_editor" && department !== "video_editing") ||
    ((item.role === "manager" || item.role === "hr") && department !== null)
  ) return null;
  return {
    email: normalizedEmail,
    fullName: item.fullName.trim(),
    role: item.role,
    department: department as Department,
    managerId: item.managerId as string | null,
  };
}

export function parseManagedEmployeeUpdate(value: unknown): ManagedEmployeeUpdate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const allowed = new Set([
    "profileId","fullName","avatarUrl","phone","timezone","role","department",
    "isActive","managerId","expectedUpdatedAt",
  ]);
  if (
    Object.keys(item).some((key) => !allowed.has(key)) ||
    !isUuid(item.profileId) ||
    typeof item.fullName !== "string" || item.fullName.trim().length < 1 ||
    item.fullName.trim().length > 120 || !isAppRole(item.role) ||
    typeof item.isActive !== "boolean" ||
    (item.managerId !== null && !isUuid(item.managerId)) ||
    (item.avatarUrl !== null && (typeof item.avatarUrl !== "string" ||
      !item.avatarUrl.startsWith("https://") || item.avatarUrl.length > 2048)) ||
    (item.phone !== null && (typeof item.phone !== "string" ||
      !/^[+0-9 ().-]{3,32}$/u.test(item.phone))) ||
    (item.timezone !== null && (typeof item.timezone !== "string" ||
      item.timezone.length > 64)) ||
    typeof item.expectedUpdatedAt !== "string" ||
    !Number.isFinite(Date.parse(item.expectedUpdatedAt))
  ) return null;
  const department = item.department;
  if (
    (item.role === "graphic_designer" && department !== "graphic_design") ||
    (item.role === "video_editor" && department !== "video_editing") ||
    ((item.role === "manager" || item.role === "hr") && department !== null)
  ) return null;
  return {
    profileId: item.profileId,
    fullName: item.fullName.trim(),
    avatarUrl: item.avatarUrl as string | null,
    phone: item.phone as string | null,
    timezone: item.timezone as string | null,
    role: item.role,
    department: department as Department,
    isActive: item.isActive,
    managerId: item.managerId as string | null,
    expectedUpdatedAt: item.expectedUpdatedAt,
  };
}
