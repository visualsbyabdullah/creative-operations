"use server";
import { revalidatePath } from "next/cache";
import { publishReviewedSubmission, requestRevision, saveSubmissionFeedback } from "@backend/modules/submissions/submission-service";
export async function requestRevisionAction(input:unknown){
  const result=await requestRevision(input);
  if(result.ok){revalidatePath("/submissions");revalidatePath("/tasks");revalidatePath("/notifications");}
  return result;
}
export async function submitFeedbackAction(input:unknown){
  const result=await saveSubmissionFeedback(input);
  if(result.ok){revalidatePath("/submissions");revalidatePath("/tasks");revalidatePath("/notifications");}
  return result;
}
export async function publishSubmissionAction(input:unknown){
  const result=await publishReviewedSubmission(input);
  if(result.ok){revalidatePath("/submissions");revalidatePath("/tasks");revalidatePath("/planner");revalidatePath("/notifications");}
  return result;
}
