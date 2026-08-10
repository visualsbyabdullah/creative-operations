"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Palette,
} from "lucide-react";
import {
  useState,
  type FormEvent,
} from "react";

import { submitInvitationPassword } from "@/app/auth/invitation-actions";

export default function SetInvitationPasswordForm({
  hasValidInvitation,
}: {
  hasValidInvitation: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);
  const [isUpdating, setIsUpdating] =
    useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    setIsUpdating(true);

    try {
      const result = await submitInvitationPassword({
        password,
        confirmation,
      });
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setPassword("");
      setConfirmation("");
      setSuccess(true);
      window.setTimeout(() => {
        router.replace(result.destination);
        router.refresh();
      }, 600);
    } catch {
      setErrorMessage(
        "We could not create your password. Ask your administrator to resend the invitation.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#e7ebf2] p-4 sm:p-6">
      <section className="w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.14)]">
        <header className="border-b border-[#edf0f5] bg-white px-6 py-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-brand-blue-gradient text-white shadow-lg shadow-blue-200">
              <Palette size={20} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-[-0.04em]">
                CreativeOps
              </p>
              <p className="text-[11px] text-[#939aa5]">
                Invitation acceptance
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#2f80ed]">
            <LockKeyhole size={21} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
            Create your password
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#777e89]">
            {hasValidInvitation
              ? "Choose a strong password to finish accepting your invitation."
              : "This invitation is invalid or has expired. Ask your administrator to resend it."}
          </p>

          {hasValidInvitation && !success ? (
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              {[
                {
                  label: "New password",
                  value: password,
                  setter: setPassword,
                  visible: showPassword,
                  toggle: setShowPassword,
                },
                {
                  label: "Confirm new password",
                  value: confirmation,
                  setter: setConfirmation,
                  visible: showConfirmation,
                  toggle: setShowConfirmation,
                },
              ].map((field) => (
                <label
                  className="block"
                  key={field.label}
                >
                  <span className="text-xs font-bold text-[#4d5560]">
                    {field.label}
                  </span>
                  <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#e1e6ed] bg-white px-4 focus-within:border-[#2f80ed] focus-within:ring-4 focus-within:ring-blue-50">
                    <LockKeyhole
                      size={17}
                      className="shrink-0 text-[#9aa1ac]"
                    />
                    <input
                      type={
                        field.visible
                          ? "text"
                          : "password"
                      }
                      value={field.value}
                      onChange={(event) => {
                        field.setter(event.target.value);
                        setErrorMessage("");
                      }}
                      autoComplete="new-password"
                      placeholder="At least 12 characters"
                      className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        field.toggle(
                          (current) => !current,
                        )
                      }
                      aria-label={
                        field.visible
                          ? `Hide ${field.label.toLowerCase()}`
                          : `Show ${field.label.toLowerCase()}`
                      }
                      className="text-[#8f96a1] hover:text-[#2f80ed]"
                    >
                      {field.visible ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </label>
              ))}

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700"
                >
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isUpdating}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue-gradient px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 disabled:opacity-60"
              >
                {isUpdating ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <LockKeyhole size={17} />
                )}
                {isUpdating
                  ? "Creating password..."
                  : "Create password"}
              </button>
            </form>
          ) : success ? (
            <div
              role="status"
              className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
            >
              Your password was created securely. Preparing your account…
            </div>
          ) : (
            <div
              role="alert"
              className="mt-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700"
            >
              No valid invitation session is available.
            </div>
          )}

          {!hasValidInvitation ? (
            <Link
              href="/login"
              className="mt-6 block text-center text-xs font-bold text-[#626a75] hover:text-[#2f80ed]"
            >
              Return to login
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
