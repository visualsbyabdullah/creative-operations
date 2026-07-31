"use server";

import { cookies } from "next/headers";

import {
  AUTH_INVITATION_COOKIE_NAME,
  createInvitationState,
  invitationCookieDeletionOptions,
  invitationCookieOptions,
  verifyInvitationState,
} from "@/lib/auth/invitation-state";
import { setInvitationPassword } from "@/lib/auth/set-invitation-password";
import { createClient } from "@/lib/supabase/server";

type InvitationDestination =
  | "/dashboard"
  | "/inactive";

function invitationDestination(
  isActive: boolean,
): InvitationDestination {
  return isActive ? "/dashboard" : "/inactive";
}

function hasOtpAuthenticationMethod(
  claims: Record<string, unknown> | undefined,
) {
  const methods = claims?.amr;

  return (
    Array.isArray(methods) &&
    methods.some(
      (entry) =>
        entry !== null &&
        typeof entry === "object" &&
        (entry as Record<string, unknown>)
          .method === "otp",
    )
  );
}

export async function beginInvitationAcceptance() {
  try {
    const supabase = await createClient("session");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    const {
      data: claimsData,
      error: claimsError,
    } = await supabase.auth.getClaims();

    if (
      error ||
      claimsError ||
      !user ||
      !user.invited_at ||
      !hasOtpAuthenticationMethod(
        claimsData?.claims as
          | Record<string, unknown>
          | undefined,
      )
    ) {
      return { ok: false as const };
    }

    const cookieStore = await cookies();
    cookieStore.set({
      ...invitationCookieOptions(),
      value: createInvitationState(user.id),
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}

export async function finishInvitationAcceptance(): Promise<
  | { ok: true; destination: InvitationDestination }
  | { ok: false }
> {
  const cookieStore = await cookies();

  try {
    const supabase = await createClient("session");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const invitationState = cookieStore.get(
      AUTH_INVITATION_COOKIE_NAME,
    )?.value;

    if (
      userError ||
      !user ||
      !verifyInvitationState(
        invitationState,
        user.id,
      )
    ) {
      return { ok: false };
    }

    const {
      data: accountState,
      error: profileError,
    } = await supabase.rpc(
      "get_own_invitation_account_state_v1",
    );

    if (
      profileError ||
      (accountState !== "active" &&
        accountState !== "inactive")
    ) {
      return { ok: false };
    }

    cookieStore.set(
      invitationCookieDeletionOptions(),
    );

    return {
      ok: true,
      destination: invitationDestination(
        accountState === "active",
      ),
    };
  } catch {
    return { ok: false };
  }
}

export async function submitInvitationPassword(
  input: unknown,
) {
  try {
    const supabase = await createClient("session");
    const cookieStore = await cookies();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (
      error ||
      !user ||
      !user.invited_at ||
      !verifyInvitationState(
        cookieStore.get(
          AUTH_INVITATION_COOKIE_NAME,
        )?.value,
        user.id,
      )
    ) {
      return {
        ok: false as const,
        code: "invitation_expired" as const,
        message:
          "We could not create your password. Ask your administrator to resend the invitation.",
      };
    }

    return await setInvitationPassword(
      input,
      supabase,
      finishInvitationAcceptance,
    );
  } catch {
    return {
      ok: false as const,
      code: "invitation_expired" as const,
      message:
        "We could not create your password. Ask your administrator to resend the invitation.",
    };
  }
}
