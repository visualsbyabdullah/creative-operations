import { createServerClient } from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { AUTH_PERSISTENCE_COOKIE_NAME } from "@/lib/auth/persistence";
import {
  AUTH_RECOVERY_COOKIE_NAME,
  recoveryCookieDeletionOptions,
  verifyRecoveryState,
} from "@/lib/auth/recovery-state";
import {
  applyCookieBatch,
  clearAuthPersistence,
  readAuthPersistence,
} from "@/lib/supabase/cookie-adapters";

export async function updateSession(
  request: NextRequest,
) {
  const response = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const persistenceMode =
    readAuthPersistence(request.cookies);

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          const transformed =
            applyCookieBatch(
              cookiesToSet,
              persistenceMode,
            );

          transformed.forEach(
            ({
              name,
              value,
              options,
            }) => {
              request.cookies.set(
                name,
                value,
              );

              response.cookies.set(
                name,
                value,
                options,
              );
            },
          );

          Object.entries(headers).forEach(
            ([name, value]) => {
              response.headers.set(
                name,
                value,
              );
            },
          );
        },
      },
    },
  );

  const {
    data: claimsData,
  } = await supabase.auth.getClaims();

  const isAuthenticated =
    Boolean(claimsData?.claims?.sub);
  const pathname =
    request.nextUrl.pathname;

  if (pathname === "/reset-password") {
    const userId =
      typeof claimsData?.claims?.sub ===
      "string"
        ? claimsData.claims.sub
        : "";
    const recoveryValue =
      request.cookies.get(
        AUTH_RECOVERY_COOKIE_NAME,
      )?.value;

    if (
      recoveryValue &&
      !verifyRecoveryState(
        recoveryValue,
        userId,
      )
    ) {
      response.cookies.set(
        recoveryCookieDeletionOptions(),
      );
    }
  }

  if (
    !isAuthenticated &&
    request.cookies.has(
      AUTH_PERSISTENCE_COOKIE_NAME,
    )
  ) {
    clearAuthPersistence({
      getAll: () =>
        request.cookies.getAll(),
      set: (name, value, options) => {
        request.cookies.set(name, value);
        response.cookies.set(
          name,
          value,
          options,
        );
      },
    });
  }

  const protectedRoutes = [
    "/",
    "/dashboard",
    "/tasks",
    "/schedule",
    "/submissions",
    "/notifications",
    "/profile",
    "/settings",
    "/brands",
    "/planner",
    "/employees",
  ];

  const isProtectedRoute =
    protectedRoutes.some(
      (route) =>
        pathname === route ||
        (route !== "/" &&
        pathname.startsWith(
          `${route}/`,
        )),
    );

  if (
    isProtectedRoute &&
    !isAuthenticated
  ) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";

    const redirectResponse =
      NextResponse.redirect(
      loginUrl,
    );

    response.cookies
      .getAll()
      .forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });

    for (const headerName of [
      "Cache-Control",
      "Expires",
      "Pragma",
    ]) {
      const value =
        response.headers.get(headerName);

      if (value) {
        redirectResponse.headers.set(
          headerName,
          value,
        );
      }
    }

    return redirectResponse;
  }

  return response;
}
