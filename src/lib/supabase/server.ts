import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { AuthPersistenceMode } from "@/lib/auth/persistence";
import {
  clearAuthPersistence,
  createServerCookieAdapter,
  setAuthPersistence,
} from "@/lib/supabase/cookie-adapters";

export async function createClient(
  explicitMode?: AuthPersistenceMode,
) {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are missing.",
    );
  }

  if (explicitMode) {
    setAuthPersistence(
      cookieStore,
      explicitMode,
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: createServerCookieAdapter(
        {
          getAll: () =>
            cookieStore.getAll(),
          set: (name, value, options) => {
            try {
              cookieStore.set(
                name,
                value,
                options,
              );
            } catch {
              /*
               * Server Components cannot always
               * modify cookies directly.
               */
            }
          },
        },
        explicitMode,
      ),
    },
  );
}

export async function clearAuthPersistenceCookie() {
  const cookieStore = await cookies();

  clearAuthPersistence(cookieStore);
}
