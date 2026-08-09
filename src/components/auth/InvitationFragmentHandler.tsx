"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { beginInvitationAcceptance } from "@/app/auth/invitation-actions";
import { establishInvitationFromFragment } from "@/lib/auth/invitation-client-flow";
import {
  authFragmentType,
  establishEmailChangeFromFragment,
} from "@/lib/auth/email-change-client-flow";
import { createClient } from "@/lib/supabase/client";

export default function InvitationFragmentHandler({
  children,
}: {
  children?: ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    "checking" | "email_change" | "ordinary" | "invalid"
  >("ordinary");

  useEffect(() => {
    let active = true;

    async function processFragment() {
      const hash = window.location.hash;

      if (!hash) {
        return;
      }

      const fragmentType = authFragmentType(hash);
      if (fragmentType !== "invite" && fragmentType !== "email_change") return;

      if (fragmentType === "email_change") {
        setState("email_change");
        try {
          const result = await establishEmailChangeFromFragment(
            hash,
            window.history,
            window.location,
            createClient(),
          );
          router.replace(result.ok ? "/profile?state=email_changed" : "/login?state=email_change_failed");
          router.refresh();
        } catch {
          router.replace("/login?state=email_change_failed");
        }
        return;
      }

      setState("checking");

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
            : state === "email_change"
              ? "Confirming your email address…"
              : "Invitation unavailable"}
        </h1>
        <p
          role={state === "invalid" ? "alert" : "status"}
          className="mt-3 text-sm leading-6 text-[#777e89]"
        >
          {state === "checking"
            ? "Please wait while we securely prepare your account."
            : state === "email_change"
              ? "Please wait while we securely finish your email change."
              : "This invitation is invalid or has expired. Ask your administrator to resend it."}
        </p>
      </section>
    </main>
  );
}
