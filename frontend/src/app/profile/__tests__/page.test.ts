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
vi.mock("@backend/modules/profiles/profile-service", () => ({ getSelfProfileResult }));
vi.mock("@backend/modules/auth/requireAppProfile", () => ({
  requireAppProfile,
  isManagementRole: () => false,
}));
vi.mock("@backend/modules/storage/storage-service", () => ({
  signAvatarPath: vi.fn().mockResolvedValue(null),
}));
vi.mock("@frontend/components/management/ManagementProfileSettings", () => ({
  default: () => null,
}));
vi.mock("@frontend/components/profile/EmployeeProfileSettings", () => ({
  default: () => null,
}));

import ProfilePage from "@frontend/app/profile/page";
import { DEFAULT_PREFERENCES } from "@shared/contracts/profile-types";

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
