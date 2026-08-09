import { randomUUID } from "node:crypto";
import { cache } from "react";
import { getActiveProfile } from "@/lib/auth/authorization";
import {
  businessRateLimitDenied,
  enforceBusinessRateLimit,
} from "@/lib/security/business-rate-limit";
import type { ActionResult } from "@/lib/shared/action-result";
import { createClient } from "@/lib/supabase/server";
import {
  signatureMatches,
  validateFileMetadata,
  type StorageKind,
} from "@/lib/storage/file-validation";

async function validatedFile(kind:StorageKind,value:FormDataEntryValue|null){
  if(!(value instanceof File))return null;
  const metadata=validateFileMetadata(kind,value);
  if(!metadata)return null;
  const bytes=new Uint8Array(await value.arrayBuffer());
  if(!signatureMatches(value.type,bytes))return null;
  return{file:value,bytes,...metadata};
}

export async function uploadAvatar(formData:FormData):Promise<ActionResult<{url:string|null}>>{
  const actor=await getActiveProfile();
  if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const checked=await validatedFile("avatar",formData.get("file"));
  const expected=formData.get("expectedUpdatedAt");
  if(!checked||typeof expected!=="string")return{ok:false,code:"validation_failed"};
  const client=await createClient();
  const workspace=await client.from("profiles").select("workspace_id,avatar_path")
    .eq("id",actor.profile.id).maybeSingle();
  if(workspace.error||!workspace.data)return{ok:false,code:"temporarily_unavailable"};
  const limit=await enforceBusinessRateLimit(
    workspace.data.avatar_path?"avatar_replace":"avatar_upload",actor.profile.id);
  if(businessRateLimitDenied(limit))return{ok:false,code:"rate_limited"};
  const path=`${workspace.data.workspace_id}/${actor.profile.id}/${randomUUID()}.${checked.extension}`;
  const upload=await client.storage.from("avatars").upload(path,checked.bytes,{
    contentType:checked.file.type,upsert:false,
  });
  if(upload.error)return{ok:false,code:"temporarily_unavailable"};
  const saved=await client.rpc("set_own_avatar_path_v1",{
    p_avatar_path:path,p_expected_updated_at:expected,
  });
  if(saved.error){
    const cleanup=await client.storage.from("avatars").remove([path]);
    if(cleanup.error)await client.rpc("record_storage_cleanup_v1",{
      p_bucket:"avatars",p_object_path:path,p_reason_code:"avatar_profile_update_failed",
    });
    return{ok:false,code:saved.error.code==="40001"?"stale_update":"temporarily_unavailable"};
  }
  const old=(saved.data?.[0] as Record<string,unknown>|undefined)?.old_avatar_path;
  if(typeof old==="string"&&old!==path){
    const cleanup=await client.storage.from("avatars").remove([old]);
    if(cleanup.error)await client.rpc("record_storage_cleanup_v1",{
      p_bucket:"avatars",p_object_path:old,p_reason_code:"avatar_old_object_delete_failed",
    });
  }
  const signed=await client.storage.from("avatars").createSignedUrl(path,300);
  return{ok:true,data:{url:signed.data?.signedUrl??null}};
}

export async function removeAvatar(expectedUpdatedAt:unknown):Promise<ActionResult<true>>{
  const actor=await getActiveProfile();
  if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  if(typeof expectedUpdatedAt!=="string")return{ok:false,code:"validation_failed"};
  const limit=await enforceBusinessRateLimit("avatar_remove",actor.profile.id);
  if(businessRateLimitDenied(limit))return{ok:false,code:"rate_limited"};
  const client=await createClient();
  const cleared=await client.rpc("set_own_avatar_path_v1",{
    p_avatar_path:null,p_expected_updated_at:expectedUpdatedAt,
  });
  if(cleared.error)return{ok:false,code:cleared.error.code==="40001"?"stale_update":"temporarily_unavailable"};
  const old=(cleared.data?.[0] as Record<string,unknown>|undefined)?.old_avatar_path;
  if(typeof old==="string"){
    const cleanup=await client.storage.from("avatars").remove([old]);
    if(cleanup.error)await client.rpc("record_storage_cleanup_v1",{
      p_bucket:"avatars",p_object_path:old,p_reason_code:"avatar_old_object_delete_failed",
    });
  }
  return{ok:true,data:true};
}

async function signAvatarPathUncached(path:string|null):Promise<string|null>{
  if(!path)return null;
  const actor=await getActiveProfile();
  if(actor.status!=="active")return null;
  const limit=await enforceBusinessRateLimit("storage_signed_url",actor.profile.id,path);
  if(businessRateLimitDenied(limit))return null;
  const client=await createClient();
  const result=await client.storage.from("avatars").createSignedUrl(path,300);
  return result.error?null:result.data.signedUrl;
}

export const signAvatarPath = cache(signAvatarPathUncached);

