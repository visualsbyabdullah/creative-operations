import { NextResponse } from "next/server";

import {
  clearAuthPersistenceCookie,
  createClient,
} from "@/lib/supabase/server";
import {
  getTrustedAppOrigin,
  recoveryCookieDeletionOptions,
} from "@/lib/auth/recovery-state";
import {
  auditSecurityEvent,
  securityContext,
} from "@/lib/security/auth-security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const reason = requestUrl.searchParams.get(
    "reason",
  );
  const destination =
    reason === "inactive"
      ? "/inactive-account"
      : "/login";

  let context;
  let signOutFailed = false;

  try {
    context = await securityContext("signout_route");
  } catch {
    context = null;
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });
    signOutFailed = Boolean(error);
  } catch {
    signOutFailed = true;
  }

  await clearAuthPersistenceCookie();

  if (context) {
    await auditSecurityEvent(
      context,
      signOutFailed
        ? "logout_failed"
        : "logout_succeeded",
      signOutFailed ? "failed" : "succeeded",
      signOutFailed
        ? {
            logout_scope: "local",
            reason_code: "provider_rejected",
          }
        : { logout_scope: "local" },
    );
    await auditSecurityEvent(
      context,
      "session_cleanup_performed",
      "cleaned",
      { cleanup_kind: "session" },
    );
  }

  const response = NextResponse.redirect(
    new URL(
      destination,
      getTrustedAppOrigin(),
    ),
  );
  response.headers.set(
    "Cache-Control",
    "private, no-store",
  );
  if (context) {
    response.headers.set(
      "x-request-id",
      context.requestId,
    );
  }
  response.cookies.set(
    recoveryCookieDeletionOptions(),
  );

  return response;
}
