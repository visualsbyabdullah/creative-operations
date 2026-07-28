import {
  hmacIdentifier,
  limiterKeyDigest,
  normalizeEmail,
} from "@/lib/security/identifiers";
import {
  describe,
  expect,
  it,
} from "vitest";

const secret = "h".repeat(32);

describe("privacy identifiers", () => {
  it("normalizes email without provider-specific rewriting", () => {
    expect(
      normalizeEmail("  Person.Name+tag@Example.COM "),
    ).toBe("person.name+tag@example.com");
  });

  it("is stable and domain separated", () => {
    const email = hmacIdentifier(
      "email",
      "person@example.com",
      secret,
    );
    const ip = hmacIdentifier(
      "ip",
      "person@example.com",
      secret,
    );

    expect(email).toHaveLength(64);
    expect(email).not.toBe(ip);
    expect(email).toBe(
      hmacIdentifier(
        "email",
        "person@example.com",
        secret,
      ),
    );
  });

  it("creates fixed limiter digests with no raw identifier", () => {
    const email = hmacIdentifier(
      "email",
      "person@example.com",
      secret,
    );
    const ip = hmacIdentifier(
      "ip",
      "203.0.113.8",
      secret,
    );
    const key = limiterKeyDigest(
      "login_targeted",
      [email, ip],
    );

    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("person@example.com");
    expect(key).not.toContain("203.0.113.8");
  });
});
