import type { TaskPriority, TaskStatus } from "@/lib/tasks/task-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const priorities = new Set<TaskPriority>(["low","medium","high","urgent"]);
const statuses = new Set<TaskStatus>([
  "draft","assigned","in_progress","submitted","revision_requested","completed","archived",
]);

export type TaskMutation = {
  taskId?: string;
  brandId: string;
  title: string;
  department: "graphic_design" | "video_editing";
  contentType: string;
  scheduledDate: string;
  deadlineAt: string;
  priority: TaskPriority;
  description: string;
  referenceUrl: string | null;
  assigneeIds: string[];
  expectedUpdatedAt?: string;
};

export function parseTaskMutation(value: unknown, editing: boolean): TaskMutation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const allowed = new Set([
    "taskId","brandId","title","department","contentType","scheduledDate",
    "deadlineAt","priority","description","referenceUrl","assigneeIds","expectedUpdatedAt",
  ]);
  if (Object.keys(item).some((key) => !allowed.has(key)) ||
    !UUID.test(String(item.brandId)) ||
    typeof item.title !== "string" || item.title.trim().length < 1 || item.title.trim().length > 160 ||
    (item.department !== "graphic_design" && item.department !== "video_editing") ||
    typeof item.contentType !== "string" || item.contentType.trim().length < 1 || item.contentType.length > 80 ||
    typeof item.scheduledDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(item.scheduledDate) ||
    typeof item.deadlineAt !== "string" || !Number.isFinite(Date.parse(item.deadlineAt)) ||
    !priorities.has(item.priority as TaskPriority) ||
    typeof item.description !== "string" || item.description.length > 5000 ||
    (item.referenceUrl !== null && (typeof item.referenceUrl !== "string" ||
      !item.referenceUrl.startsWith("https://") || item.referenceUrl.length > 2048)) ||
    !Array.isArray(item.assigneeIds) || item.assigneeIds.length < 1 ||
    item.assigneeIds.length > 20 || item.assigneeIds.some((id) => !UUID.test(String(id))) ||
    (editing && (!UUID.test(String(item.taskId)) ||
      typeof item.expectedUpdatedAt !== "string" ||
      !Number.isFinite(Date.parse(item.expectedUpdatedAt)))) ||
    (!editing && (item.taskId !== undefined || item.expectedUpdatedAt !== undefined))
  ) return null;
  return {
    taskId: item.taskId as string | undefined, brandId: item.brandId as string,
    title: item.title.trim(), department: item.department, contentType: item.contentType.trim(),
    scheduledDate: item.scheduledDate, deadlineAt: item.deadlineAt,
    priority: item.priority as TaskPriority, description: item.description,
    referenceUrl: item.referenceUrl as string | null,
    assigneeIds: [...new Set(item.assigneeIds as string[])],
    expectedUpdatedAt: item.expectedUpdatedAt as string | undefined,
  };
}

export function isCanonicalTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && statuses.has(value as TaskStatus);
}
