import { NextResponse } from "next/server";

import {
  checkRecoveryRateLimit,
  recordRecoverySecurityEvent,
} from "@/lib/auth/recovery-integration";
import {
  assertRecoveryConfiguration,
  createRecoveryState,
  getTrustedAppOrigin,
  recoveryCookieDeletionOptions,
  recoveryCookieOptions,
} from "@/lib/auth/recovery-state";
import {
  clearAuthPersistenceCookie,
  createClient,
} from "@/lib/supabase/server";

const ALLOWED_CALLBACK_PARAMETERS = new Set([
  "code",
  "error",
  "error_code",
  "error_description",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  let trustedOrigin: string;

  try {
    assertRecoveryConfiguration();
    trustedOrigin = getTrustedAppOrigin();
  } catch {
    return new Response(
      "Authentication recovery is unavailable.",
      {
        status: 500,
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      },
    );
  }
  const keys = Array.from(
    requestUrl.searchParams.keys(),
  );
  const hasUnknownParameter = keys.some(
    (key) =>
      !ALLOWED_CALLBACK_PARAMETERS.has(key),
  );
  const hasDuplicateParameter = keys.some(
    (key) =>
      requestUrl.searchParams.getAll(key)
        .length !== 1,
  );
  const code =
    requestUrl.searchParams.get("code");
  const hasProviderError = keys.some(
    (key) => key.startsWith("error"),
  );

  await checkRecoveryRateLimit("callback");

  if (
    !hasUnknownParameter &&
    !hasDuplicateParameter &&
    !hasProviderError &&
    code &&
    code.length <= 2048
  ) {
    const supabase = await createClient(
      "session",
    );
    const result =
      await supabase.auth.exchangeCodeForSession(
        code,
      );
    const redirectType = (
      result.data as typeof result.data & {
        redirectType?: unknown;
      }
    ).redirectType;

    if (
      !result.error &&
      redirectType === "recovery"
    ) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        const response = NextResponse.redirect(
          new URL(
            "/reset-password",
            trustedOrigin,
          ),
        );
        const options =
          recoveryCookieOptions();

        response.cookies.set({
          ...options,
          value: createRecoveryState(user.id),
        });
        response.headers.set(
          "Cache-Control",
          "private, no-store",
        );
        await recordRecoverySecurityEvent(
          "password_recovery_verified",
          user.id,
        );

        return response;
      }
    }

    await supabase.auth.signOut({
      scope: "local",
    });
    await clearAuthPersistenceCookie();
  }

  await recordRecoverySecurityEvent(
    "password_recovery_rejected",
  );
  const response = NextResponse.redirect(
    new URL(
      "/forgot-password?state=invalid_link",
      trustedOrigin,
    ),
  );
  response.cookies.set(
    recoveryCookieDeletionOptions(),
  );
  response.headers.set(
    "Cache-Control",
    "private, no-store",
  );

  return response;
}
