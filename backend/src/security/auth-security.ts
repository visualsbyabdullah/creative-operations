import "server-only";

import { headers } from "next/headers";

import {
  hmacIdentifier,
  limiterKeyDigest,
  normalizeEmail,
} from "@backend/security/identifiers";
import {
  consumeRateLimit,
  resetRateLimit,
  type RateLimitDecision,
} from "@backend/security/rate-limit";
import type { AuthRateLimitPolicy } from "@backend/security/rate-limit-policies";
import {
  createRequestSecurityContext,
  type AuthSecuritySource,
  type RequestSecurityContext,
} from "@backend/security/request-context";
import { appendAuthAuditEvent } from "@backend/security/audit";
import type {
  AuthAuditEventType,
  AuthAuditResult,
} from "@backend/security/audit-metadata";

export async function securityContext(
  source: AuthSecuritySource,
) {
  return createRequestSecurityContext(
    await headers(),
    source,
  );
}

export function emailIdentifier(email: string) {
  return hmacIdentifier(
    "email",
    normalizeEmail(email),
  );
}

export function recoveryContextIdentifier(
  userId: string,
) {
  return hmacIdentifier("context", userId);
}

export function rateLimitKey(
  policy: AuthRateLimitPolicy,
  context: RequestSecurityContext,
  additionalIdentifiers: readonly string[] = [],
) {
  return limiterKeyDigest(policy, [
    ...additionalIdentifiers,
    context.ipIdentifier,
  ]);
}

export async function enforceRateLimit(
  policy: AuthRateLimitPolicy,
  context: RequestSecurityContext,
  additionalIdentifiers: readonly string[] = [],
): Promise<RateLimitDecision> {
  const decision = await consumeRateLimit(
    policy,
    rateLimitKey(
      policy,
      context,
      additionalIdentifiers,
    ),
    context.requestId,
  );

  if (decision.status === "limited") {
    await auditSecurityEvent(
      context,
      "rate_limit_exceeded",
      "denied",
      {
        limiter_policy: policy,
        retry_after_seconds:
          decision.retryAfterSeconds,
      },
    );
  } else if (decision.status === "unavailable") {
    await auditSecurityEvent(
      context,
      "security_dependency_unavailable",
      "unavailable",
      {
        reason_code: "dependency_unavailable",
        limiter_policy: policy,
      },
    );
  }

  return decision;
}

export async function clearRateLimit(
  policy: AuthRateLimitPolicy,
  context: RequestSecurityContext,
  additionalIdentifiers: readonly string[] = [],
) {
  return resetRateLimit(
    policy,
    rateLimitKey(
      policy,
      context,
      additionalIdentifiers,
    ),
  );
}

export async function auditSecurityEvent(
  context: RequestSecurityContext,
  eventType: AuthAuditEventType,
  result: AuthAuditResult,
  metadata?: Record<string, unknown>,
  actorUserId?: string,
) {
  return appendAuthAuditEvent({
    context,
    eventType,
    result,
    metadata,
    actorUserId,
  });
}

export function isBlocked(
  ...decisions: RateLimitDecision[]
) {
  return decisions.some(
    (decision) =>
      decision.status === "limited" ||
      decision.status === "unavailable",
  );
}
