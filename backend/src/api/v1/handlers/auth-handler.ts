import "server-only";

import { apiFailure, apiSuccess } from "@backend/api/responses/api-response";
import { getActiveProfile } from "@backend/modules/auth/authorization";

export async function getAuthenticatedProfile() {
  const actor = await getActiveProfile();
  if (actor.status !== "active") return apiFailure("unauthenticated");
  const { id, email, full_name, role, department, timezone } = actor.profile;
  return apiSuccess({ id, email, fullName: full_name, role, department, timezone });
}
