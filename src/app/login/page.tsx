import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import {
  getActiveProfile,
  getRoleDestination,
} from "@/lib/auth/authorization";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string | string[];
  }>;
}) {
  const result = await getActiveProfile();

  if (result.status === "active") {
    redirect(
      getRoleDestination(result.profile.role),
    );
  }

  if (result.status === "inactive") {
    redirect("/auth/signout?reason=inactive");
  }

  if (result.status !== "unauthenticated") {
    redirect("/auth/signout?reason=denied");
  }

  const state = (await searchParams).state;

  return (
    <LoginForm
      successMessage={
        state === "password_reset"
          ? "Your password has been reset. Sign in with your new password."
          : undefined
      }
    />
  );
}
