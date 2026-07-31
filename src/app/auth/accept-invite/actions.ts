"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SAFE_INVITATION_ERROR,
  verifyInviteToken,
} from "@/lib/auth/accept-invite";
import {
  createInvitationState,
  invitationCookieOptions,
} from "@/lib/auth/invitation-state";
import { createClient } from "@/lib/supabase/server";

export type AcceptInviteActionState = {
  error: string;
};

export async function acceptInvite(
  _previousState: AcceptInviteActionState,
  formData: FormData,
): Promise<AcceptInviteActionState> {
  let acceptedUserId: string | null = null;

  try {
    const supabase = await createClient("session");
    const result = await verifyInviteToken(
      formData.get("token_hash"),
      formData.get("type"),
      supabase,
    );

    if (!result.ok) {
      return { error: SAFE_INVITATION_ERROR };
    }

    acceptedUserId = result.userId;
    const cookieStore = await cookies();
    cookieStore.set({
      ...invitationCookieOptions(),
      value: createInvitationState(
        acceptedUserId,
      ),
    });
  } catch {
    return { error: SAFE_INVITATION_ERROR };
  }

  if (!acceptedUserId) {
    return { error: SAFE_INVITATION_ERROR };
  }

  redirect("/auth/set-password");
}
