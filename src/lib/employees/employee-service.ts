import { getActiveProfile, isManagementRole } from "@/lib/auth/authorization";
import { mapEmployee, mapEmployeeDetail } from "@/lib/employees/employee-mappers";
import {
  getEmployeeRow,
  listEmployeeRows,
  updateManagedEmployee,
} from "@/lib/employees/employee-repository";
import {
  isUuid,
  parseEmployeeList,
  parseManagedEmployeeUpdate,
} from "@/lib/employees/employee-schemas";
import type { EmployeeDetail, EmployeeDirectoryRow } from "@/lib/employees/employee-types";
import type { ActionResult } from "@/lib/shared/action-result";
import { encodeEmployeeCursor } from "@/lib/employees/employee-cursor";
import {
  businessRateLimitDenied,
  enforceBusinessRateLimit,
} from "@/lib/security/business-rate-limit";

async function managementAllowed() {
  const actor = await getActiveProfile();
  return actor.status === "active" && isManagementRole(actor.profile.role)
    ? actor.profile
    : null;
}

export async function listEmployees(input: unknown): Promise<ActionResult<EmployeeDirectoryRow[]>> {
  const parsed = parseEmployeeList(input);
  if (!parsed) return { ok: false, code: "validation_failed" };
  const actor = await managementAllowed();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("employee_directory_read", actor.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const creativeRoles = ["graphic_designer", "video_editor"] as const;
  const requestedRoles = parsed.roles?.filter((role) =>
    creativeRoles.includes(role as (typeof creativeRoles)[number]));
  const effectiveInput = {
    ...parsed,
    roles: requestedRoles?.length ? requestedRoles : [...creativeRoles],
  };
  const { data, error } = await listEmployeeRows(effectiveInput);
  if (error?.code === "22023") return { ok: false, code: "validation_failed" };
  if (error) return { ok: false, code: "temporarily_unavailable" };
  const rows = (data ?? []).map((row: unknown) =>
    mapEmployee(row as Record<string, unknown>));
  const lastRaw = data?.at(-1) as Record<string, unknown> | undefined;
  if (rows.length === parsed.limit && lastRaw) {
    const query = {
      search: parsed.search,
      roles: effectiveInput.roles,
      departments: parsed.departments,
      isActive: parsed.isActive,
      sort: parsed.sort,
      direction: parsed.direction,
    };
    rows[rows.length - 1].nextCursor = encodeEmployeeCursor(
      query,
      lastRaw.cursor_is_null ? null :
        lastRaw.cursor_value as string | number | boolean | null,
      rows[rows.length - 1].id,
    );
  }
  return {
    ok: true,
    data: rows,
  };
}

export async function getEmployee(profileId: unknown): Promise<ActionResult<EmployeeDetail>> {
  if (!isUuid(profileId)) return { ok: false, code: "validation_failed" };
  const actor = await managementAllowed();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("employee_detail_read", actor.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const { data, error } = await getEmployeeRow(profileId);
  if (error) return { ok: false, code: "not_found" };
  const row = data?.[0];
  return row
    ? { ok: true, data: mapEmployeeDetail(row as Record<string, unknown>) }
    : { ok: false, code: "not_found" };
}

export async function saveManagedEmployee(input: unknown): Promise<ActionResult<EmployeeDirectoryRow>> {
  const parsed = parseManagedEmployeeUpdate(input);
  if (!parsed) return { ok: false, code: "validation_failed" };
  const actor = await managementAllowed();
  if (!actor) return { ok: false, code: "forbidden" };
  const policy = parsed.isActive ? "employee_manage" : "employee_status_change";
  const limit = await enforceBusinessRateLimit(policy, actor.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const { data, error } = await updateManagedEmployee(parsed);
  if (error?.code === "40001") return { ok: false, code: "stale_update" };
  if (error?.code === "23514" && error.message.includes("last active manager")) {
    return { ok: false, code: "last_manager_protected" };
  }
  if (error || !data?.[0]) return { ok: false, code: "temporarily_unavailable" };
  const detail = await getEmployee(parsed.profileId);
  return detail.ok
    ? { ok: true, data: detail.data }
    : { ok: false, code: detail.code };
}
