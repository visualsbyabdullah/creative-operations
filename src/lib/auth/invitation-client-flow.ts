import {
  clearSensitiveAuthFragment,
  parseInvitationFragment,
} from "@/lib/auth/invitation-fragment";

type SessionClient = {
  auth: {
    setSession(input: {
      access_token: string;
      refresh_token: string;
    }): Promise<{ error: unknown | null }>;
    signOut(input: {
      scope: "local";
    }): Promise<unknown>;
  };
};

export type InvitationClientResult =
  | { ok: true; destination: "/auth/set-password" }
  | { ok: false; code: "not_invitation" | "invalid_invitation" };

export async function establishInvitationFromFragment(
  hash: string,
  browserHistory: Pick<History, "replaceState">,
  location: Pick<Location, "pathname" | "search">,
  client: SessionClient,
  beginAcceptance: () => Promise<{ ok: boolean }>,
): Promise<InvitationClientResult> {
  if (!hash) {
    return { ok: false, code: "not_invitation" };
  }

  const parsed = parseInvitationFragment(hash);
  clearSensitiveAuthFragment(browserHistory, location);

  if (!parsed.ok) {
    return { ok: false, code: "invalid_invitation" };
  }

  try {
    const { error } = await client.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });
    if (error) {
      return { ok: false, code: "invalid_invitation" };
    }

    const accepted = await beginAcceptance();
    if (!accepted.ok) {
      await client.auth.signOut({ scope: "local" });
      return { ok: false, code: "invalid_invitation" };
    }

    return {
      ok: true,
      destination: "/auth/set-password",
    };
  } catch {
    return { ok: false, code: "invalid_invitation" };
  }
}
