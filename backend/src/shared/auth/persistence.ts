import type { CookieOptions } from "@supabase/ssr";

export const AUTH_PERSISTENCE_COOKIE_NAME =
  "creative_ops_auth_persistence";

export const AUTH_PERSISTENT_MAX_AGE_SECONDS =
  2_592_000;

export type AuthPersistenceMode =
  | "session"
  | "persistent";

export type SupabaseCookieWrite = {
  name: string;
  value: string;
  options: CookieOptions;
};

export function parseAuthPersistence(
  value: unknown,
): AuthPersistenceMode {
  return value === "persistent"
    ? "persistent"
    : "session";
}

export function modeFromRememberMe(
  rememberMe: boolean,
): AuthPersistenceMode {
  return rememberMe
    ? "persistent"
    : "session";
}

export function authPersistenceCookieOptions(
  mode: AuthPersistenceMode,
): CookieOptions {
  const options: CookieOptions = {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure:
      process.env.NODE_ENV === "production",
  };

  if (mode === "persistent") {
    options.maxAge =
      AUTH_PERSISTENT_MAX_AGE_SECONDS;
  }

  return options;
}

export function authPersistenceDeletionOptions(): CookieOptions {
  return {
    ...authPersistenceCookieOptions("session"),
    maxAge: 0,
  };
}

export function isCookieDeletion(
  value: string,
  options: CookieOptions,
  now = Date.now(),
) {
  if (
    typeof options.maxAge === "number" &&
    options.maxAge <= 0
  ) {
    return true;
  }

  if (
    options.expires instanceof Date &&
    options.expires.getTime() <= now
  ) {
    return true;
  }

  // @supabase/ssr uses an empty value for removal writes.
  return value === "";
}

export function applyAuthCookiePersistence(
  cookiesToSet: SupabaseCookieWrite[],
  mode: AuthPersistenceMode,
): SupabaseCookieWrite[] {
  return cookiesToSet.map((cookie) => {
    if (
      isCookieDeletion(
        cookie.value,
        cookie.options,
      )
    ) {
      return cookie;
    }

    const options = {
      ...cookie.options,
    };

    delete options.expires;

    if (mode === "persistent") {
      options.maxAge =
        AUTH_PERSISTENT_MAX_AGE_SECONDS;
    } else {
      delete options.maxAge;
    }

    return {
      name: cookie.name,
      value: cookie.value,
      options,
    };
  });
}

/*
 * Browser cookie retention does not make a Supabase session valid.
 * Token expiry, rotation, revocation, inactivity and Dashboard session
 * time-box settings remain authoritative.
 */
