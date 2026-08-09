import { getActiveProfile } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/shared/action-result";
import type {
  AssigneeOption, TaskOption, TaskPage, TaskPageQuery, TaskView,
} from "@/lib/tasks/task-types";
import { parseTaskMutation } from "@/lib/tasks/task-schemas";

function mapTask(row: Record<string, unknown>): TaskView {
  return {
    id: String(row.id), brandId: String(row.brand_id), brandName: String(row.brand_name),
    title: String(row.title), department: row.department as TaskView["department"],
    contentType: String(row.content_type), scheduledDate: String(row.scheduled_date),
    deadlineAt: row.deadline_at
      ? String(row.deadline_at)
      : `${String(row.scheduled_date)}T12:00:00.000Z`,
    hasDeadline: Boolean(row.deadline_at),
    status: row.status as TaskView["status"],
    priority: row.priority as TaskView["priority"], description: String(row.description ?? ""),
    referenceUrl: row.reference_url as string | null, delayReason: row.delay_reason as string | null,
    updatedAt: String(row.updated_at), assigneeIds: row.assignee_ids as string[],
    assigneeNames: row.assignee_names as string[],
    source: row.task_source === "self_created" ? "self_created" : "management_assigned",
  };
}

export async function getSelfTaskOptions(): Promise<TaskOption[]> {
  const actor = await getActiveProfile();
  if (actor.status !== "active" || !["graphic_designer", "video_editor"].includes(actor.profile.role)) return [];
  const client = await createClient();
  const { data, error } = await client.rpc("get_self_task_brand_options_v1");
  return error ? [] : (data ?? []).map((row: { id: string; name: string }) => ({
    id: String(row.id), name: String(row.name),
  }));
}

export async function createSelfTask(input: unknown): Promise<ActionResult<string>> {
  const item = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown> : null;
  const allowed = new Set(["brandId", "title", "scheduledDate", "priority", "description"]);
  const priorities = new Set(["low", "medium", "high", "urgent"]);
  if (!item || Object.keys(item).some((key) => !allowed.has(key)) ||
    typeof item.brandId !== "string" || !/^[0-9a-f-]{36}$/iu.test(item.brandId) ||
    typeof item.title !== "string" || item.title.trim().length < 1 || item.title.trim().length > 160 ||
    typeof item.scheduledDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(item.scheduledDate) ||
    !priorities.has(String(item.priority)) || typeof item.description !== "string" || item.description.length > 5000) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await getActiveProfile();
  if (actor.status !== "active" || !["graphic_designer", "video_editor"].includes(actor.profile.role)) {
    return { ok: false, code: "forbidden" };
  }
  const client = await createClient();
  const { data, error } = await client.rpc("create_self_task_v1", {
    p_brand_id: item.brandId,
    p_title: item.title.trim(),
    p_scheduled_date: item.scheduledDate,
    p_priority: item.priority,
    p_description: item.description,
  });
  if (error?.code === "42501") return { ok: false, code: "forbidden" };
  if (error?.code === "22023") return { ok: false, code: "validation_failed" };
  return error || typeof data !== "string"
    ? { ok: false, code: "temporarily_unavailable" }
    : { ok: true, data };
}

export async function listTasks(): Promise<ActionResult<TaskView[]>> {
  const actor = await getActiveProfile();
  if (actor.status !== "active") return { ok: false, code: "unauthenticated" };
  const client = await createClient();
  const { data, error } = await client.rpc("get_tasks_v2");
  if (error) return { ok: false, code: "temporarily_unavailable" };
  return { ok: true, data: (data ?? []).map((row: unknown) => mapTask(row as Record<string, unknown>)) };
}

export async function listTaskPage(
  query: TaskPageQuery,
): Promise<ActionResult<TaskPage>> {
  const actor = await getActiveProfile();
  if (actor.status !== "active") return { ok: false, code: "unauthenticated" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(query.startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(query.endDate)) {
    return { ok: false, code: "validation_failed" };
  }
  const pageSize = query.pageSize ?? 50;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return { ok: false, code: "validation_failed" };
  }
  const client = await createClient();
  const { data, error } = await client.rpc("query_tasks_page_v3", {
    p_start_date: query.startDate,
    p_end_date: query.endDate,
    p_search: query.search?.trim() || null,
    p_status: query.status ?? null,
    p_priority: query.priority ?? null,
    p_brand_id: query.brandId ?? null,
    p_assignee_id: query.assigneeId ?? null,
    p_department: query.department ?? null,
    p_sort: "scheduled_date",
    p_page_size: pageSize,
    p_cursor: query.cursor ?? null,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, code: error?.code === "22023" || error?.code === "22007"
      ? "validation_failed" : "temporarily_unavailable" };
  }
  const payload = data as Record<string, unknown>;
  const rows = Array.isArray(payload.items) ? payload.items : [];
  return {
    ok: true,
    data: {
      items: rows.map((row) => mapTask(row as Record<string, unknown>)),
      nextCursor: typeof payload.next_cursor === "string" ? payload.next_cursor : null,
    },
  };
}

export async function getPlannerOptions(): Promise<{
  brands: TaskOption[];
  assignees: AssigneeOption[];
}> {
  const actor = await getActiveProfile();
  if (actor.status !== "active") return { brands: [], assignees: [] };
  const client = await createClient();
  const [brands, profiles] = await Promise.all([
    client.from("brands").select("id,name").eq("status","active").order("name"),
    client.from("profiles").select("id,full_name,department,role")
      .eq("is_active",true).in("role",["graphic_designer","video_editor"]).order("full_name"),
  ]);
  return {
    brands: (brands.data ?? []).map((row) => ({ id: String(row.id), name: String(row.name) })),
    assignees: (profiles.data ?? []).map((row) => ({
      id: String(row.id), name: String(row.full_name),
      department: row.department as AssigneeOption["department"],
    })),
  };
}

