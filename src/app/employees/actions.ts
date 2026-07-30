"use server";

import { revalidatePath } from "next/cache";

import {
  getEmployee,
  listEmployees,
  saveManagedEmployee,
} from "@/lib/employees/employee-service";

export async function listEmployeesAction(input: unknown) {
  return listEmployees(input);
}

export async function getEmployeeDetailAction(input: unknown) {
  const profileId = input && typeof input === "object"
    ? (input as Record<string, unknown>).profileId
    : null;
  return getEmployee(profileId);
}

export async function updateManagedEmployeeAction(input: unknown) {
  const result = await saveManagedEmployee(input);
  if (result.ok) revalidatePath("/employees");
  return result;
}

export async function setEmployeeActiveAction(input: unknown) {
  return updateManagedEmployeeAction(input);
}
