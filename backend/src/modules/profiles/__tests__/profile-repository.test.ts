import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@backend/supabase/server", () => ({ createClient }));

import { readSelfProfileResult } from "@backend/modules/profiles/profile-repository";

function query(result: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
}

describe("readSelfProfile", () => {
  beforeEach(() => createClient.mockReset());

  it("keeps a valid profile when optional preferences are missing", async () => {
    const profile = { id: "profile-id", full_name: "Designer" };
    createClient.mockResolvedValue({
      from: vi.fn((table: string) =>
        table === "profiles"
          ? query({ data: profile, error: null })
          : query({ data: null, error: null }),
      ),
    });

    await expect(readSelfProfileResult("profile-id")).resolves.toEqual({
      status: "ok",
      profile,
      preferences: null,
    });
  });

  it("does not report a preferences failure as a missing profile", async () => {
    createClient.mockResolvedValue({
      from: vi.fn((table: string) =>
        table === "profiles"
          ? query({ data: { id: "profile-id" }, error: null })
          : query({ data: null, error: { code: "42501" } }),
      ),
    });

    await expect(readSelfProfileResult("profile-id")).resolves.toEqual({
      status: "error",
      source: "preferences",
      code: "42501",
    });
  });
});
