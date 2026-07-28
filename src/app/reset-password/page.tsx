import { cookies } from "next/headers";

import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import {
  AUTH_RECOVERY_COOKIE_NAME,
  verifyRecoveryState,
} from "@/lib/auth/recovery-state";
import { createClient } from "@/lib/supabase/server";

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
