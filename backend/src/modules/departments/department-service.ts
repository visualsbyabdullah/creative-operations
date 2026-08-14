import "server-only";

import { getActiveProfile } from "@backend/modules/auth/authorization";
import { createClient } from "@backend/supabase/server";
import {
  businessRateLimitDenied,
  enforceBusinessRateLimit,
} from "@backend/security/business-rate-limit";
import {
  departmentKeyFromName,
  parseDepartmentMutation,
} from "@backend/modules/departments/department-schemas";
import type { ActionResult } from "@shared/contracts/action-result";
import type { DepartmentView } from "@shared/contracts/department-types";

function mapDepartment(row: Record<string, unknown>): DepartmentView {
  return {
    id: String(row.id),
    key: String(row.key),
    name: String(row.name),
    status: row.status as DepartmentView["status"],
    accentColor: row.accent_color as string | null,
    description: row.description as string | null,
    memberCount: Number(row.member_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function managementActor() {
  const actor = await getActiveProfile();
  if (actor.status !== "active") return null;
  if (actor.profile.role !== "manager" && actor.profile.role !== "hr") return null;
  return actor.profile;
}

function mutationCode(
  errorCode: string | undefined,
): Extract<ActionResult<true>, { ok: false }>["code"] {
  if (errorCode === "40001") return "stale_update";
  if (errorCode === "P0002") return "not_found";
  if (errorCode === "23505" || errorCode === "22023") return "validation_failed";
  return "temporarily_unavailable";
}

export async function listDepartments(): Promise<ActionResult<DepartmentView[]>> {
  const actor = await getActiveProfile();
  if (actor.status !== "active") return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("department_read", actor.profile.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { data, error } = await client.rpc("list_departments");
  if (error) return { ok: false, code: "temporarily_unavailable" };
  return {
    ok: true,
    data: (data ?? []).map((row: Record<string, unknown>) => mapDepartment(row)),
  };
}

export async function createDepartment(input: unknown): Promise<ActionResult<string>> {
  const parsed = parseDepartmentMutation(input, false);
  if (!parsed) return { ok: false, code: "validation_failed" };
  const key = departmentKeyFromName(parsed.name);
  if (!key) return { ok: false, code: "validation_failed" };
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("department_mutation", actor.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { data, error } = await client.rpc("create_department", {
    p_name: parsed.name,
    p_key: key,
    p_description: parsed.description,
    p_accent_color: parsed.accentColor,
  });
  if (error || typeof data !== "string") {
    return { ok: false, code: mutationCode(error?.code) };
  }
  return { ok: true, data };
}

export async function updateDepartment(input: unknown): Promise<ActionResult<true>> {
  const parsed = parseDepartmentMutation(input, true);
  if (!parsed?.departmentId || !parsed.expectedUpdatedAt) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit(
    "department_mutation",
    actor.id,
    parsed.departmentId,
  );
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { error } = await client.rpc("update_department", {
    p_department_id: parsed.departmentId,
    p_name: parsed.name,
    p_description: parsed.description,
    p_accent_color: parsed.accentColor,
    p_expected_updated_at: parsed.expectedUpdatedAt,
  });
  if (error) return { ok: false, code: mutationCode(error.code) };
  return { ok: true, data: true };
}

export async function setDepartmentArchived(input: unknown): Promise<ActionResult<true>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, code: "validation_failed" };
  }
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).some((key) =>
      !["departmentId", "archived", "expectedUpdatedAt"].includes(key)
    ) ||
    typeof value.departmentId !== "string" ||
    typeof value.archived !== "boolean" ||
    typeof value.expectedUpdatedAt !== "string"
  ) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit(
    "department_mutation",
    actor.id,
    value.departmentId,
  );
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { error } = await client.rpc("set_department_archived", {
    p_department_id: value.departmentId,
    p_archived: value.archived,
    p_expected_updated_at: value.expectedUpdatedAt,
  });
  if (error) return { ok: false, code: mutationCode(error.code) };
  return { ok: true, data: true };
}
