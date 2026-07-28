import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import {
  getActiveProfile,
  getRoleDestination,
} from "@/lib/auth/authorization";

export default async function LoginPage() {
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

  return <LoginForm />;
}
