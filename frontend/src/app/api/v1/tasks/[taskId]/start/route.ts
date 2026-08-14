import { NextResponse } from "next/server";

import { transitionAuthorizedTask } from "@backend/api/v1/handlers/task-handler";

export async function POST(_request: Request, context: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await context.params;
  const result = await transitionAuthorizedTask(taskId, "start");
  return NextResponse.json(result.body, { status: result.status });
}
