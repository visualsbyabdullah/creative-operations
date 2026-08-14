import "server-only";

import { redirect } from "next/navigation";

import {
  getActiveProfile,
  isManagementRole,
} from "@backend/modules/auth/authorization";

export { isManagementRole };

export async function requireAppProfile() {
  const result = await getActiveProfile();

  if (result.status === "active") {
    return result.profile;
  }

  if (result.status === "inactive") {
    redirect("/auth/signout?reason=inactive");
  }

  if (result.status !== "unauthenticated") {
    redirect("/auth/signout?reason=denied");
  }

  redirect("/login");
}

export async function requireEmployeeProfile() {
  const profile = await requireAppProfile();

  if (isManagementRole(profile.role)) {
    redirect("/dashboard");
  }

  return profile;
}

export async function requireManagementProfile() {
  const profile = await requireAppProfile();

  if (!isManagementRole(profile.role)) {
    redirect("/dashboard");
  }

  return profile;
}
