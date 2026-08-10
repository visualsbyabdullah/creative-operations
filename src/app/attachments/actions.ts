"use server";
import { revalidatePath } from "next/cache";
import {
  listAttachments,
  removeAttachment,
  uploadAttachment,
} from "@/lib/storage/storage-service";

export async function uploadAttachmentAction(formData:FormData){
  const result=await uploadAttachment(formData);
  if(result.ok){
    revalidatePath("/tasks");revalidatePath("/submissions");revalidatePath("/planner");
  }
  return result;
}
export async function removeAttachmentAction(id:unknown,parentType:unknown){
  const result=await removeAttachment(id,parentType);
  if(result.ok){
    revalidatePath("/tasks");revalidatePath("/submissions");revalidatePath("/planner");
  }
  return result;
}
export async function listAttachmentsAction(parentType:unknown,parentId:unknown){
  return listAttachments(parentType,parentId);
}
