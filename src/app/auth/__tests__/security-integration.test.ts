import {
  readFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  applyAuthCookiePersistence,
} from "@/lib/auth/persistence";
import {
  describe,
  expect,
  it,
} from "vitest";

const authRoot = join(
  process.cwd(),
  "src",
  "app",
  "auth",
);

describe("authentication security integration", () => {
  it("keeps recovery limiter calls before provider operations", () => {
    const actions = readFileSync(
      join(authRoot, "actions.ts"),
      "utf8",
    );
    const callback = readFileSync(
      join(authRoot, "callback", "route.ts"),
      "utf8",
    );

    expect(
      actions.indexOf(
        'checkRecoveryRateLimit(\n      "request"',
      ),
    ).toBeLessThan(
      actions.indexOf(
        "supabase.auth.resetPasswordForEmail",
      ),
    );
    expect(
      callback.indexOf("checkRecoveryRateLimit"),
    ).toBeLessThan(
      callback.indexOf(
        "exchangeCodeForSession",
      ),
    );
    expect(actions).toContain(
      '"password_recovery_rejected"',
    );
    expect(callback).toContain(
      '"password_recovery_verified"',
    );
  });

  it("preserves Remember Me cookie behavior and deletion writes", () => {
    const source = [
      {
        name: "sb-auth",
        value: "value",
        options: { path: "/" },
      },
      {
        name: "sb-old",
        value: "",
        options: { path: "/", maxAge: 0 },
      },
    ];
    const persistent = applyAuthCookiePersistence(
      source,
      "persistent",
    );
    const session = applyAuthCookiePersistence(
      source,
      "session",
    );

    expect(persistent[0].options.maxAge).toBe(
      2_592_000,
    );
    expect(session[0].options.maxAge).toBeUndefined();
    expect(persistent[1]).toEqual(source[1]);
    expect(session[1]).toEqual(source[1]);
  });
});
