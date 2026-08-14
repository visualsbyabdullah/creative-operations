import { redirect } from "next/navigation";

import {
  getActiveProfile,
  getRoleDestination,
} from "@backend/modules/auth/authorization";

export default async function HomePage() {
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

  redirect("/login");
}
