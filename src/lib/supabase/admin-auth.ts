import "server-only";

import { createClient } from "@supabase/supabase-js";

export type InviteUserResult =
  | { ok: true; userId: string }
  | { ok: false; code: "provider_rejected" | "temporarily_unavailable" };

export async function inviteUser(
  email: string,
  fullName: string,
): Promise<InviteUserResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url || !key || !siteUrl || !siteUrl.startsWith("https://")) {
    return { ok: false, code: "temporarily_unavailable" };
  }
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl.replace(/\/$/u, "")}/auth/callback`,
      data: { full_name: fullName },
    });
    if (error || !data.user?.id) return { ok: false, code: "provider_rejected" };
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, code: "temporarily_unavailable" };
  }
}

