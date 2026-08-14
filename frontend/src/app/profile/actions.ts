"use server";

import { revalidatePath } from "next/cache";

import {
  changeSelfPassword,
  requestSelfEmailChange,
  saveSelfProfile,
} from "@backend/modules/profiles/profile-service";

export async function updateOwnProfileAction(input: unknown) {
  const result = await saveSelfProfile(input);
  if (result.ok) {
    revalidatePath("/profile");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function requestEmailChangeAction(input: unknown) {
  return requestSelfEmailChange(input);
}

export async function changePasswordAction(input: unknown) {
  return changeSelfPassword(input);
}
