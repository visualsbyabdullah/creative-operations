import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getTrustedAppOrigin } from "@backend/modules/auth/recovery-state";

export const EMPLOYEE_INVITATION_REDIRECT_PATH = "/auth/callback";

export type InviteUserResult =
  | { ok: true; userId: string }
  | { ok: false; code: "provider_rejected" | "temporarily_unavailable" };

export function getEmployeeInvitationRedirectUrl() {
  return new URL(
    EMPLOYEE_INVITATION_REDIRECT_PATH,
    getTrustedAppOrigin(),
  ).toString();
}

export async function inviteUser(
  email: string,
  fullName: string,
): Promise<InviteUserResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return { ok: false, code: "temporarily_unavailable" };
  }
  try {
    const redirectTo = getEmployeeInvitationRedirectUrl();
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name: fullName },
    });
    if (error || !data.user?.id) return { ok: false, code: "provider_rejected" };
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, code: "temporarily_unavailable" };
  }
}
