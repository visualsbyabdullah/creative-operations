import { NextResponse } from "next/server";

import {
  clearAuthPersistenceCookie,
  createClient,
} from "@/lib/supabase/server";
import {
  getTrustedAppOrigin,
  recoveryCookieDeletionOptions,
} from "@/lib/auth/recovery-state";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const reason = requestUrl.searchParams.get(
    "reason",
  );
  const destination =
    reason === "inactive"
      ? "/inactive-account"
      : "/login";

  const supabase = await createClient();
  await supabase.auth.signOut({
    scope: "local",
  });
  await clearAuthPersistenceCookie();

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
  response.cookies.set(
    recoveryCookieDeletionOptions(),
  );

  return response;
}
