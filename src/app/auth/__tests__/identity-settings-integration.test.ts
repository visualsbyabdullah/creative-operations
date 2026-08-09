import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("identity and settings integration", () => {
  it("does not render invitation progress during an ordinary login mount", () => {
    const handler = read("src/components/auth/InvitationFragmentHandler.tsx");
    expect(handler).toContain('>("ordinary")');
    expect(handler.indexOf('setState("checking")')).toBeGreaterThan(handler.indexOf("if (!hash)"));
    expect(handler).toContain('if (!hash) {\n        return;');
  });

  it("classifies auth fragments before invitation UI or invitation processing", () => {
    const handler = read("src/components/auth/InvitationFragmentHandler.tsx");
    expect(handler.indexOf("authFragmentType(hash)")).toBeLessThan(handler.indexOf('setState("checking")'));
    expect(handler).toContain('fragmentType !== "invite" && fragmentType !== "email_change"');
    expect(handler).toContain('"/profile?state=email_changed"');
  });

  it("limits invitation copy to invitation components and clears stale state", () => {
    const handler = read("src/components/auth/InvitationFragmentHandler.tsx");
    const signout = read("src/app/auth/signout/route.ts");
    const actions = read("src/app/auth/actions.ts");
    expect(handler).toContain("Accepting your invitation");
    expect(signout).toContain("invitationCookieDeletionOptions");
    expect(actions).toContain("invitationCookieDeletionOptions");
  });

  it("keeps employee route guards authoritative", () => {
    expect(read("src/app/employees/page.tsx")).toContain("requireManagementProfile");
    expect(read("src/app/brands/page.tsx")).toContain("requireManagementProfile");
    expect(read("src/app/planner/page.tsx")).toContain("requireManagementProfile");
  });

  it("filters the directory and invite UI to creative employees", () => {
    const service = read("src/lib/employees/employee-service.ts");
    const component = read("src/components/management/ManagementEmployees.tsx");
    expect(service).toContain('["graphic_designer", "video_editor"]');
    expect(component).not.toContain('{ label: "Manager"');
    expect(component).not.toContain('{ label: "HR"');
  });

  it("uses one real settings implementation", () => {
    const settings = read("src/app/settings/page.tsx");
    const profile = read("src/app/profile/page.tsx");
    expect(settings).toContain('redirect("/profile")');
    expect(profile).toContain("EmployeeProfileSettings");
    expect(profile).not.toContain("ManagementProfileSettings");
  });

  it("requires provider success for email and password success", () => {
    const service = read("src/lib/profiles/profile-service.ts");
    const component = read("src/components/profile/EmployeeProfileSettings.tsx");
    expect(service).toContain("client.auth.updateUser({ email })");
    expect(service).toContain("client.auth.signInWithPassword");
    expect(service).toContain("client.auth.updateUser({ password: newPassword })");
    expect(component).toContain("if (result.ok)");
    expect(component).not.toContain('setSaveMessage(\n      "Password successfully updated."');
  });
});
