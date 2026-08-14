import {
  parseCookieHeader,
  serializeCookieHeader,
  type CookieMethodsBrowser,
  type CookieMethodsServer,
  type CookieOptions,
} from "@supabase/ssr";

import {
  applyAuthCookiePersistence,
  AUTH_PERSISTENCE_COOKIE_NAME,
  authPersistenceCookieOptions,
  authPersistenceDeletionOptions,
  parseAuthPersistence,
  type AuthPersistenceMode,
  type SupabaseCookieWrite,
} from "@shared/auth/persistence";

type ReadableCookieStore = {
  getAll(): { name: string; value: string }[];
};

type WritableCookieStore = ReadableCookieStore & {
  set(
    name: string,
    value: string,
    options: CookieOptions,
  ): void;
};

export function readAuthPersistence(
  cookieStore: ReadableCookieStore,
): AuthPersistenceMode {
  const matches = cookieStore
    .getAll()
    .filter(
      ({ name }) =>
        name ===
        AUTH_PERSISTENCE_COOKIE_NAME,
    );

  if (matches.length !== 1) {
    return "session";
  }

  return parseAuthPersistence(
    matches[0].value,
  );
}

export function setAuthPersistence(
  cookieStore: WritableCookieStore,
  mode: AuthPersistenceMode,
) {
  cookieStore.set(
    AUTH_PERSISTENCE_COOKIE_NAME,
    mode,
    authPersistenceCookieOptions(mode),
  );
}

export function clearAuthPersistence(
  cookieStore: WritableCookieStore,
) {
  cookieStore.set(
    AUTH_PERSISTENCE_COOKIE_NAME,
    "",
    authPersistenceDeletionOptions(),
  );
}

export function createServerCookieAdapter(
  cookieStore: WritableCookieStore,
  explicitMode?: AuthPersistenceMode,
): CookieMethodsServer {
  return {
    getAll() {
      return cookieStore.getAll();
    },

    setAll(cookiesToSet) {
      const mode =
        explicitMode ??
        readAuthPersistence(cookieStore);

      const transformed =
        applyAuthCookiePersistence(
          cookiesToSet,
          mode,
        );

      transformed.forEach(
        ({ name, value, options }) => {
          cookieStore.set(
            name,
            value,
            options,
          );
        },
      );
    },
  };
}

function browserCookies() {
  return parseCookieHeader(
    document.cookie,
  );
}

function readBrowserAuthPersistence() {
  return readAuthPersistence({
    getAll: browserCookies,
  });
}

export function createBrowserCookieAdapter(): CookieMethodsBrowser {
  return {
    getAll: browserCookies,

    setAll(cookiesToSet) {
      const transformed =
        applyAuthCookiePersistence(
          cookiesToSet,
          readBrowserAuthPersistence(),
        );

      transformed.forEach(
        ({ name, value, options }) => {
          document.cookie =
            serializeCookieHeader(
              name,
              value,
              options,
            );
        },
      );
    },
  };
}

export function clearBrowserAuthPersistence() {
  document.cookie = serializeCookieHeader(
    AUTH_PERSISTENCE_COOKIE_NAME,
    "",
    authPersistenceDeletionOptions(),
  );
}

export function applyCookieBatch(
  cookiesToSet: SupabaseCookieWrite[],
  mode: AuthPersistenceMode,
) {
  return applyAuthCookiePersistence(
    cookiesToSet,
    mode,
  );
}
