import { redirect } from "next/navigation";

import CreativeDashboard from "@/components/dashboard/CreativeDashboard";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  isAppRole,
  type EmployeeProfile,
} from "@/types/auth";

export default async function DashboardPage() {
  const supabase =
    await createClient();

  const {
    data: claimsData,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (
    error ||
    !data
  ) {
    redirect(
      "/login?error=profile_missing",
    );
  }

  if (
    !isAppRole(data.role)
  ) {
    redirect(
      "/login?error=invalid_role",
    );
  }

  if (!data.is_active) {
    redirect(
      "/login?error=account_disabled",
    );
  }

  const profile =
    data as EmployeeProfile;

  if (
    profile.role ===
      "graphic_designer" ||
    profile.role ===
      "video_editor"
  ) {
    return <CreativeDashboard />;
  }

  if (profile.role === "hr") {
    return (
      <main className="min-h-screen bg-[#e7ebf2] p-6">
        <section className="mx-auto max-w-[1600px] rounded-[26px] bg-white p-8">
          <p className="text-sm font-semibold text-[#2f80ed]">
            Human Resources
          </p>

          <h1 className="mt-2 text-4xl font-semibold">
            Welcome, {profile.full_name}
          </h1>

          <p className="mt-3 text-sm text-[#777e89]">
            HR dashboard next phase mein
            develop hoga.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-6">
      <section className="mx-auto max-w-[1600px] rounded-[26px] bg-white p-8">
        <p className="text-sm font-semibold text-[#2f80ed]">
          Management
        </p>

        <h1 className="mt-2 text-4xl font-semibold">
          Welcome, {profile.full_name}
        </h1>

        <p className="mt-3 text-sm text-[#777e89]">
          Manager dashboard next phase mein
          develop hoga.
        </p>
      </section>
    </main>
  );
}
