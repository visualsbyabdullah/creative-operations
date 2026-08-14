"use server";
import { revalidatePath } from "next/cache";
import {
  getUnreadNotificationCount,
  markAllNotificationsRead,
  setNotificationRead,
} from "@backend/modules/notifications/notification-service";
export async function getUnreadNotificationCountAction(){
  return getUnreadNotificationCount();
}
export async function setNotificationReadAction(input:unknown){
  const result=await setNotificationRead(input);if(result.ok)revalidatePath("/notifications");return result;
}
export async function markAllNotificationsReadAction(){
  const result=await markAllNotificationsRead();if(result.ok)revalidatePath("/notifications");return result;
}
