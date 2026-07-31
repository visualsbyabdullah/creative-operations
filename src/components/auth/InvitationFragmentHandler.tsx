"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { beginInvitationAcceptance } from "@/app/auth/invitation-actions";
import { establishInvitationFromFragment } from "@/lib/auth/invitation-client-flow";
import { createClient } from "@/lib/supabase/client";

export default function InvitationFragmentHandler({
  children,
}: {
  children?: ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    "checking" | "ordinary" | "invalid"
  >("checking");

  useEffect(() => {
    let active = true;

    async function processFragment() {
      const hash = window.location.hash;

      if (!hash) {
        if (active) setState("ordinary");
        return;
      }

      try {
        const supabase = createClient();
        const result =
          await establishInvitationFromFragment(
            hash,
            window.history,
            window.location,
            supabase,
            beginInvitationAcceptance,
          );
        if (!result.ok) {
          if (active) setState("invalid");
          return;
        }

        router.replace(result.destination);
        router.refresh();
      } catch {
        if (active) setState("invalid");
      }
    }

    void processFragment();
    return () => {
      active = false;
    };
  }, [router]);

  if (state === "ordinary") return children;

  return (
    <main className="grid min-h-screen place-items-center bg-[#242424] px-5">
      <section className="w-full max-w-[440px] rounded-[30px] bg-white p-8 text-center shadow-[0_32px_100px_rgba(0,0,0,0.34)]">
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">
          {state === "checking"
            ? "Accepting your invitation…"
            : "Invitation unavailable"}
        </h1>
        <p
          role={state === "invalid" ? "alert" : "status"}
          className="mt-3 text-sm leading-6 text-[#777e89]"
        >
          {state === "checking"
            ? "Please wait while we securely prepare your account."
            : "This invitation is invalid or has expired. Ask your administrator to resend it."}
        </p>
      </section>
    </main>
  );
}
