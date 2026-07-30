import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getTrustedAppOrigin } from "@/lib/auth/recovery-state";
import {
  EMPLOYEE_INVITATION_REDIRECT_PATH,
  getEmployeeInvitationRedirectUrl,
} from "@/lib/supabase/admin-auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

function configure(appUrl: string, nodeEnv = "production") {
  vi.stubEnv("APP_URL", appUrl);
  vi.stubEnv("NODE_ENV", nodeEnv);
}

describe("trusted application origin", () => {
  it("accepts localhost HTTP only outside production", () => {
    configure("http://localhost:3000", "development");

    expect(getTrustedAppOrigin()).toBe("http://localhost:3000");

    configure("http://localhost:3000", "production");
    expect(() => getTrustedAppOrigin()).toThrow();
  });

  it("accepts an HTTPS staging origin and normalizes a trailing slash", () => {
    configure("https://staging.example.test/");

    expect(getTrustedAppOrigin()).toBe("https://staging.example.test");
  });

  it.each([
    "not a url",
    "https://user:password@staging.example.test",
    "https://staging.example.test/path",
    "https://staging.example.test?source=browser",
    "https://staging.example.test#fragment",
    "http://staging.example.test",
  ])("rejects an unsafe APP_URL value: %s", (value) => {
    configure(value);

    expect(() => getTrustedAppOrigin()).toThrow();
  });

  it("uses APP_URL instead of browser or proxy-supplied origins", () => {
    configure("https://staging.example.test");
    vi.stubEnv("HTTP_ORIGIN", "https://attacker.example");
    vi.stubEnv("HOST", "attacker.example");
    vi.stubEnv("HTTP_REFERER", "https://attacker.example/injected");

    expect(getEmployeeInvitationRedirectUrl()).toBe(
      "https://staging.example.test/auth/callback",
    );
  });

  it("uses the fixed invitation callback path", () => {
    configure("https://staging.example.test");

    expect(EMPLOYEE_INVITATION_REDIRECT_PATH).toBe("/auth/callback");
    expect(new URL(getEmployeeInvitationRedirectUrl()).pathname).toBe(
      "/auth/callback",
    );
  });

  it("does not let NEXT_PUBLIC_SITE_URL control invitation redirects", () => {
    configure("https://staging.example.test");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://attacker.example");

    expect(getEmployeeInvitationRedirectUrl()).toBe(
      "https://staging.example.test/auth/callback",
    );
  });
});
