import { NextResponse } from "next/server";

import { getAuthorizedTasks } from "@backend/api/v1/handlers/task-handler";

export async function GET() {
  const result = await getAuthorizedTasks();
  return NextResponse.json(result.body, { status: result.status });
}
