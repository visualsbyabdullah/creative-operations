import { createServerClient } from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

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

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
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

    return NextResponse.redirect(
      loginUrl,
    );
  }

  return response;
}
