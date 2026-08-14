import "server-only";

import { createHmac } from "node:crypto";

import { getActiveProfile, isManagementRole } from "@backend/modules/auth/authorization";
import {
  finalizeInvitation,
  markInvitationAccepted,
  prepareInvitation,
} from "@backend/modules/employees/employee-repository";
import { parseInviteEmployee } from "@backend/modules/employees/employee-schemas";
import type { ActionResult } from "@shared/contracts/action-result";
import { inviteUser } from "@backend/supabase/admin-auth";
import {
  businessRateLimitDenied,
  enforceBusinessRateLimit,
} from "@backend/security/business-rate-limit";

export function digestInvitationEmail(email: string) {
  const secret = process.env.AUTH_SECURITY_HMAC_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
}

export async function inviteEmployee(input: unknown): Promise<ActionResult<"invitation_accepted">> {
  const parsed = parseInviteEmployee(input);
  if (!parsed) return { ok: false, code: "validation_failed" };
  const actor = await getActiveProfile();
  if (actor.status !== "active" || !isManagementRole(actor.profile.role)) {
    return { ok: false, code: "forbidden" };
  }
  const digest = digestInvitationEmail(parsed.email);
  if (!digest) return { ok: false, code: "temporarily_unavailable" };
  const limit = await enforceBusinessRateLimit(
    "employee_invitation",
    actor.profile.id,
    digest,
  );
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const prepared = await prepareInvitation(parsed, digest);
  const intent = prepared.data?.[0] as {
    intent_id?: string;
    intent_state?: string;
    invited_user_id?: string | null;
  } | undefined;
  const intentId = intent?.intent_id;
  if (prepared.error || !intentId) return { ok: false, code: "invitation_not_completed" };
  if (intent.intent_state === "finalized") {
    return { ok: true, data: "invitation_accepted" };
  }
  if (intent.invited_user_id) {
    const retried = await finalizeInvitation(intentId, intent.invited_user_id);
    return !retried.error && retried.data === true
      ? { ok: true, data: "invitation_accepted" }
      : { ok: false, code: "invitation_not_completed" };
  }
  const invited = await inviteUser(parsed.email, parsed.fullName);
  if (!invited.ok) return { ok: false, code: "invitation_not_completed" };
  const marked = await markInvitationAccepted(intentId, invited.userId);
  if (marked.error || marked.data !== true) {
    return { ok: false, code: "invitation_not_completed" };
  }
  const finalized = await finalizeInvitation(intentId, invited.userId);
  if (finalized.error || finalized.data !== true) {
    return { ok: false, code: "invitation_not_completed" };
  }
  return { ok: true, data: "invitation_accepted" };
}
