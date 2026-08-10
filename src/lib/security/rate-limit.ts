import "server-only";

import { invokeSecurityRpc } from "@/lib/supabase/admin";
import {
  clampRetryAfter,
  type AuthRateLimitPolicy,
} from "@/lib/security/rate-limit-policies";

type RpcRateLimitRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
  retry_after_seconds: number;
};

export type RateLimitDecision =
  | {
      status: "allowed" | "limited";
      remaining: number;
      resetAt: string;
      retryAfterSeconds: number;
    }
  | { status: "unavailable" };

export async function consumeRateLimit(
  policy: AuthRateLimitPolicy,
  keyDigest: string,
  requestId: string,
): Promise<RateLimitDecision> {
  if (
    !/^[0-9a-f]{64}$/.test(keyDigest) ||
    !/^[0-9a-f-]{36}$/i.test(requestId)
  ) {
    return { status: "unavailable" };
  }

  const result =
    await invokeSecurityRpc<RpcRateLimitRow[]>(
      "consume_auth_rate_limit",
      {
        p_policy_id: policy,
        p_key_digest: `\\x${keyDigest}`,
        p_request_id: requestId,
      },
    );
  const row = result.ok ? result.data[0] : null;

  if (
    !row ||
    typeof row.allowed !== "boolean" ||
    !Number.isInteger(row.remaining) ||
    typeof row.reset_at !== "string" ||
    !Number.isFinite(row.retry_after_seconds)
  ) {
    return { status: "unavailable" };
  }

  return {
    status: row.allowed ? "allowed" : "limited",
    remaining: Math.max(0, row.remaining),
    resetAt: row.reset_at,
    retryAfterSeconds: clampRetryAfter(
      policy,
      row.retry_after_seconds,
    ),
  };
}

export async function resetRateLimit(
  policy: AuthRateLimitPolicy,
  keyDigest: string,
) {
  const result = await invokeSecurityRpc<boolean>(
    "reset_auth_rate_limit",
    {
      p_policy_id: policy,
      p_key_digest: `\\x${keyDigest}`,
    },
  );

  return result.ok;
}
