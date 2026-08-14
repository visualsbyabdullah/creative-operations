"use server";

import { revalidatePath } from "next/cache";

import {
  createDepartment,
  listDepartments,
  setDepartmentArchived,
  updateDepartment,
} from "@backend/modules/departments/department-service";

export async function listDepartmentsAction() {
  return listDepartments();
}

export async function createDepartmentAction(input: unknown) {
  const result = await createDepartment(input);
  if (result.ok) revalidatePath("/departments");
  return result;
}

export async function updateDepartmentAction(input: unknown) {
  const result = await updateDepartment(input);
  if (result.ok) revalidatePath("/departments");
  return result;
}

export async function setDepartmentArchivedAction(input: unknown) {
  const result = await setDepartmentArchived(input);
  if (result.ok) revalidatePath("/departments");
  return result;
}
