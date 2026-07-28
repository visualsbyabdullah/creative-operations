"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Palette,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        "Enter the email address linked to your account.",
      );
      return;
    }

    setIsSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = createClient();

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );

    setIsSending(false);

    if (error) {
      setErrorMessage(
        error.message ||
          "We could not send the reset email. Please try again.",
      );
      return;
    }

    setSuccessMessage(
      "Check your inbox for a secure password reset link.",
    );
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
                Account recovery
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#2f80ed]">
            <Mail size={21} />
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
            Reset your password
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#777e89]">
            Enter your company email and we will send you a secure reset link.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >
            <label className="block">
              <span className="text-xs font-bold text-[#4d5560]">
                Email address
              </span>

              <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#e1e6ed] bg-white px-4 transition focus-within:border-[#2f80ed] focus-within:ring-4 focus-within:ring-blue-50">
                <Mail
                  size={17}
                  className="shrink-0 text-[#9aa1ac]"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b0b6bf]"
                />
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

            {successMessage ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-700"
              >
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0"
                />
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue-gradient px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Mail size={17} />
              )}

              {isSending
                ? "Sending reset link..."
                : "Send reset link"}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-[#626a75] transition hover:text-[#2f80ed]"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
