"use client";

import {
  useActionState,
} from "react";
import {
  LoaderCircle,
  MailCheck,
} from "lucide-react";

import {
  acceptInvite,
  type AcceptInviteActionState,
} from "@/app/auth/accept-invite/actions";

const INITIAL_STATE: AcceptInviteActionState = {
  error: "",
};

export default function AcceptInviteForm({
  tokenHash,
}: {
  tokenHash: string;
}) {
  const [state, formAction, pending] =
    useActionState(
      acceptInvite,
      INITIAL_STATE,
    );

  return (
    <form
      action={formAction}
      className="mt-7"
    >
      <input
        type="hidden"
        name="token_hash"
        value={tokenHash}
      />
      <input
        type="hidden"
        name="type"
        value="invite"
      />

      {state.error ? (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700"
        >
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue-gradient px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
        ) : (
          <MailCheck size={17} />
        )}
        {pending
          ? "Accepting invitation…"
          : "Accept invitation"}
      </button>
    </form>
  );
}
