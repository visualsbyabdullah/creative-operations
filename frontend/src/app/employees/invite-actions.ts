"use server";

import { revalidatePath } from "next/cache";

import { inviteEmployee } from "@backend/modules/employees/invitation-service";

export async function inviteEmployeeAction(input: unknown) {
  const result = await inviteEmployee(input);
  if (result.ok) revalidatePath("/employees");
  return result;
}
