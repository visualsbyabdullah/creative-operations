"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  BriefcaseBusiness,
  Camera,
  Check,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import type { SelfProfile } from "@/lib/profiles/profile-types";
import {
  changePasswordAction,
  requestEmailChangeAction,
  updateOwnProfileAction,
} from "@/app/profile/actions";
import { departmentLabel, roleLabel as getRoleLabel } from "@/config/employee";
import {
  removeAvatarAction,
  uploadAvatarAction,
} from "@/app/profile/avatar-actions";

type NotificationSettings = {
  newTaskAssignments: boolean;
  deadlineReminders: boolean;
  revisionRequests: boolean;
  approvalUpdates: boolean;
  publishingUpdates: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
};

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked
          ? "bg-[#2f80ed]"
          : "bg-[#d9dee6]"
      }`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-white transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0f2f5] py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f3f7fc] text-[#2f80ed]">
          <Icon size={17} />
        </div>

        <div>
          <p className="text-xs font-bold">
            {title}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-[#9299a4]">
            {description}
          </p>
        </div>
      </div>

      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        ariaLabel={title}
      />
    </div>
  );
}

export default function EmployeeProfileSettings({ profile }: { profile: SelfProfile }) {
  const router = useRouter();
  const initials = profile.fullName.split(/\s+/u).map((word) => word[0]).join("").slice(0,2).toUpperCase();
  const roleLabel = getRoleLabel(profile.role);
  const management = profile.role === "manager" || profile.role === "hr";
  const [profileForm, setProfileForm] =
    useState({
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone ?? "",
      timezone: profile.timezone ?? "UTC",
      newEmail: "",
    });

  const [
    notificationSettings,
    setNotificationSettings,
  ] = useState<NotificationSettings>({
    newTaskAssignments: profile.preferences.newTaskAssignments,
    deadlineReminders: profile.preferences.deadlineReminders,
    revisionRequests: profile.preferences.revisionRequests,
    approvalUpdates: profile.preferences.approvalUpdates,
    publishingUpdates: profile.preferences.publishingUpdates,
    emailNotifications: profile.preferences.emailEnabled,
    inAppNotifications: profile.preferences.inAppEnabled,
  });

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [saveMessage, setSaveMessage] =
    useState("");
  const [avatarPending,startAvatarTransition]=useTransition();

  function uploadAvatar(file:File|null){
    if(!file||avatarPending)return;
    const formData=new FormData();
    formData.set("file",file);
    formData.set("expectedUpdatedAt",profile.updatedAt);
    startAvatarTransition(async()=>{
      const result=await uploadAvatarAction(formData);
      if(!result.ok){
        setSaveMessage(result.code==="validation_failed"
          ?"Choose a JPEG, PNG, or WebP image up to 5 MB."
          : result.code==="stale_update"
            ?"Your profile changed elsewhere. Reload before uploading."
            :"Avatar upload could not be completed.");
        return;
      }
      window.location.reload();
    });
  }

  function removeAvatar(){
    if(avatarPending||!profile.avatarPath)return;
    startAvatarTransition(async()=>{
      const result=await removeAvatarAction(profile.updatedAt);
      if(!result.ok){
        setSaveMessage(result.code==="stale_update"
          ?"Your profile changed elsewhere. Reload before removing the avatar."
          :"Avatar removal could not be completed.");
        return;
      }
      window.location.reload();
    });
  }

  function updateNotificationSetting(
    key: keyof NotificationSettings,
    value: boolean,
  ) {
    setNotificationSettings(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }

  async function saveProfile() {
    const result = await updateOwnProfileAction({
      fullName: profileForm.fullName,
      avatarUrl: null,
      phone: profileForm.phone || null,
      timezone: profileForm.timezone,
      preferences: {
        newTaskAssignments: notificationSettings.newTaskAssignments,
        deadlineReminders: notificationSettings.deadlineReminders,
        revisionRequests: notificationSettings.revisionRequests,
        approvalUpdates: notificationSettings.approvalUpdates,
        publishingUpdates: notificationSettings.publishingUpdates,
        emailEnabled: notificationSettings.emailNotifications,
        inAppEnabled: notificationSettings.inAppNotifications,
      },
      expectedUpdatedAt: profile.updatedAt,
    });
    setSaveMessage(result.ok
      ? "Profile settings successfully saved."
      : result.code === "stale_update"
        ? "This profile changed elsewhere. Reload before saving again."
        : result.code === "rate_limited"
          ? "Too many save attempts. Please try again later."
          : "Profile settings could not be saved.");

    if (result.ok) router.refresh();

    window.setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  }

  async function updatePassword() {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setSaveMessage(
        "Complete all password fields.",
      );

      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setSaveMessage(
        "The new password and confirmation do not match.",
      );

      return;
    }

    const result = await changePasswordAction({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmation: passwordForm.confirmPassword,
    });
    if (result.ok) {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
    setSaveMessage(result.ok
      ? "Password successfully updated."
      : result.code === "forbidden"
        ? "The current password is incorrect."
        : result.code === "validation_failed"
          ? "Use a matching new password with at least 12 characters."
          : "Password could not be updated.");

    window.setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  }

  async function changeEmail() {
    const result = await requestEmailChangeAction({ email: profileForm.newEmail });
    setSaveMessage(result.ok
      ? "Check your email to confirm the new address."
      : result.code === "validation_failed"
        ? "Enter a valid new email address."
        : result.code === "rate_limited"
          ? "Too many email change attempts. Please try again later."
          : "Email change could not be started.");
    if (result.ok) setProfileForm((current) => ({ ...current, newEmail: "" }));
  }

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader
          employee={{ initials, name: profile.fullName, role: roleLabel, avatarUrl: profile.avatarUrl }}
          variant={management ? "management" : "employee"}
          workspaceLabel={management ? "Management workspace" : "Creative operations workspace"}
        />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">
                {management ? "Management workspace" : "Personal workspace"}
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Profile & Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                Manage your profile, notification preferences, and account security.
              </p>
            </div>

          </section>

          {saveMessage ? (
            <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              <Check size={16} />
              {saveMessage}
            </div>
          ) : null}


          <section className="mt-5 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 text-center shadow-[0_12px_35px_rgba(24,39,75,0.035)]">
                <div className="relative mx-auto w-fit">
                  <div
                    className="grid size-24 place-items-center rounded-full bg-cover bg-center bg-[#1d2430] text-2xl font-bold text-white"
                    style={profile.avatarUrl?{backgroundImage:`url("${profile.avatarUrl}")`}:undefined}
                  >
                    {profile.avatarUrl?null:initials}
                  </div>

                  <label
                    title="Upload a private JPEG, PNG, or WebP avatar up to 5 MB."
                    aria-label="Upload avatar"
                    className="absolute bottom-0 right-0 grid size-9 cursor-pointer place-items-center rounded-full border-4 border-white bg-[#2f80ed] text-white"
                  >
                    <Camera size={14} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={avatarPending}
                      onChange={(event)=>uploadAvatar(event.target.files?.[0]??null)}
                      className="sr-only"
                    />
                  </label>
                </div>
                {profile.avatarPath ? (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    disabled={avatarPending}
                    className="mt-3 text-xs font-bold text-red-600 disabled:opacity-40"
                  >
                    {avatarPending?"Updating avatar...":"Remove avatar"}
                  </button>
                ) : null}

                <h2 className="mt-4 text-xl font-bold tracking-[-0.03em]">
                  {profileForm.fullName}
                </h2>

                <p className="mt-1 text-xs font-semibold text-[#2f80ed]">
                  {roleLabel}
                </p>

                <p className="mt-2 text-xs text-[#9299a4]">
                  {departmentLabel(profile.role)}
                </p>

                <div className="mt-5 border-t border-[#f0f2f5] pt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9299a4]">
                      Account status
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-[#9299a4]">
                      Employee ID
                    </span>

                    <span className="font-bold">
                      {profile.id}
                    </span>
                  </div>
                </div>
              </article>

              <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                    <BriefcaseBusiness
                      size={17}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Work Information
                    </p>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      Employment details
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock3
                      size={15}
                      className="mt-0.5 shrink-0 text-[#9299a4]"
                    />

                    <div>
                      <p className="text-[10px] text-[#9299a4]">
                        Department
                      </p>

                      <p className="mt-1 text-xs font-bold">
                        {profile.department ? departmentLabel(profile.role) : "Management"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 text-[#9299a4]"
                    />

                    <div>
                      <p className="text-[10px] text-[#9299a4]">
                        Manager assignment
                      </p>

                      <p className="mt-1 text-xs font-bold">
                        {profile.managerId ?? "Not assigned"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </aside>

            <div className="space-y-5">
              <section className="rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_12px_35px_rgba(24,39,75,0.035)] sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <UserRound size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold">
                      Personal Information
                    </h2>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      Basic profile and contact
                      details
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-bold text-[#4d5560]">
                      Full name
                    </span>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                      <UserRound
                        size={15}
                        className="shrink-0 text-[#9299a4]"
                      />

                      <input
                        value={profileForm.fullName}
                        onChange={(event) =>
                          setProfileForm(
                            (current) => ({
                              ...current,
                              fullName:
                                event.target.value,
                            }),
                          )
                        }
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="text-xs font-bold text-[#4d5560]">
                      Current email
                    </span>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                      <Mail
                        size={15}
                        className="shrink-0 text-[#9299a4]"
                      />

                      <input
                        type="email"
                        value={profileForm.email}
                        readOnly
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="text-xs font-bold text-[#4d5560]">
                      New email
                    </span>
                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                      <Mail size={15} className="shrink-0 text-[#9299a4]" />
                      <input
                        type="email"
                        value={profileForm.newEmail}
                        onChange={(event) => setProfileForm((current) => ({ ...current, newEmail: event.target.value }))}
                        placeholder="Enter a new email address"
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={changeEmail}
                      className="mt-3 rounded-full border border-[#dfe5ed] px-4 py-2 text-xs font-bold text-[#4f5762] hover:border-[#2f80ed] hover:text-[#2f80ed]"
                    >
                      Change Email
                    </button>
                  </label>

                  <label>
                    <span className="text-xs font-bold text-[#4d5560]">
                      Phone number
                    </span>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                      <Phone
                        size={15}
                        className="shrink-0 text-[#9299a4]"
                      />

                      <input
                        value={profileForm.phone}
                        onChange={(event) =>
                          setProfileForm(
                            (current) => ({
                              ...current,
                              phone:
                                event.target.value,
                            }),
                          )
                        }
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="text-xs font-bold text-[#4d5560]">
                      Timezone
                    </span>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                      <MapPin
                        size={15}
                        className="shrink-0 text-[#9299a4]"
                      />

                      <input
                        value={profileForm.timezone}
                        onChange={(event) => setProfileForm((current) => ({ ...current, timezone: event.target.value }))}
                        placeholder="UTC"
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>

                </div>
              </section>

              <section className="rounded-[24px] border border-[#edf0f5] bg-white px-5 pb-5 pt-2 shadow-[0_12px_35px_rgba(24,39,75,0.035)] sm:px-6 sm:pb-6 sm:pt-2">

                <div>
                  <SettingsRow
                    icon={BriefcaseBusiness}
                    title="New task assignments"
                    description="When a new design or video task is assigned."
                    checked={
                      notificationSettings.newTaskAssignments
                    }
                    onChange={(value) =>
                      updateNotificationSetting(
                        "newTaskAssignments",
                        value,
                      )
                    }
                  />

                  <SettingsRow
                    icon={Clock3}
                    title="Deadline reminders"
                    description="Remind me when a task deadline is approaching."
                    checked={
                      notificationSettings.deadlineReminders
                    }
                    onChange={(value) =>
                      updateNotificationSetting(
                        "deadlineReminders",
                        value,
                      )
                    }
                  />

                  <SettingsRow
                    icon={Bell}
                    title="Revision requests"
                    description="Notify me when a manager or reviewer requests revisions."
                    checked={
                      notificationSettings.revisionRequests
                    }
                    onChange={(value) =>
                      updateNotificationSetting(
                        "revisionRequests",
                        value,
                      )
                    }
                  />

                  <SettingsRow
                    icon={Check}
                    title="Approval updates"
                    description="Notify me when a submission is approved."
                    checked={
                      notificationSettings.approvalUpdates
                    }
                    onChange={(value) =>
                      updateNotificationSetting(
                        "approvalUpdates",
                        value,
                      )
                    }
                  />

                  <SettingsRow
                    icon={BriefcaseBusiness}
                    title="Publishing updates"
                    description="Notify me when approved content is published."
                    checked={
                      notificationSettings.publishingUpdates
                    }
                    onChange={(value) =>
                      updateNotificationSetting(
                        "publishingUpdates",
                        value,
                      )
                    }
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-[18px] bg-[#f7f9fc] p-4">
                    <div className="flex items-center gap-3">
                      <Mail
                        size={16}
                        className="text-[#2f80ed]"
                      />

                      <div>
                        <p className="text-xs font-bold">
                          Email
                        </p>

                        <p className="mt-1 text-[9px] text-[#9299a4]">
                          Receive updates by email
                        </p>
                      </div>
                    </div>

                    <ToggleSwitch
                      checked={
                        notificationSettings.emailNotifications
                      }
                      onChange={(value) =>
                        updateNotificationSetting(
                          "emailNotifications",
                          value,
                        )
                      }
                      ariaLabel="Email notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-[18px] bg-[#f7f9fc] p-4">
                    <div className="flex items-center gap-3">
                      <Bell
                        size={16}
                        className="text-[#2f80ed]"
                      />

                      <div>
                        <p className="text-xs font-bold">
                          In-app
                        </p>

                        <p className="mt-1 text-[9px] text-[#9299a4]">
                          Show inside CreativeOps
                        </p>
                      </div>
                    </div>

                    <ToggleSwitch
                      checked={
                        notificationSettings.inAppNotifications
                      }
                      onChange={(value) =>
                        updateNotificationSetting(
                          "inAppNotifications",
                          value,
                        )
                      }
                      ariaLabel="In-app notifications"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_12px_35px_rgba(24,39,75,0.035)] sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold">
                      Account Security
                    </h2>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      Update your account password
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="text-xs font-bold text-[#4d5560]">
                      Current password
                    </span>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                      <LockKeyhole
                        size={15}
                        className="text-[#9299a4]"
                      />

                      <input
                        type="password"
                        value={
                          passwordForm.currentPassword
                        }
                        onChange={(event) =>
                          setPasswordForm(
                            (current) => ({
                              ...current,
                              currentPassword:
                                event.target.value,
                            }),
                          )
                        }
                        placeholder="Enter current password"
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="text-xs font-bold text-[#4d5560]">
                      New password
                    </span>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                      <KeyRound
                        size={15}
                        className="text-[#9299a4]"
                      />

                      <input
                        type="password"
                        value={
                          passwordForm.newPassword
                        }
                        onChange={(event) =>
                          setPasswordForm(
                            (current) => ({
                              ...current,
                              newPassword:
                                event.target.value,
                            }),
                          )
                        }
                        placeholder="Enter new password"
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="text-xs font-bold text-[#4d5560]">
                      Confirm password
                    </span>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                      <KeyRound
                        size={15}
                        className="text-[#9299a4]"
                      />

                      <input
                        type="password"
                        value={
                          passwordForm.confirmPassword
                        }
                        onChange={(event) =>
                          setPasswordForm(
                            (current) => ({
                              ...current,
                              confirmPassword:
                                event.target.value,
                            }),
                          )
                        }
                        placeholder="Confirm new password"
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-[#edf0f5] pt-6">
                  <button
                    type="button"
                    onClick={updatePassword}
                    className="flex min-w-[175px] items-center justify-center gap-2 rounded-full border border-[#dfe5ed] bg-white px-6 py-3 text-xs font-bold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                  >
                    <LockKeyhole size={15} />
                    Change Password
                  </button>

                  <button
                    type="button"
                    onClick={saveProfile}
                    className="flex min-w-[175px] items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1769d2]"
                  >
                    <Save size={15} />
                    Save Changes
                  </button>
                </div>
              </section>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
