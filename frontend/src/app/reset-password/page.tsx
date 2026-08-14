import { cookies } from "next/headers";

import ResetPasswordForm from "@frontend/components/auth/ResetPasswordForm";
import {
  AUTH_RECOVERY_COOKIE_NAME,
  verifyRecoveryState,
} from "@backend/modules/auth/recovery-state";
import { createClient } from "@backend/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const hasValidRecoveryState = Boolean(
    !error &&
      user &&
      verifyRecoveryState(
        cookieStore.get(
          AUTH_RECOVERY_COOKIE_NAME,
        )?.value,
        user.id,
      ),
  );

  return (
    <ResetPasswordForm
      hasValidRecoveryState={
        hasValidRecoveryState
      }
    />
  );
}