export async function uploadAttachment(formData:FormData):Promise<ActionResult<{id:string}>>{
  const actor=await getActiveProfile();
  if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const parentType=formData.get("parentType");
  const parentId=formData.get("parentId");
  if((parentType!=="task"&&parentType!=="submission")||typeof parentId!=="string"){
    return{ok:false,code:"validation_failed"};
  }
  const kind=parentType as "task"|"submission";
  const checked=await validatedFile(kind,formData.get("file"));
  if(!checked||!/^[0-9a-f-]{36}$/i.test(parentId))return{ok:false,code:"validation_failed"};
  const limit=await enforceBusinessRateLimit(
    parentType==="task"?"task_attachment_upload":"submission_attachment_upload",
    actor.profile.id,parentId);
  if(businessRateLimitDenied(limit))return{ok:false,code:"rate_limited"};
  const client=await createClient();
  const workspace=await client.from("profiles").select("workspace_id")
    .eq("id",actor.profile.id).maybeSingle();
  if(workspace.error||!workspace.data)return{ok:false,code:"temporarily_unavailable"};
  const bucket=parentType==="task"?"task-attachments":"submission-attachments";
  const path=`${workspace.data.workspace_id}/${parentId}/${randomUUID()}.${checked.extension}`;
  const upload=await client.storage.from(bucket).upload(path,checked.bytes,{
    contentType:checked.file.type,upsert:false,
  });
  if(upload.error)return{ok:false,code:"forbidden"};
  const registered=await client.rpc("register_attachment_v1",{
    p_bucket:bucket,p_object_path:path,p_parent_type:parentType,p_parent_id:parentId,
    p_original_name:checked.safeName,p_mime_type:checked.file.type,p_byte_size:checked.file.size,
  });
  if(registered.error||typeof registered.data!=="string"){
    const cleanup=await client.storage.from(bucket).remove([path]);
    if(cleanup.error)await client.rpc("record_storage_cleanup_v1",{
      p_bucket:bucket,p_object_path:path,p_reason_code:"metadata_registration_failed",
    });
    return{ok:false,code:"temporarily_unavailable"};
  }
  return{ok:true,data:{id:registered.data}};
}

export async function removeAttachment(
  id:unknown,parentType:unknown,
):Promise<ActionResult<true>>{
  if(typeof id!=="string")return{ok:false,code:"validation_failed"};
  if(parentType!=="task"&&parentType!=="submission")return{ok:false,code:"validation_failed"};
  const actor=await getActiveProfile();
  if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const limit=await enforceBusinessRateLimit(
    actor.profile.role==="manager"||actor.profile.role==="hr"
      ?"management_attachment_remove"
      :parentType==="task"?"task_attachment_remove":"submission_attachment_remove",
    actor.profile.id,id);
  if(businessRateLimitDenied(limit))return{ok:false,code:"rate_limited"};
  const client=await createClient();
  const started=await client.rpc("begin_attachment_removal_v2",{p_attachment_id:id});
  const row=started.data?.[0] as Record<string,unknown>|undefined;
  if(started.error?.code==="55000")return{ok:false,code:"forbidden"};
  if(started.error||!row)return{ok:false,code:"not_found"};
  if(row.already_removed===true)return{ok:true,data:true};
  const result=await client.storage.from(String(row.bucket)).remove([String(row.object_path)]);
  const finished=await client.rpc("finish_attachment_removal_v2",{
    p_attachment_id:id,p_object_removed:!result.error,
  });
  return result.error||finished.error||finished.data!==true
    ?{ok:false,code:"temporarily_unavailable"}:{ok:true,data:true};
}

export type AttachmentView={
  id:string;name:string;mimeType:string;byteSize:number;url:string;
};
export async function listAttachments(
  parentType:unknown,parentId:unknown,
):Promise<ActionResult<AttachmentView[]>>{
  if((parentType!=="task"&&parentType!=="submission")||typeof parentId!=="string"){
    return{ok:false,code:"validation_failed"};
  }
  const actor=await getActiveProfile();
  if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const limit=await enforceBusinessRateLimit("storage_signed_url",actor.profile.id,parentId);
  if(businessRateLimitDenied(limit))return{ok:false,code:"rate_limited"};
  const client=await createClient();
  const rows=await client.rpc("get_attachments_v1",{
    p_parent_type:parentType,p_parent_id:parentId,
  });
  if(rows.error)return{ok:false,code:"forbidden"};
  const signed=await Promise.all((rows.data??[]).map(async(row:Record<string,unknown>)=>{
    const result=await client.storage.from(String(row.bucket))
      .createSignedUrl(String(row.object_path),300);
    return result.error?null:{
      id:String(row.id),name:String(row.original_name),mimeType:String(row.mime_type),
      byteSize:Number(row.byte_size),url:result.data.signedUrl,
    };
  }));
  return{ok:true,data:signed.filter((item):item is AttachmentView=>item!==null)};
}
