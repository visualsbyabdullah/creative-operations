"use client";

import { useState } from "react";

import {
  Bell,
  Check,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import EmployeeHeader from "@/components/layout/EmployeeHeader";

type NotificationSettings = {
  newTasks: boolean;
  deadlines: boolean;
  revisions: boolean;
  approvals: boolean;
  published: boolean;
  email: boolean;
  inApp: boolean;
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

function PreferenceRow({
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
      <div className="flex items-center gap-3">
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

export default function EmployeeSettings() {
  const [preferences, setPreferences] =
    useState<NotificationSettings>({
      newTasks: true,
      deadlines: true,
      revisions: true,
      approvals: true,
      published: true,
      email: true,
      inApp: true,
    });

  const [password, setPassword] =
    useState({
      current: "",
      next: "",
      confirm: "",
    });

  const [message, setMessage] =
    useState("");

  function updatePreference(
    key: keyof NotificationSettings,
    value: boolean,
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function showMessage(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function savePreferences() {
    showMessage(
      "Settings successfully saved.",
    );
  }

  function updatePassword() {
    if (
      !password.current ||
      !password.next ||
      !password.confirm
    ) {
      showMessage(
        "Complete all password fields.",
      );
      return;
    }

    if (
      password.next !==
      password.confirm
    ) {
      showMessage(
        "The new password and confirmation do not match.",
      );
      return;
    }

    setPassword({
      current: "",
      next: "",
      confirm: "",
    });

    showMessage(
      "Password successfully updated.",
    );
  }

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">
                Account preferences
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                Notifications aur account security
                manage your preferences.
              </p>
            </div>

            <button
              type="button"
              onClick={savePreferences}
              className="flex items-center gap-2 rounded-full bg-[#2f80ed] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200"
            >
              <Save size={17} />
              Save Settings
            </button>
          </section>

          {message ? (
            <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              <Check size={16} />
              {message}
            </div>
          ) : null}

          <section className="mt-7 grid gap-5 xl:grid-cols-2">
            <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 sm:p-6">
              

              <div>
                <PreferenceRow
                  icon={Sparkles}
                  title="New task assignments"
                  description="Naya creative task assign hone par."
                  checked={preferences.newTasks}
                  onChange={(value) =>
                    updatePreference(
                      "newTasks",
                      value,
                    )
                  }
                />

                <PreferenceRow
                  icon={Clock3}
                  title="Deadline reminders"
                  description="Deadline approach hone par."
                  checked={preferences.deadlines}
                  onChange={(value) =>
                    updatePreference(
                      "deadlines",
                      value,
                    )
                  }
                />

                <PreferenceRow
                  icon={Bell}
                  title="Revision requests"
                  description="Revision feedback milne par."
                  checked={preferences.revisions}
                  onChange={(value) =>
                    updatePreference(
                      "revisions",
                      value,
                    )
                  }
                />

                <PreferenceRow
                  icon={Check}
                  title="Approval updates"
                  description="Submission approve hone par."
                  checked={preferences.approvals}
                  onChange={(value) =>
                    updatePreference(
                      "approvals",
                      value,
                    )
                  }
                />

                <PreferenceRow
                  icon={Settings}
                  title="Publishing updates"
                  description="Content publish hone par."
                  checked={preferences.published}
                  onChange={(value) =>
                    updatePreference(
                      "published",
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
                        Email delivery
                      </p>
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={preferences.email}
                    onChange={(value) =>
                      updatePreference(
                        "email",
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
                        CreativeOps alerts
                      </p>
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={preferences.inApp}
                    onChange={(value) =>
                      updatePreference(
                        "inApp",
                        value,
                      )
                    }
                    ariaLabel="In-app notifications"
                  />
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-bold">
                    Account Security
                  </h2>

                  <p className="mt-1 text-[10px] text-[#9299a4]">
                    Update your login password.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <label>
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
                      value={password.current}
                      onChange={(event) =>
                        setPassword(
                          (current) => ({
                            ...current,
                            current:
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
                    New password
                  </span>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                    <KeyRound
                      size={15}
                      className="text-[#9299a4]"
                    />

                    <input
                      type="password"
                      value={password.next}
                      onChange={(event) =>
                        setPassword(
                          (current) => ({
                            ...current,
                            next:
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
                    Confirm password
                  </span>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4">
                    <KeyRound
                      size={15}
                      className="text-[#9299a4]"
                    />

                    <input
                      type="password"
                      value={password.confirm}
                      onChange={(event) =>
                        setPassword(
                          (current) => ({
                            ...current,
                            confirm:
                              event.target.value,
                          }),
                        )
                      }
                      className="h-12 w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>

                <div className="border-t border-[#edf0f5] pt-5">
                  <button
                    type="button"
                    onClick={updatePassword}
                    className="inline-flex items-center gap-2 rounded-full border border-[#dfe5ed] bg-white px-5 py-2.5 text-xs font-bold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                  >
                    <LockKeyhole size={15} />
                    Update Password
                  </button>
                </div>
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}



