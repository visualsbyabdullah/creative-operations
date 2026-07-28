import Link from "next/link";
import {
  CircleSlash2,
  Palette,
} from "lucide-react";

export default function InactiveAccountPage() {
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
                Account access
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
            <CircleSlash2 size={21} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
            Account unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#777e89]">
            You cannot access this workspace right now.
            Contact your administrator if you believe this
            is a mistake.
          </p>
          <Link
            href="/login"
            className="mt-7 flex h-12 w-full items-center justify-center rounded-2xl bg-brand-blue-gradient px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:brightness-95"
          >
            Return to login
          </Link>
        </div>
      </section>
    </main>
  );
}
