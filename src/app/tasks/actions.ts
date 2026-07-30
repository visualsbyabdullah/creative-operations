"use server";

import { revalidatePath } from "next/cache";
import {
  createAssignedTask,
  editAssignedTask,
  submitTaskWork,
  transitionTask,
} from "@/lib/tasks/task-service";

export async function transitionTaskAction(input: unknown) {
  const result = await transitionTask(input);
  if (result.ok) {
    revalidatePath("/tasks");
    revalidatePath("/planner");
  }
  return result;
}

export async function createTaskAction(input: unknown) {
  const result = await createAssignedTask(input);
  if (result.ok) revalidatePath("/planner");
  return result;
}

export async function editTaskAction(input: unknown) {
  const result = await editAssignedTask(input);
  if (result.ok) {
    revalidatePath("/planner");
    revalidatePath("/tasks");
  }
  return result;
}

export async function submitTaskAction(input: unknown) {
  const result = await submitTaskWork(input);
  if (result.ok) {
    revalidatePath("/tasks");
    revalidatePath("/planner");
    revalidatePath("/submissions");
    revalidatePath("/notifications");
  }
  return result;
}
