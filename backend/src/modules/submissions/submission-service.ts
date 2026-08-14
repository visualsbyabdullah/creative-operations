import "server-only";

import { getActiveProfile } from "@backend/modules/auth/authorization";
import type { ActionResult } from "@shared/contracts/action-result";
import type { SubmissionView } from "@shared/contracts/submission-types";
import { createClient } from "@backend/supabase/server";

function map(row: Record<string, unknown>): SubmissionView {
  return {
    id:String(row.id),taskId:String(row.task_id),taskTitle:String(row.task_title),
    brandName:String(row.brand_name),submittedBy:String(row.submitted_by),
    submitterName:String(row.submitter_name),type:row.type as SubmissionView["type"],
    sourceUrl:row.source_url as string|null,finalUrl:row.final_url as string|null,
    notes:row.notes as string|null,status:row.status as SubmissionView["status"],
    revisionNumber:Number(row.revision_number),submittedAt:row.submitted_at as string|null,
    publishedUrl:row.published_url as string|null,updatedAt:String(row.updated_at),
    taskUpdatedAt:String(row.task_updated_at),latestFeedback:row.latest_feedback as string|null,
  };
}
export async function listSubmissions():Promise<ActionResult<SubmissionView[]>>{
  const actor=await getActiveProfile();
  if(actor.status!=="active")return{ok:false,code:"unauthenticated"};
  const client=await createClient();const{data,error}=await client.rpc("get_submissions_v2");
  return error?{ok:false,code:"temporarily_unavailable"}:
    {ok:true,data:(data??[]).map((row:unknown)=>map(row as Record<string,unknown>))};
}
export async function requestRevision(input:unknown):Promise<ActionResult<true>>{
  if(!input||typeof input!=="object"||Array.isArray(input))return{ok:false,code:"validation_failed"};
  const v=input as Record<string,unknown>;
  if(Object.keys(v).some(k=>!["submissionId","feedback","expectedUpdatedAt","expectedTaskUpdatedAt"].includes(k))||
    typeof v.submissionId!=="string"||typeof v.feedback!=="string"||
    v.feedback.trim().length<1||v.feedback.length>4000||
    typeof v.expectedUpdatedAt!=="string"||typeof v.expectedTaskUpdatedAt!=="string")
    return{ok:false,code:"validation_failed"};
  const actor=await getActiveProfile();
  if(actor.status!=="active"||(actor.profile.role!=="manager"&&actor.profile.role!=="hr"))
    return{ok:false,code:"forbidden"};
  const client=await createClient();const{error}=await client.rpc("request_submission_revision_v2",{
    p_submission_id:v.submissionId,p_feedback:v.feedback,
    p_expected_submission_updated_at:v.expectedUpdatedAt,
    p_expected_task_updated_at:v.expectedTaskUpdatedAt,
  });
  return error?.code==="40001"?{ok:false,code:"stale_update"}:
    error?{ok:false,code:"temporarily_unavailable"}:{ok:true,data:true};
}
export async function publishReviewedSubmission(input:unknown):Promise<ActionResult<true>>{
  if(!input||typeof input!=="object"||Array.isArray(input))return{ok:false,code:"validation_failed"};
  const v=input as Record<string,unknown>;
  if(Object.keys(v).some(k=>!["submissionId","publishedUrl","expectedUpdatedAt","expectedTaskUpdatedAt"].includes(k))||
    typeof v.submissionId!=="string"||typeof v.publishedUrl!=="string"||
    !v.publishedUrl.startsWith("https://")||typeof v.expectedUpdatedAt!=="string"||
    typeof v.expectedTaskUpdatedAt!=="string")return{ok:false,code:"validation_failed"};
  const actor=await getActiveProfile();
  if(actor.status!=="active"||(actor.profile.role!=="manager"&&actor.profile.role!=="hr"))
    return{ok:false,code:"forbidden"};
  const client=await createClient();const{error}=await client.rpc("publish_submission_v2",{
    p_submission_id:v.submissionId,p_published_url:v.publishedUrl,
    p_expected_submission_updated_at:v.expectedUpdatedAt,
    p_expected_task_updated_at:v.expectedTaskUpdatedAt,
  });
  return error?.code==="40001"?{ok:false,code:"stale_update"}:
    error?{ok:false,code:"temporarily_unavailable"}:{ok:true,data:true};
}
