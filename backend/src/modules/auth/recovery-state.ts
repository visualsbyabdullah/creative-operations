import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const AUTH_RECOVERY_COOKIE_NAME =
  "creative_ops_auth_recovery";
export const AUTH_RECOVERY_MAX_AGE_SECONDS = 600;

type RecoveryState = {
  v: 1;
  uid: string;
  iat: number;
  exp: number;
  nonce: string;
};

function getRecoverySecret() {
  const secret =
    process.env.AUTH_RECOVERY_STATE_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_RECOVERY_STATE_SECRET must contain at least 32 characters.",
    );
  }

  return secret;
}

function sign(payload: string) {
  return createHmac(
    "sha256",
    getRecoverySecret(),
  )
    .update(payload)
    .digest("base64url");
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function parseState(
  value: string,
): RecoveryState | null {
  const separator = value.indexOf(".");

  if (
    separator <= 0 ||
    separator !== value.lastIndexOf(".")
  ) {
    return null;
  }

  const payload = value.slice(0, separator);
  const suppliedSignature =
    value.slice(separator + 1);
  let expectedSignature: string;

  try {
    expectedSignature = sign(payload);
  } catch {
    return null;
  }
  const suppliedBuffer = Buffer.from(
    suppliedSignature,
    "utf8",
  );
  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8",
  );

  if (
    suppliedBuffer.length !==
      expectedBuffer.length ||
    !timingSafeEqual(
      suppliedBuffer,
      expectedBuffer,
    )
  ) {
    return null;
  }

  try {
    const state = JSON.parse(
      Buffer.from(payload, "base64url").toString(
        "utf8",
      ),
    ) as Partial<RecoveryState>;

    if (
      state.v !== 1 ||
      !isUuid(state.uid) ||
      !Number.isInteger(state.iat) ||
      !Number.isInteger(state.exp) ||
      typeof state.nonce !== "string" ||
      !/^[A-Za-z0-9_-]{32}$/.test(state.nonce)
    ) {
      return null;
    }

    return state as RecoveryState;
  } catch {
    return null;
  }
}

export function createRecoveryState(
  userId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!isUuid(userId)) {
    throw new Error(
      "Cannot create recovery state for an invalid user.",
    );
  }

  const state: RecoveryState = {
    v: 1,
    uid: userId,
    iat: nowSeconds,
    exp:
      nowSeconds +
      AUTH_RECOVERY_MAX_AGE_SECONDS,
    nonce: randomBytes(24).toString("base64url"),
  };
  const payload = Buffer.from(
    JSON.stringify(state),
    "utf8",
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyRecoveryState(
  value: string | undefined,
  expectedUserId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!value || !isUuid(expectedUserId)) {
    return false;
  }

  const state = parseState(value);

  return Boolean(
    state &&
      state.uid === expectedUserId &&
      state.iat <= nowSeconds &&
      state.exp > nowSeconds &&
      state.exp - state.iat ===
        AUTH_RECOVERY_MAX_AGE_SECONDS,
  );
}

export function recoveryCookieOptions() {
  return {
    name: AUTH_RECOVERY_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure:
      process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_RECOVERY_MAX_AGE_SECONDS,
  };
}

export function recoveryCookieDeletionOptions() {
  return {
    ...recoveryCookieOptions(),
    maxAge: 0,
  };
}

export function getTrustedAppOrigin() {
  const configured =
    process.env.APP_URL?.trim() ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:3000");

  let url: URL;

  try {
    url = new URL(configured);
  } catch {
    throw new Error(
      "APP_URL must be a valid application origin.",
    );
  }

  const isLoopback =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" &&
      url.pathname !== "") ||
    (url.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        url.protocol === "http:" &&
        isLoopback
      ))
  ) {
    throw new Error(
      "APP_URL must be a bare trusted HTTPS origin.",
    );
  }

  return url.origin;
}

export function assertRecoveryConfiguration() {
  getRecoverySecret();
  getTrustedAppOrigin();
}
