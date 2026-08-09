import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirect,
  getSelfProfileResult,
  requireAppProfile,
} = vi.hoisted(() => ({
  redirect: vi.fn(),
  getSelfProfileResult: vi.fn(),
  requireAppProfile: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/profiles/profile-service", () => ({ getSelfProfileResult }));
vi.mock("@/lib/auth/requireAppProfile", () => ({
  requireAppProfile,
  isManagementRole: () => false,
}));
vi.mock("@/lib/storage/storage-service", () => ({
  signAvatarPath: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/components/management/ManagementProfileSettings", () => ({
  default: () => null,
}));
vi.mock("@/components/profile/EmployeeProfileSettings", () => ({
  default: () => null,
}));

import ProfilePage from "@/app/profile/page";
import { DEFAULT_PREFERENCES } from "@/lib/profiles/profile-types";

describe("ProfilePage", () => {
  beforeEach(() => {
    redirect.mockReset();
    requireAppProfile.mockResolvedValue({
      id: "profile-id",
      role: "graphic_designer",
    });
  });

  it("renders an authenticated valid employee without redirecting to login", async () => {
    getSelfProfileResult.mockResolvedValue({
      status: "ok",
      profile: {
        id: "profile-id",
        email: "designer@example.test",
        fullName: "Designer",
        role: "graphic_designer",
        department: "graphic_design",
        jobTitle: null,
        phone: null,
        timezone: "UTC",
        avatarUrl: null,
        avatarPath: null,
        isActive: true,
        managerId: null,
        updatedAt: "2026-08-09T00:00:00.000Z",
        preferences: DEFAULT_PREFERENCES,
      },
    });

    await expect(ProfilePage()).resolves.toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});
