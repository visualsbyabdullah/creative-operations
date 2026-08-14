import "server-only";

import { randomUUID } from "node:crypto";

import { hmacIdentifier, limiterKeyDigest } from "@backend/security/identifiers";
import { consumeRateLimit } from "@backend/security/rate-limit";
import type { AuthRateLimitPolicy } from "@backend/security/rate-limit-policies";

export type BusinessRateLimitPolicy =
  | "profile_write"
  | "employee_directory_read"
  | "employee_detail_read"
  | "employee_manage"
  | "employee_status_change"
  | "employee_role_change"
  | "employee_invitation"
  | "employee_invitation_retry"
  | "brand_read"
  | "brand_mutation"
  | "avatar_upload"
  | "avatar_replace"
  | "avatar_remove"
  | "task_attachment_upload"
  | "task_attachment_remove"
  | "submission_attachment_upload"
  | "submission_attachment_remove"
  | "management_attachment_remove"
  | "storage_signed_url";

export async function enforceBusinessRateLimit(
  policy: BusinessRateLimitPolicy,
  actorId: string,
  targetDigest?: string,
) {
  const actorDigest = hmacIdentifier("context", actorId);
  const identifiers = targetDigest ? [actorDigest, targetDigest] : [actorDigest];
  return consumeRateLimit(
    policy satisfies AuthRateLimitPolicy,
    limiterKeyDigest(policy, identifiers),
    randomUUID(),
  );
}

export function businessRateLimitDenied(
  decision: Awaited<ReturnType<typeof enforceBusinessRateLimit>>,
) {
  return decision.status !== "allowed";
}
