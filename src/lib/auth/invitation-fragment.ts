export type InvitationFragment =
  | {
      ok: true;
      accessToken: string;
      refreshToken: string;
    }
  | {
      ok: false;
      code:
        | "missing_fragment"
        | "invalid_type"
        | "missing_access_token"
        | "missing_refresh_token"
        | "malformed_fragment";
    };

const ALLOWED_KEYS = new Set([
  "access_token",
  "refresh_token",
  "expires_at",
  "expires_in",
  "token_type",
  "type",
]);

export function parseInvitationFragment(
  hash: string,
): InvitationFragment {
  if (!hash || hash === "#") {
    return { ok: false, code: "missing_fragment" };
  }

  let parameters: URLSearchParams;

  try {
    parameters = new URLSearchParams(
      hash.startsWith("#") ? hash.slice(1) : hash,
    );
  } catch {
    return { ok: false, code: "malformed_fragment" };
  }

  const keys = Array.from(parameters.keys());
  if (
    keys.length === 0 ||
    keys.some(
      (key) =>
        !ALLOWED_KEYS.has(key) ||
        parameters.getAll(key).length !== 1,
    )
  ) {
    return { ok: false, code: "malformed_fragment" };
  }

  if (parameters.get("type") !== "invite") {
    return { ok: false, code: "invalid_type" };
  }

  const accessToken = parameters.get("access_token");
  if (!accessToken) {
    return { ok: false, code: "missing_access_token" };
  }

  const refreshToken = parameters.get("refresh_token");
  if (!refreshToken) {
    return { ok: false, code: "missing_refresh_token" };
  }

  return {
    ok: true,
    accessToken,
    refreshToken,
  };
}
export function clearSensitiveAuthFragment(
  browserHistory: Pick<History, "replaceState">,
  location: Pick<Location, "pathname" | "search">,
) {
  browserHistory.replaceState(
    null,
    "",
    `${location.pathname}${location.search}`,
  );
}
