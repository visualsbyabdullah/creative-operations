import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const AUTH_INVITATION_COOKIE_NAME =
  "creative_ops_auth_invitation";
export const AUTH_INVITATION_MAX_AGE_SECONDS = 600;

type InvitationState = {
  v: 1;
  uid: string;
  iat: number;
  exp: number;
  nonce: string;
};

function getInvitationSecret() {
  const secret =
    process.env.AUTH_SECURITY_HMAC_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECURITY_HMAC_SECRET must contain at least 32 characters.",
    );
  }

  return secret;
}

export function assertInvitationConfiguration() {
  getInvitationSecret();
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function sign(payload: string) {
  return createHmac("sha256", getInvitationSecret())
    .update(payload)
    .digest("base64url");
}

export function createInvitationState(
  userId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!isUuid(userId)) {
    throw new Error("Invalid invitation user.");
  }

  const state: InvitationState = {
    v: 1,
    uid: userId,
    iat: nowSeconds,
    exp: nowSeconds + AUTH_INVITATION_MAX_AGE_SECONDS,
    nonce: randomBytes(24).toString("base64url"),
  };
  const payload = Buffer.from(
    JSON.stringify(state),
    "utf8",
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyInvitationState(
  value: string | undefined,
  expectedUserId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!value || !isUuid(expectedUserId)) return false;

  const separator = value.indexOf(".");
  if (
    separator <= 0 ||
    separator !== value.lastIndexOf(".")
  ) {
    return false;
  }

  const payload = value.slice(0, separator);
  const supplied = Buffer.from(
    value.slice(separator + 1),
    "utf8",
  );
  let expected: Buffer;

  try {
    expected = Buffer.from(sign(payload), "utf8");
  } catch {
    return false;
  }

  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return false;
  }

  try {
    const state = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<InvitationState>;

    return Boolean(
      state.v === 1 &&
        state.uid === expectedUserId &&
        Number.isInteger(state.iat) &&
        Number.isInteger(state.exp) &&
        typeof state.iat === "number" &&
        typeof state.exp === "number" &&
        state.iat <= nowSeconds &&
        state.exp > nowSeconds &&
        state.exp - state.iat ===
          AUTH_INVITATION_MAX_AGE_SECONDS &&
        typeof state.nonce === "string" &&
        /^[A-Za-z0-9_-]{32}$/.test(state.nonce),
    );
  } catch {
    return false;
  }
}

export function invitationCookieOptions() {
  return {
    name: AUTH_INVITATION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_INVITATION_MAX_AGE_SECONDS,
  };
}

export function invitationCookieDeletionOptions() {
  return {
    ...invitationCookieOptions(),
    maxAge: 0,
  };
}
