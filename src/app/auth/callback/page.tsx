import { redirect } from "next/navigation";

import InvitationFragmentHandler from "@/components/auth/InvitationFragmentHandler";

const ALLOWED_CALLBACK_PARAMETERS = new Set([
  "code",
  "error",
  "error_code",
  "error_description",
]);

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parameters = await searchParams;
  const keys = Object.keys(parameters);

  if (keys.length > 0) {
    const query = new URLSearchParams();

    for (const key of keys) {
      if (!ALLOWED_CALLBACK_PARAMETERS.has(key)) {
        redirect("/forgot-password?state=invalid_link");
      }

      const value = parameters[key];
      if (typeof value !== "string") {
        redirect("/forgot-password?state=invalid_link");
      }
      query.set(key, value);
    }

    redirect(`/auth/callback/exchange?${query.toString()}`);
  }

  return <InvitationFragmentHandler />;
}
