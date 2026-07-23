import { BadgeCheck, BriefcaseBusiness, Mail, UserRound } from "lucide-react";
import ManagementShell from "./ManagementShell";
import type { EmployeeProfile } from "@/types/auth";

export default function ManagementProfileSettings({ profile }: { profile: EmployeeProfile }) {
  const role = profile.role === "hr" ? "HR" : "Manager";
  const initials = profile.full_name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ManagementShell>
      <section>
        <p className="text-sm font-semibold text-[#2f80ed]">Account settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Profile & Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">View your management account and workspace access.</p>
      </section>

      <section className="page-section-gap grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <article className="rounded-[24px] border border-[#edf0f5] bg-white p-6 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#1d2430] text-2xl font-bold text-white">{initials}</div>
          <h2 className="mt-4 text-xl font-bold">{profile.full_name}</h2>
          <p className="mt-1 text-sm text-[#777e89]">{role}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700"><BadgeCheck size={13} /> Active account</span>
        </article>

        <article className="rounded-[24px] border border-[#edf0f5] bg-white p-6">
          <h2 className="text-lg font-bold">Account Information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {([
              ["Full name", profile.full_name, UserRound],
              ["Email", profile.email, Mail],
              ["Role", role, BriefcaseBusiness],
              ["Department", profile.department || "Management", BriefcaseBusiness],
            ] as const).map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-[18px] bg-[#f7f9fc] p-4">
                <div className="flex items-center gap-2 text-[#2f80ed]"><Icon size={15} /><p className="text-[10px] font-bold uppercase tracking-[0.08em]">{label}</p></div>
                <p className="mt-3 text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </ManagementShell>
  );
}