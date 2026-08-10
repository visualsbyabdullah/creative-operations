import { describe, expect, it } from "vitest";
import { parseBrandMutation } from "@/lib/brands/brand-schemas";

const valid = {
  name: "North Star",
  industry: "Technology",
  accentColor: "#2f80ed",
  description: "A concise description.",
  websiteUrl: "https://example.com",
};

describe("parseBrandMutation", () => {
  it("normalizes a valid create request", () => {
    expect(parseBrandMutation(valid, false)).toMatchObject({
      name: "North Star",
      websiteUrl: "https://example.com",
    });
  });

  it("rejects unknown and unsafe fields", () => {
    expect(parseBrandMutation({ ...valid, workspaceId: crypto.randomUUID() }, false)).toBeNull();
    expect(parseBrandMutation({ ...valid, websiteUrl: "http://example.com" }, false)).toBeNull();
    expect(parseBrandMutation({ ...valid, accentColor: "blue" }, false)).toBeNull();
  });

  it("requires optimistic concurrency for edits", () => {
    expect(parseBrandMutation({ ...valid, status: "active" }, true)).toBeNull();
    expect(parseBrandMutation({
      ...valid,
      brandId: "10000000-0000-4000-8000-000000000001",
      status: "paused",
      expectedUpdatedAt: "2026-07-30T10:00:00.000Z",
    }, true)).not.toBeNull();
  });
});
