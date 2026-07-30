"use client";
import { useTransition } from "react";
import { BadgeCheck, BriefcaseBusiness, Camera, Mail, UserRound } from "lucide-react";
import ManagementShell from "./ManagementShell";
import type { EmployeeProfile } from "@/types/auth";
import type { SelfProfile } from "@/lib/profiles/profile-types";
import { removeAvatarAction,uploadAvatarAction } from "@/app/profile/avatar-actions";

export default function ManagementProfileSettings({ profile,model }: { profile: EmployeeProfile;model:SelfProfile }) {
  const [pending,startTransition]=useTransition();
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
          <div className="relative mx-auto w-fit">
            <div
              className="grid size-20 place-items-center rounded-full bg-cover bg-center bg-[#1d2430] text-2xl font-bold text-white"
              style={model.avatarUrl?{backgroundImage:`url("${model.avatarUrl}")`}:undefined}
            >{model.avatarUrl?null:initials}</div>
            <label className="absolute bottom-0 right-0 grid size-8 cursor-pointer place-items-center rounded-full border-4 border-white bg-[#2f80ed] text-white">
              <Camera size={12}/>
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} className="sr-only" onChange={(event)=>{
                const file=event.target.files?.[0];if(!file)return;
                const data=new FormData();data.set("file",file);data.set("expectedUpdatedAt",model.updatedAt);
                startTransition(async()=>{const result=await uploadAvatarAction(data);if(result.ok)window.location.reload();});
              }}/>
            </label>
          </div>
          {model.avatarPath?<button type="button" disabled={pending} onClick={()=>startTransition(async()=>{
            const result=await removeAvatarAction(model.updatedAt);if(result.ok)window.location.reload();
          })} className="mt-3 text-xs font-bold text-red-600 disabled:opacity-40">Remove avatar</button>:null}
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
