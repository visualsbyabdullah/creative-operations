"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

import PixelBlast from "@/components/ui/PixelBlast";
import { login } from "@/app/auth/actions";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] =
    useState(false);
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const result = await login({
        email,
        password,
        rememberMe,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.replace(result.destination);
      router.refresh();
    } catch {
      setError(
        "Unable to sign in with those credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen min-h-[100dvh] items-center justify-center overflow-hidden bg-[#242424] px-5 py-10 sm:px-8">
      <div className="fixed inset-0 z-0 h-screen h-[100dvh] w-screen overflow-hidden">
        <PixelBlast
          className="absolute inset-0 h-full w-full"
          variant="circle"
          pixelSize={6}
          color="#4A9CFF"
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.6}
          edgeFade={0}
          transparent
        />
      </div>

      <section className="relative z-10 w-full max-w-[440px] rounded-[30px] border border-white/80 bg-white p-8 shadow-[0_32px_100px_rgba(0,0,0,0.34)] sm:p-9">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-blue-gradient text-white shadow-lg shadow-blue-200">
            <Palette size={22} />
          </div>

          <div>
            <p className="text-xl font-bold tracking-[-0.04em]">
              CreativeOps
            </p>

            <p className="mt-1 text-xs text-[#9299a4]">
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
            Enter your company email and password.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 flex flex-col gap-5"
        >
          <label className="block">
            <span className="text-xs font-bold text-[#4d5560]">
              Email address
            </span>

            <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4 transition focus-within:border-[#2f80ed] focus-within:ring-4 focus-within:ring-blue-50">
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
                  setEmail(event.target.value)
                }
                placeholder="name@company.com"
                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-[#a7adb6]"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-[#4d5560]">
              Password
            </span>

            <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[#e5e9ef] px-4 transition focus-within:border-[#2f80ed] focus-within:ring-4 focus-within:ring-blue-50">
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
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a7adb6]"
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
                    (current) => !current,
                  )
                }
                className="grid size-8 shrink-0 place-items-center rounded-full text-[#9299a4] transition hover:bg-[#f4f6f9] hover:text-[#2f80ed]"
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
            <div
              role="alert"
              className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-[#626a75]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked,
                  )
                }
                className="size-4 cursor-pointer rounded border-[#cfd6df] accent-[#2f80ed]"
              />

              <span>Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#2f80ed] transition hover:text-[#1769d2]"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1769d2] disabled:cursor-not-allowed disabled:opacity-60"
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
