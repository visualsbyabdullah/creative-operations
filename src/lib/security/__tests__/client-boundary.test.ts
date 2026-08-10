import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";

const sourceRoot = join(process.cwd(), "src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(?:ts|tsx|js|jsx)$/.test(name)
        ? [path]
        : [];
  });
}

describe("administrative client boundary", () => {
  it("keeps administrative variables out of client modules", () => {
    const violations = sourceFiles(sourceRoot)
      .filter((path) =>
        readFileSync(path, "utf8").includes(
          '"use client"',
        ),
      )
      .filter((path) =>
        /SUPABASE_(?:SECRET|SERVICE_ROLE)_KEY/.test(
          readFileSync(path, "utf8"),
        ),
      );

    expect(violations).toEqual([]);
  });

  it("isolates the client and disables all session behavior", () => {
    const adminSource = readFileSync(
      join(
        sourceRoot,
        "lib",
        "supabase",
        "admin.ts",
      ),
      "utf8",
    );

    expect(adminSource).toContain(
      'import "server-only"',
    );
    expect(adminSource).toContain(
      "persistSession: false",
    );
    expect(adminSource).toContain(
      "autoRefreshToken: false",
    );
    expect(adminSource).toContain(
      "detectSessionInUrl: false",
    );
    expect(adminSource).not.toContain(
      "next/headers",
    );
    expect(adminSource).not.toContain("cookies(");
  });

  it("keeps administrative modules out of invitation Client Components", () => {
    const invitationComponents = [
      join(
        sourceRoot,
        "components",
        "auth",
        "InvitationFragmentHandler.tsx",
      ),
      join(
        sourceRoot,
        "components",
        "auth",
        "SetInvitationPasswordForm.tsx",
      ),
    ];

    for (const path of invitationComponents) {
      const source = readFileSync(path, "utf8");
      expect(source).not.toContain(
        "@/lib/supabase/admin",
      );
      expect(source).not.toMatch(
        /SUPABASE_(?:SECRET|SERVICE_ROLE)_KEY/,
      );
    }
  });
});
