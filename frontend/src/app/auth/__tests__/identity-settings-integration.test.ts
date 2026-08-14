import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("identity and settings integration", () => {
  it("does not render invitation progress during an ordinary login mount", () => {
    const handler = read("frontend/src/components/auth/InvitationFragmentHandler.tsx");
    expect(handler).toContain('>("ordinary")');
    expect(handler.indexOf('setState("checking")')).toBeGreaterThan(handler.indexOf("if (!hash)"));
    expect(handler).toContain('if (!hash) {\n        return;');
  });

  it("classifies auth fragments before invitation UI or invitation processing", () => {
    const handler = read("frontend/src/components/auth/InvitationFragmentHandler.tsx");
    expect(handler.indexOf("authFragmentType(hash)")).toBeLessThan(handler.indexOf('setState("checking")'));
    expect(handler).toContain('fragmentType !== "invite" && fragmentType !== "email_change"');
    expect(handler).toContain('"/profile?state=email_changed"');
  });

  it("limits invitation copy to invitation components and clears stale state", () => {
    const handler = read("frontend/src/components/auth/InvitationFragmentHandler.tsx");
    const signout = read("frontend/src/app/auth/signout/route.ts");
    const actions = read("frontend/src/app/auth/actions.ts");
    expect(handler).toContain("Accepting your invitation");
    expect(signout).toContain("invitationCookieDeletionOptions");
    expect(actions).toContain("invitationCookieDeletionOptions");
  });

  it("keeps employee route guards authoritative", () => {
    expect(read("frontend/src/app/employees/page.tsx")).toContain("requireManagementProfile");
    expect(read("frontend/src/app/brands/page.tsx")).toContain("requireManagementProfile");
    expect(read("frontend/src/app/planner/page.tsx")).toContain("requireManagementProfile");
  });

  it("filters the directory and invite UI to creative employees", () => {
    const service = read("backend/src/modules/employees/employee-service.ts");
    const component = read("frontend/src/components/management/ManagementEmployees.tsx");
    expect(service).toContain('["graphic_designer", "video_editor"]');
    expect(component).not.toContain('{ label: "Manager"');
    expect(component).not.toContain('{ label: "HR"');
  });

  it("uses one real settings implementation", () => {
    const settings = read("frontend/src/app/settings/page.tsx");
    const profile = read("frontend/src/app/profile/page.tsx");
    expect(settings).toContain('redirect("/profile")');
    expect(profile).toContain("EmployeeProfileSettings");
    expect(profile).not.toContain("ManagementProfileSettings");
  });

  it("requires provider success for email and password success", () => {
    const service = read("backend/src/modules/profiles/profile-service.ts");
    const component = read("frontend/src/components/profile/EmployeeProfileSettings.tsx");
    expect(service).toContain("client.auth.updateUser({ email })");
    expect(service).toContain("client.auth.signInWithPassword");
    expect(service).toContain("client.auth.updateUser({ password: newPassword })");
    expect(component).toContain("if (result.ok)");
    expect(component).not.toContain('setSaveMessage(\n      "Password successfully updated."');
  });

  it("deduplicates verified profile reads and avoids unused management task data", () => {
    const authorization = read("backend/src/modules/auth/authorization.ts");
    const storage = read("backend/src/modules/storage/storage-service.ts");
    const loginActions = read("frontend/src/app/auth/actions.ts");
    const dashboard = read("frontend/src/app/dashboard/page.tsx");
    expect(authorization).toContain("export const getActiveProfile = cache(lookupActiveProfile)");
    expect(storage).toContain("export const signAvatarPath = cache(signAvatarPathUncached)");
    expect(loginActions).toContain("getActiveProfileForUser(supabase, signInData.user)");
    expect(dashboard.indexOf("const tasks = await listTasks()"))
      .toBeGreaterThan(dashboard.indexOf('profile.role === "graphic_designer"'));
  });

  it("keeps the login form free of the WebGL background", () => {
    const login = read("frontend/src/components/auth/LoginForm.tsx");
    expect(login).not.toContain("PixelBlast");
    expect(login).toContain("radial-gradient");
  });

  it("runs authenticated server rendering near the staging database", () => {
    expect(read("frontend/src/app/layout.tsx")).toContain('preferredRegion = "hnd1"');
  });
});
