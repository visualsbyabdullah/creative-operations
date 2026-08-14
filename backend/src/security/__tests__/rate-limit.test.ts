import {
  AUTH_LIMITER_FAILURE_POLICY,
  AUTH_RATE_LIMIT_POLICIES,
  clampRetryAfter,
} from "@backend/security/rate-limit-policies";
import {
  describe,
  expect,
  it,
} from "vitest";

describe("approved authentication rate-limit policies", () => {
  it("contains the exact approved thresholds", () => {
    expect(AUTH_RATE_LIMIT_POLICIES).toEqual({
      login_targeted: {
        limit: 5,
        windowSeconds: 900,
      },
      login_ip: {
        limit: 30,
        windowSeconds: 900,
      },
      forgot_password_targeted: {
        limit: 3,
        windowSeconds: 3600,
      },
      forgot_password_ip: {
        limit: 10,
        windowSeconds: 3600,
      },
      recovery_callback_ip: {
        limit: 10,
        windowSeconds: 900,
      },
      reset_password_targeted: {
        limit: 5,
        windowSeconds: 1800,
      },
      reset_password_ip: {
        limit: 15,
        windowSeconds: 1800,
      },
    });
  });

  it("clamps retry-after to one through the policy window", () => {
    expect(
      clampRetryAfter("login_targeted", 0),
    ).toBe(1);
    expect(
      clampRetryAfter("login_targeted", 12.1),
    ).toBe(13);
    expect(
      clampRetryAfter("login_targeted", 9999),
    ).toBe(900);
  });

  it("fails closed for sensitive auth and open for cleanup", () => {
    expect(AUTH_LIMITER_FAILURE_POLICY).toEqual({
      login: "closed",
      forgot_password: "closed",
      recovery_callback: "closed",
      reset_password: "closed",
      logout: "open",
      session_cleanup: "open",
    });
  });
});
