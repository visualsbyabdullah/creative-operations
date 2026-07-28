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

import { createClient } from "@/lib/supabase/client";
import { clearBrowserAuthPersistence } from "@/lib/supabase/cookie-adapters";

export default function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");
  const [confirmation, setConfirmation] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);
  const [isUpdating, setIsUpdating] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage(
        "Use at least 8 characters for your new password.",
      );
      return;
    }

    if (password !== confirmation) {
      setErrorMessage(
        "The password confirmation does not match.",
      );
      return;
    }

    setIsUpdating(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setIsUpdating(false);
      setErrorMessage(
        error.message ||
          "We could not update your password. Request a new reset link and try again.",
      );
      return;
    }

    await supabase.auth.signOut({
      scope: "local",
    });
    clearBrowserAuthPersistence();

    router.replace(
      "/login?password_updated=1",
    );
    router.refresh();
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
                Secure password update
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#2f80ed]">
            <LockKeyhole size={21} />
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
            Create a new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#777e89]">
            Choose a strong password that you do not use for another account.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >
            <label className="block">
              <span className="text-xs font-bold text-[#4d5560]">
                New password
              </span>

              <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#e1e6ed] bg-white px-4 transition focus-within:border-[#2f80ed] focus-within:ring-4 focus-within:ring-blue-50">
                <LockKeyhole
                  size={17}
                  className="shrink-0 text-[#9aa1ac]"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    );
                    setErrorMessage("");
                  }}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b0b6bf]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="text-[#8f96a1] transition hover:text-[#2f80ed]"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[#4d5560]">
                Confirm new password
              </span>

              <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#e1e6ed] bg-white px-4 transition focus-within:border-[#2f80ed] focus-within:ring-4 focus-within:ring-blue-50">
                <LockKeyhole
                  size={17}
                  className="shrink-0 text-[#9aa1ac]"
                />

                <input
                  type={
                    showConfirmation
                      ? "text"
                      : "password"
                  }
                  value={confirmation}
                  onChange={(event) => {
                    setConfirmation(
                      event.target.value,
                    );
                    setErrorMessage("");
                  }}
                  autoComplete="new-password"
                  placeholder="Enter the password again"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b0b6bf]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmation(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showConfirmation
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                  className="text-[#8f96a1] transition hover:text-[#2f80ed]"
                >
                  {showConfirmation ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue-gradient px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
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
                ? "Updating password..."
                : "Update password"}
            </button>
          </form>

          <Link
            href="/forgot-password"
            className="mt-6 block text-center text-xs font-bold text-[#626a75] transition hover:text-[#2f80ed]"
          >
            Request another reset link
          </Link>
        </div>
      </section>
    </main>
  );
}