export async function createAssignedTask(input: unknown): Promise<ActionResult<string>> {
  const parsed = parseTaskMutation(input, false);
  if (!parsed) return { ok: false, code: "validation_failed" };
  const actor = await getActiveProfile();
  if (actor.status !== "active" || (actor.profile.role !== "manager" && actor.profile.role !== "hr")) {
    return { ok: false, code: "forbidden" };
  }
  const client = await createClient();
  const { data, error } = await client.rpc("create_assigned_task_v2", {
    p_brand_id: parsed.brandId, p_title: parsed.title, p_department: parsed.department,
    p_content_type: parsed.contentType, p_scheduled_date: parsed.scheduledDate,
    p_deadline_at: parsed.deadlineAt, p_priority: parsed.priority,
    p_description: parsed.description, p_reference_url: parsed.referenceUrl,
    p_assignee_ids: parsed.assigneeIds,
  });
  if (error || typeof data !== "string") return { ok: false, code: "temporarily_unavailable" };
  return { ok: true, data };
}

export async function editAssignedTask(input: unknown): Promise<ActionResult<true>> {
  const parsed = parseTaskMutation(input, true);
  if (!parsed?.taskId || !parsed.expectedUpdatedAt) return { ok: false, code: "validation_failed" };
  const actor = await getActiveProfile();
  if (actor.status !== "active" || (actor.profile.role !== "manager" && actor.profile.role !== "hr")) {
    return { ok: false, code: "forbidden" };
  }
  const client = await createClient();
  const updated = await client.rpc("edit_and_reassign_task_v3", {
    p_task_id: parsed.taskId, p_brand_id: parsed.brandId, p_title: parsed.title,
    p_department: parsed.department, p_content_type: parsed.contentType,
    p_scheduled_date: parsed.scheduledDate, p_deadline_at: parsed.deadlineAt,
    p_priority: parsed.priority, p_description: parsed.description,
    p_reference_url: parsed.referenceUrl, p_assignee_ids: parsed.assigneeIds,
    p_expected_updated_at: parsed.expectedUpdatedAt,
  });
  if (updated.error?.code === "40001") return { ok: false, code: "stale_update" };
  if (updated.error) return { ok: false, code: "temporarily_unavailable" };
  return { ok: true, data: true };
}

export async function transitionTask(
  input: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, code: "validation_failed" };
  }
  const value = input as Record<string, unknown>;
  const allowed = new Set(["taskId","expectedFrom","toStatus","reason"]);
  if (Object.keys(value).some((key) => !allowed.has(key)) ||
    typeof value.taskId !== "string" || typeof value.expectedFrom !== "string" ||
    typeof value.toStatus !== "string" ||
    (value.reason !== null && typeof value.reason !== "string")) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await getActiveProfile();
  if (actor.status !== "active") return { ok: false, code: "unauthenticated" };
  const client = await createClient();
  const { data, error } = await client.rpc("transition_task_v2", {
    p_task_id: value.taskId, p_expected_from: value.expectedFrom,
    p_to_status: value.toStatus, p_reason: value.reason,
  });
  if (!error && typeof data === "string") {
    return { ok: true, data: { updatedAt: data } };
  }
  if (error?.code === "P0002") return { ok: false, code: "stale_update" };
  if (error?.code === "22023") return { ok: false, code: "validation_failed" };
  if (error?.code === "42501") return { ok: false, code: "forbidden" };
  return { ok: false, code: "temporarily_unavailable" };
}

export async function submitTaskWork(input: unknown): Promise<ActionResult<{ submissionId: string }>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, code: "validation_failed" };
  }
  const value = input as Record<string, unknown>;
  const allowed = new Set([
    "taskId","expectedUpdatedAt","idempotencyKey","type","sourceUrl","finalUrl","notes",
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key)) ||
    typeof value.taskId !== "string" ||
    typeof value.expectedUpdatedAt !== "string" ||
    typeof value.idempotencyKey !== "string" ||
    (value.type !== "design" && value.type !== "video") ||
    (value.sourceUrl !== null && (typeof value.sourceUrl !== "string" ||
      !value.sourceUrl.startsWith("https://"))) ||
    typeof value.finalUrl !== "string" || !value.finalUrl.startsWith("https://") ||
    typeof value.notes !== "string" || value.notes.length > 5000) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await getActiveProfile();
  if (actor.status !== "active" ||
    (actor.profile.role !== "graphic_designer" && actor.profile.role !== "video_editor")) {
    return { ok: false, code: "forbidden" };
  }
  const client = await createClient();
  const { data, error } = await client.rpc("atomic_submit_task_v2", {
    p_task_id: value.taskId, p_expected_updated_at: value.expectedUpdatedAt,
    p_idempotency_key: value.idempotencyKey, p_type: value.type,
    p_source_url: value.sourceUrl, p_final_url: value.finalUrl, p_notes: value.notes,
  });
  if (error?.code === "40001") return { ok: false, code: "stale_update" };
  if (error?.code === "23505") return { ok: false, code: "idempotency_conflict" };
  const row = data?.[0] as Record<string, unknown> | undefined;
  return error || !row
    ? { ok: false, code: "temporarily_unavailable" }
    : { ok: true, data: { submissionId: String(row.submission_id) } };
}
