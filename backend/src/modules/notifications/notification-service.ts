import "server-only";

import { getActiveProfile } from "@backend/modules/auth/authorization";
import type { NotificationView } from "@shared/contracts/notification-types";
import type { ActionResult } from "@shared/contracts/action-result";
import { createClient } from "@backend/supabase/server";

export async function listNotifications():Promise<ActionResult<{items:NotificationView[];unread:number}>>{
  const actor=await getActiveProfile();if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const client=await createClient();
  const[list,count]=await Promise.all([
    client.rpc("get_notifications_v2",{p_unread_only:false,p_limit:50,p_before_created_at:null,p_before_id:null}),
    client.rpc("get_unread_notification_count_v2"),
  ]);
  if(list.error||count.error)return{ok:false,code:"temporarily_unavailable"};
  return{ok:true,data:{items:(list.data??[]).map((row:Record<string,unknown>)=>({
    id:String(row.id),type:String(row.type),title:String(row.title),body:String(row.body),
    taskId:row.task_id as string|null,submissionId:row.submission_id as string|null,
    brandId:row.brand_id as string|null,actionPath:row.action_path as string|null,
    readAt:row.read_at as string|null,createdAt:String(row.created_at),
  })),unread:Number(count.data??0)}};
}
export async function getUnreadNotificationCount():Promise<ActionResult<number>>{
  const actor=await getActiveProfile();if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const client=await createClient();
  const{data,error}=await client.rpc("get_unread_notification_count_v2");
  return error?{ok:false,code:"temporarily_unavailable"}:{ok:true,data:Number(data??0)};
}
export async function setNotificationRead(input:unknown):Promise<ActionResult<true>>{
  if(!input||typeof input!=="object"||Array.isArray(input))return{ok:false,code:"validation_failed"};
  const v=input as Record<string,unknown>;
  if(Object.keys(v).some(k=>!["notificationId","read"].includes(k))||
    typeof v.notificationId!=="string"||typeof v.read!=="boolean")return{ok:false,code:"validation_failed"};
  const actor=await getActiveProfile();if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const client=await createClient();const{error}=await client.rpc("set_notification_read_v2",{
    p_notification_id:v.notificationId,p_read:v.read,
  });
  return error?{ok:false,code:"not_found"}:{ok:true,data:true};
}
export async function markAllNotificationsRead():Promise<ActionResult<number>>{
  const actor=await getActiveProfile();if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const client=await createClient();const{data,error}=await client.rpc("mark_all_notifications_read_v2");
  return error?{ok:false,code:"temporarily_unavailable"}:{ok:true,data:Number(data??0)};
}
