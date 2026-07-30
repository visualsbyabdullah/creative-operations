"use server";

import { revalidatePath } from "next/cache";

import { saveSelfProfile } from "@/lib/profiles/profile-service";

export async function updateOwnProfileAction(input: unknown) {
  const result = await saveSelfProfile(input);
  if (result.ok) {
    revalidatePath("/profile");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
  }
  return result;
}
