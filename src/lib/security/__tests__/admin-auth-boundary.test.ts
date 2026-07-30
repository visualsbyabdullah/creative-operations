import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin Auth boundary", () => {
  it("is server-only and not imported by client components or repositories", () => {
    const root = process.cwd();
    const adminAuth = readFileSync(join(root, "src/lib/supabase/admin-auth.ts"), "utf8");
    expect(adminAuth).toContain('import "server-only"');
    expect(adminAuth).toContain("getTrustedAppOrigin");
    expect(adminAuth).not.toContain("NEXT_PUBLIC_SITE_URL");

    const clientFiles = [
      "src/components/management/ManagementEmployees.tsx",
      "src/components/profile/EmployeeProfileSettings.tsx",
      "src/context/EmployeeContext.tsx",
      "src/lib/employees/employee-repository.ts",
    ];
    for (const file of clientFiles) {
      expect(readFileSync(join(root, file), "utf8")).not.toContain("admin-auth");
    }
  });
});
