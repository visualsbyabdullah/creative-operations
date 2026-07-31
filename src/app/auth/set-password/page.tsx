import { cookies } from "next/headers";

import SetInvitationPasswordForm from "@/components/auth/SetInvitationPasswordForm";
import {
  AUTH_INVITATION_COOKIE_NAME,
  verifyInvitationState,
} from "@/lib/auth/invitation-state";
import { createClient } from "@/lib/supabase/server";

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const hasValidInvitation = Boolean(
    !error &&
      user &&
      user.invited_at &&
      verifyInvitationState(
        cookieStore.get(
          AUTH_INVITATION_COOKIE_NAME,
        )?.value,
        user.id,
      ),
  );

  return (
    <SetInvitationPasswordForm
      hasValidInvitation={hasValidInvitation}
    />
  );
}
