import "server-only";

import { apiFailure, apiSuccess } from "@backend/api/responses/api-response";
import { listTasks, transitionTask } from "@backend/modules/tasks/task-service";

export async function getAuthorizedTasks() {
  const result = await listTasks();
  return result.ok ? apiSuccess(result.data) : apiFailure(result.code);
}

export async function transitionAuthorizedTask(taskId: string, operation: "start" | "complete") {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(taskId)) {
    return apiFailure("validation_failed");
  }
  const tasks = await listTasks();
  if (!tasks.ok) return apiFailure(tasks.code);
  const task = tasks.data.find((item) => item.id === taskId);
  if (!task) return apiFailure("not_found");

  const allowedFrom = operation === "start"
    ? task.status === "assigned" || task.status === "revision_requested"
    : task.status === "in_progress" && task.source === "self_created";
  if (!allowedFrom) return apiFailure("forbidden");

  const result = await transitionTask({
    taskId,
    expectedFrom: task.status,
    toStatus: operation === "start" ? "in_progress" : "completed",
    reason: null,
  });
  return result.ok ? apiSuccess(result.data) : apiFailure(result.code);
}
