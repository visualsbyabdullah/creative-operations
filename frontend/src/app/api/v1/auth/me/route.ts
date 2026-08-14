import { NextResponse } from "next/server";

import { getAuthenticatedProfile } from "@backend/api/v1/handlers/auth-handler";

export async function GET() {
  const result = await getAuthenticatedProfile();
  return NextResponse.json(result.body, { status: result.status });
}
