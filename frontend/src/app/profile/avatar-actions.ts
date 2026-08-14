"use server";
import { revalidatePath } from "next/cache";
import { removeAvatar,uploadAvatar } from "@backend/modules/storage/storage-service";

function refresh(){
  revalidatePath("/profile");revalidatePath("/settings");revalidatePath("/dashboard");revalidatePath("/");
}
export async function uploadAvatarAction(formData:FormData){
  const result=await uploadAvatar(formData);if(result.ok)refresh();return result;
}
export async function removeAvatarAction(expectedUpdatedAt:unknown){
  const result=await removeAvatar(expectedUpdatedAt);if(result.ok)refresh();return result;
}
