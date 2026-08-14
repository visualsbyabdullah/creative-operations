import { NextResponse } from "next/server";

import {
  checkRecoveryRateLimit,
  recordRecoverySecurityEvent,
} from "@backend/modules/auth/recovery-integration";
import {
  auditSecurityEvent,
  isBlocked,
  securityContext,
} from "@backend/security/auth-security";
import {
  assertRecoveryConfiguration,
  createRecoveryState,
  getTrustedAppOrigin,
  recoveryCookieDeletionOptions,
  recoveryCookieOptions,
} from "@backend/modules/auth/recovery-state";
import {
  assertInvitationConfiguration,
  createInvitationState,
  invitationCookieDeletionOptions,
  invitationCookieOptions,
} from "@backend/modules/auth/invitation-state";
import {
  clearAuthPersistenceCookie,
  createClient,
} from "@backend/supabase/server";

const ALLOWED_CALLBACK_PARAMETERS = new Set([
  "code",
  "error",
  "error_code",
  "error_description",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  let trustedOrigin: string;
  let context;

  try {
    assertRecoveryConfiguration();
    assertInvitationConfiguration();
    trustedOrigin = getTrustedAppOrigin();
    context = await securityContext("recovery_callback");
  } catch {
    return new Response("Authentication recovery is unavailable.", {
      status: 500,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const [rateLimitDecision] = await checkRecoveryRateLimit(
    "callback",
    context,
  );

  if (rateLimitDecision.status === "limited") {
    return new Response("This recovery request cannot be processed.", {
      status: 429,
      headers: {
        "Cache-Control": "private, no-store",
        "Retry-After": String(rateLimitDecision.retryAfterSeconds),
        "x-request-id": context.requestId,
      },
    });
  }

  if (isBlocked(rateLimitDecision)) {
    return new Response("Authentication recovery is unavailable.", {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store",
        "x-request-id": context.requestId,
      },
    });
  }

  const keys = Array.from(requestUrl.searchParams.keys());
  const hasUnknownParameter = keys.some(
    (key) => !ALLOWED_CALLBACK_PARAMETERS.has(key),
  );
  const hasDuplicateParameter = keys.some(
    (key) => requestUrl.searchParams.getAll(key).length !== 1,
  );
  const code = requestUrl.searchParams.get("code");
  const hasProviderError = keys.some((key) => key.startsWith("error"));

  if (
    !hasUnknownParameter &&
    !hasDuplicateParameter &&
    !hasProviderError &&
    code &&
    code.length <= 2048
  ) {
    const supabase = await createClient("session");
    const result = await supabase.auth.exchangeCodeForSession(code);
    const redirectType = (
      result.data as typeof result.data & { redirectType?: unknown }
    ).redirectType;

    if (!result.error && redirectType === "recovery") {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        const response = NextResponse.redirect(
          new URL("/reset-password", trustedOrigin),
        );
        response.cookies.set({
          ...recoveryCookieOptions(),
          value: createRecoveryState(user.id),
        });
        response.headers.set("Cache-Control", "private, no-store");
        response.headers.set("x-request-id", context.requestId);
        await recordRecoverySecurityEvent(
          "password_recovery_verified",
          context,
          user.id,
        );
        return response;
      }
    }

    if (!result.error && redirectType === "invite") {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user?.invited_at) {
        const response = NextResponse.redirect(
          new URL("/auth/set-password", trustedOrigin),
        );
        response.cookies.set({
          ...invitationCookieOptions(),
          value: createInvitationState(user.id),
        });
        response.headers.set("Cache-Control", "private, no-store");
        response.headers.set("x-request-id", context.requestId);
        return response;
      }
    }

    await supabase.auth.signOut({ scope: "local" });
    await clearAuthPersistenceCookie();
    await auditSecurityEvent(
      context,
      "session_cleanup_performed",
      "cleaned",
      { cleanup_kind: "session" },
    );
  }

  await recordRecoverySecurityEvent(
    "password_recovery_rejected",
    context,
  );
  const response = NextResponse.redirect(
    new URL("/forgot-password?state=invalid_link", trustedOrigin),
  );
  response.cookies.set(recoveryCookieDeletionOptions());
  response.cookies.set(invitationCookieDeletionOptions());
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("x-request-id", context.requestId);
  return response;
}
