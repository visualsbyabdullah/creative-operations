import { clearSensitiveAuthFragment } from "@/lib/auth/invitation-fragment";

type EmailChangeClient = {
  auth: {
    setSession(input: {
      access_token: string;
      refresh_token: string;
    }): Promise<{ error: unknown | null }>;
    getUser(): Promise<{
      data: { user: { email?: string } | null };
      error: unknown | null;
    }>;
  };
};

export function authFragmentType(hash: string): string | null {
  if (!hash || hash === "#") return null;
  try {
    return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash).get("type");
  } catch {
    return null;
  }
}

export async function establishEmailChangeFromFragment(
  hash: string,
  browserHistory: Pick<History, "replaceState">,
  location: Pick<Location, "pathname" | "search">,
  client: EmailChangeClient,
): Promise<{ ok: true } | { ok: false }> {
  if (authFragmentType(hash) !== "email_change") return { ok: false };

  const parameters = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const accessToken = parameters.get("access_token");
  const refreshToken = parameters.get("refresh_token");
  if (!accessToken || !refreshToken) return { ok: false };

  clearSensitiveAuthFragment(browserHistory, location);
  const session = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (session.error) return { ok: false };

  const user = await client.auth.getUser();
  return !user.error && user.data.user?.email ? { ok: true } : { ok: false };
}
