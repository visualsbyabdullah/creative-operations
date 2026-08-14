import { sanitizeAuditMetadata } from "@backend/security/audit-metadata";
import {
  describe,
  expect,
  it,
} from "vitest";

describe("authentication audit metadata", () => {
  it("accepts only event-specific safe fields", () => {
    expect(
      sanitizeAuditMetadata("rate_limit_exceeded", {
        limiter_policy: "login_targeted",
        retry_after_seconds: 30,
      }),
    ).toEqual({
      limiter_policy: "login_targeted",
      retry_after_seconds: 30,
    });
  });

  it.each([
    "password",
    "confirmation",
    "access_token",
    "refresh_token",
    "recovery_code",
    "cookie",
    "email",
    "ip",
    "provider_error",
    "request_body",
  ])("rejects forbidden field %s", (field) => {
    expect(() =>
      sanitizeAuditMetadata("login_failed", {
        [field]: "secret-value",
      }),
    ).toThrow("Forbidden audit metadata key.");
  });

  it("rejects unknown, nested, and arbitrary values", () => {
    expect(() =>
      sanitizeAuditMetadata("login_failed", {
        reason_code: { nested: true },
      }),
    ).toThrow();
    expect(() =>
      sanitizeAuditMetadata("login_failed", {
        reason_code: "raw provider message",
      }),
    ).toThrow();
  });
});
