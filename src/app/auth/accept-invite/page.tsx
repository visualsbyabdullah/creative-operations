import Link from "next/link";
import {
  MailCheck,
  Palette,
} from "lucide-react";

import AcceptInviteForm from "@/components/auth/AcceptInviteForm";
import {
  SAFE_INVITATION_ERROR,
  validateInviteTokenInput,
} from "@/lib/auth/accept-invite";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string | string[];
    type?: string | string[];
  }>;
}) {
  const parameters = await searchParams;
  const invitation = validateInviteTokenInput(
    parameters.token_hash,
    parameters.type,
  );

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
            <MailCheck size={22} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
            {invitation.ok
              ? "You have been invited"
              : "Invitation unavailable"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#777e89]">
            {invitation.ok
              ? "Accept your invitation to securely create your account password."
              : SAFE_INVITATION_ERROR}
          </p>

          {invitation.ok ? (
            <AcceptInviteForm
              tokenHash={invitation.tokenHash}
            />
          ) : (
            <div
              role="alert"
              className="mt-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700"
            >
              No valid invitation is available.
            </div>
          )}

          {!invitation.ok ? (
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
