import {
  createRequestSecurityContext,
  extractTrustedClientIp,
} from "@backend/security/request-context";
import {
  describe,
  expect,
  it,
} from "vitest";

const vercelProduction = {
  NODE_ENV: "production",
  VERCEL: "1",
  VERCEL_ENV: "production",
};
const secret = "s".repeat(32);

function requestHeaders(
  entries: Record<string, string>,
) {
  return new Headers(entries);
}

describe("trusted request security context", () => {
  it("prefers the Vercel forwarded address", () => {
    const headers = requestHeaders({
      "x-vercel-forwarded-for": "203.0.113.8",
      "x-forwarded-for": "198.51.100.2",
      "x-real-ip": "192.0.2.1",
    });

    expect(
      extractTrustedClientIp(
        headers,
        vercelProduction,
      ),
    ).toBe("203.0.113.8");
  });

  it("uses only a validated fallback address", () => {
    expect(
      extractTrustedClientIp(
        requestHeaders({
          "x-vercel-forwarded-for": "invalid",
          "x-forwarded-for": "2001:db8::1",
        }),
        vercelProduction,
      ),
    ).toBe("2001:db8::1");
  });

  it("rejects comma lists and spoofed non-Vercel headers", () => {
    expect(
      extractTrustedClientIp(
        requestHeaders({
          "x-vercel-forwarded-for":
            "203.0.113.8, 198.51.100.2",
        }),
        vercelProduction,
      ),
    ).toBe("unknown");
    expect(
      extractTrustedClientIp(
        requestHeaders({
          "x-forwarded-for": "203.0.113.8",
        }),
        {
          NODE_ENV: "development",
          VERCEL: "1",
          VERCEL_ENV: "preview",
        },
      ),
    ).toBe("non-vercel");
  });

  it("persists only hashed IP and user-agent identifiers", () => {
    const context = createRequestSecurityContext(
      requestHeaders({
        "x-vercel-forwarded-for": "203.0.113.8",
        "user-agent": "Raw Browser 1.0",
      }),
      "login_action",
      {
        runtime: vercelProduction,
        secret,
        requestId:
          "00000000-0000-4000-8000-000000000001",
      },
    );
    const serialized = JSON.stringify(context);

    expect(context.ipIdentifier).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(serialized).not.toContain("203.0.113.8");
    expect(serialized).not.toContain("Raw Browser");
  });
});
