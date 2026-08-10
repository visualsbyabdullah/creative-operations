import "server-only";

import { isIP } from "node:net";
import { randomUUID } from "node:crypto";

import { hmacIdentifier } from "@/lib/security/identifiers";

export type AuthSecuritySource =
  | "login_action"
  | "forgot_password_action"
  | "recovery_callback"
  | "reset_password_action"
  | "logout_action"
  | "signout_route";

type RuntimeIndicators = {
  NODE_ENV?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
};

export type RequestSecurityContext = {
  requestId: string;
  ipIdentifier: string;
  userAgentIdentifier: string;
  source: AuthSecuritySource;
};

function verifiedVercelProduction(
  runtime: RuntimeIndicators,
) {
  return (
    runtime.NODE_ENV === "production" &&
    runtime.VERCEL === "1" &&
    runtime.VERCEL_ENV === "production"
  );
}

function singleHeaderIp(value: string | null) {
  if (
    !value ||
    value.includes(",") ||
    value.length > 64
  ) {
    return null;
  }

  const candidate = value.trim();
  const version = isIP(candidate);

  if (version === 4) {
    return candidate;
  }

  if (version === 6) {
    try {
      return new URL(
        `http://[${candidate}]`,
      ).hostname.slice(1, -1);
    } catch {
      return null;
    }
  }

  return null;
}

export function extractTrustedClientIp(
  headers: Pick<Headers, "get">,
  runtime: RuntimeIndicators = process.env,
) {
  if (!verifiedVercelProduction(runtime)) {
    return "non-vercel";
  }

  for (const name of [
    "x-vercel-forwarded-for",
    "x-forwarded-for",
    "x-real-ip",
  ]) {
    const address = singleHeaderIp(headers.get(name));

    if (address) {
      return address;
    }
  }

  return "unknown";
}

export function createRequestSecurityContext(
  headers: Pick<Headers, "get">,
  source: AuthSecuritySource,
  options?: {
    runtime?: RuntimeIndicators;
    secret?: string;
    requestId?: string;
  },
): RequestSecurityContext {
  const ip = extractTrustedClientIp(
    headers,
    options?.runtime,
  );
  const userAgent = (
    headers.get("user-agent") ?? "unknown"
  )
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 512);

  return {
    requestId: options?.requestId ?? randomUUID(),
    ipIdentifier: hmacIdentifier(
      "ip",
      ip,
      options?.secret,
    ),
    userAgentIdentifier: hmacIdentifier(
      "user-agent",
      userAgent || "unknown",
      options?.secret,
    ),
    source,
  };
}
