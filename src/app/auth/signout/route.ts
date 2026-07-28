import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

  const response = NextResponse.redirect(
    new URL(destination, requestUrl.origin),
  );
  response.headers.set(
    "Cache-Control",
    "private, no-store",
  );

  return response;
}
