import "server-only";

import {
  createHash,
  createHmac,
} from "node:crypto";

const MAX_IDENTIFIER_INPUT = 4096;

function securitySecret(explicitSecret?: string) {
  const secret =
    explicitSecret ??
    process.env.AUTH_SECURITY_HMAC_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECURITY_HMAC_SECRET must contain at least 32 characters.",
    );
  }

  return secret;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function hmacIdentifier(
  domain: "email" | "ip" | "user-agent" | "context",
  value: string,
  explicitSecret?: string,
) {
  if (value.length > MAX_IDENTIFIER_INPUT) {
    throw new Error("Security identifier input is too long.");
  }

  return createHmac(
    "sha256",
    securitySecret(explicitSecret),
  )
    .update(`${domain}:v1:${value}`, "utf8")
    .digest("hex");
}

export function limiterKeyDigest(
  policy: string,
  identifiers: readonly string[],
) {
  if (
    !/^[a-z_]{3,64}$/.test(policy) ||
    identifiers.length === 0 ||
    identifiers.some(
      (identifier) =>
        !/^[0-9a-f]{64}$/.test(identifier),
    )
  ) {
    throw new Error("Invalid limiter key material.");
  }

  return createHash("sha256")
    .update(
      `rate-limit:v1:${policy}:${identifiers.join(":")}`,
      "utf8",
    )
    .digest("hex");
}
