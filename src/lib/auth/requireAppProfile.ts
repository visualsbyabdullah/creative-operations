import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAppRole, type AppRole, type EmployeeProfile } from "@/types/auth";

export const isManagementRole = (role: AppRole) => role === "hr" || role === "manager";

export async function requireAppProfile() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) redirect("/login?error=profile_missing");
  if (!isAppRole(data.role)) redirect("/login?error=invalid_role");
  if (!data.is_active) redirect("/login?error=account_disabled");

  return data as EmployeeProfile;
}

export async function requireEmployeeProfile() {
  const profile = await requireAppProfile();
  if (isManagementRole(profile.role)) redirect("/dashboard");
  return profile;
}

export async function requireManagementProfile() {
  const profile = await requireAppProfile();
  if (!isManagementRole(profile.role)) redirect("/dashboard");
  return profile;
}