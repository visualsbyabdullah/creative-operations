import type { EmployeeProfile } from "@/types/auth";

export default function ManagerRoleDashboard({
  profile,
}: {
  profile: EmployeeProfile;
}) {
  return (
    <main className="min-h-screen bg-[#e7ebf2] p-6">
      <section className="mx-auto max-w-[1600px] rounded-[26px] bg-white p-8">
        <p className="text-sm font-semibold text-[#2f80ed]">
          Management
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">
          Welcome, {profile.full_name}
        </h1>

        <p className="mt-3 text-sm text-[#777e89]">
          Manager dashboard employee end
          complete hone ke baad develop hoga.
        </p>
      </section>
    </main>
  );
}
