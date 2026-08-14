import "server-only";

import { createClient } from "@supabase/supabase-js";

export type SecurityRpcName =
  | "consume_auth_rate_limit"
  | "reset_auth_rate_limit"
  | "append_auth_audit_event";

type RpcResult<T> =
  | { ok: true; data: T }
  | { ok: false };

function getAdministrativeKey() {
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new Error(
      "A server-only Supabase administrative key is required.",
    );
  }

  return key;
}

export async function invokeSecurityRpc<T>(
  name: SecurityRpcName,
  parameters: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!url) {
    return { ok: false };
  }

  try {
    const client = createClient(
      url,
      getAdministrativeKey(),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
    const { data, error } = await client.rpc(
      name,
      parameters,
    );

    if (error) {
      return { ok: false };
    }

    return { ok: true, data: data as T };
  } catch {
    return { ok: false };
  }
}
