"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Palette,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const supabase =
        createClient();

      const {
        data,
        error: signInError,
      } =
        await supabase.auth
          .signInWithPassword({
            email: email
              .trim()
              .toLowerCase(),

            password,
          });

      if (
        signInError ||
        !data.user
      ) {
        setError(
          signInError?.message ??
            "Login unsuccessful.",
        );

        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Login process mein unexpected error aya.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#e7ebf2] p-4">
      <section className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(24,39,75,0.14)] sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#67adff] to-[#2f80ed] text-white shadow-lg shadow-blue-200">
            <Palette size={22} />
          </div>

          <div>
            <p className="text-xl font-bold tracking-[-0.04em]">
              CreativeOps
            </p>

            <p className="mt-0.5 text-xs text-[#9299a4]">
              Creative operations workspace
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-bold text-[#2f80ed]">
            Welcome back
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
            Sign in to your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#777e89]">
            Apni company email aur password
            enter karo.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >
          <label className="block">
            <span className="text-xs font-bold text-[#4d5560]">
              Email address
            </span>

            <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4 focus-within:border-[#2f80ed]">
              <Mail
                size={16}
                className="shrink-0 text-[#9299a4]"
              />

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="name@company.com"
                className="h-full w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-[#4d5560]">
              Password
            </span>

            <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4 focus-within:border-[#2f80ed]">
              <LockKeyhole
                size={16}
                className="shrink-0 text-[#9299a4]"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter password"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current,
                  )
                }
                className="grid size-8 shrink-0 place-items-center rounded-full text-[#9299a4] hover:bg-[#f4f6f9]"
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1769d2] disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />

                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
