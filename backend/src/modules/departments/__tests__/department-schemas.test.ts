import { describe, expect, it } from "vitest";

import {
  departmentKeyFromName,
  parseDepartmentMutation,
} from "@backend/modules/departments/department-schemas";

describe("department key generation", () => {
  it("slugs a display name into a lowercase key", () => {
    expect(departmentKeyFromName("Graphic Design")).toBe("graphic_design");
    expect(departmentKeyFromName("  Video Editing  ")).toBe("video_editing");
    expect(departmentKeyFromName("Social & Marketing")).toBe("social_marketing");
  });

  it("prefixes numeric-leading names so the key stays valid", () => {
    expect(departmentKeyFromName("123 Department")).toBe("d_123_department");
  });

  it("rejects names that cannot form a key", () => {
    expect(departmentKeyFromName("!!!")).toBeNull();
  });
});

describe("department mutation schema", () => {
  it("accepts a valid create payload", () => {
    expect(parseDepartmentMutation({
      name: " Content Studio ",
      description: "Video and motion work.",
      accentColor: "#7c3aed",
    }, false)).toMatchObject({
      name: "Content Studio",
      description: "Video and motion work.",
      accentColor: "#7c3aed",
    });
  });

  it("rejects unknown fields and empty names", () => {
    expect(parseDepartmentMutation({
      name: "Content Studio",
      description: null,
      accentColor: null,
      workspaceId: "attacker",
    }, false)).toBeNull();
    expect(parseDepartmentMutation({
      name: "   ",
      description: null,
      accentColor: null,
    }, false)).toBeNull();
  });

  it("normalizes empty description and colour to null", () => {
    expect(parseDepartmentMutation({
      name: "Content Studio",
      description: "",
      accentColor: "",
    }, false)).toMatchObject({
      name: "Content Studio",
      description: null,
      accentColor: null,
    });
  });

  it("rejects malformed colours and oversized fields", () => {
    expect(parseDepartmentMutation({
      name: "Content Studio",
      description: null,
      accentColor: "blue",
    }, false)).toBeNull();
    expect(parseDepartmentMutation({
      name: "Content Studio",
      description: "x".repeat(4001),
      accentColor: null,
    }, false)).toBeNull();
  });

  it("requires id and expectedUpdatedAt when editing", () => {
    const uuid = "00000000-0000-4000-8000-000000000001";
    expect(parseDepartmentMutation({
      departmentId: uuid,
      name: "Content Studio",
      description: null,
      accentColor: null,
      expectedUpdatedAt: "2026-08-14T10:00:00.000Z",
    }, true)).not.toBeNull();
    expect(parseDepartmentMutation({
      name: "Content Studio",
      description: null,
      accentColor: null,
      expectedUpdatedAt: "2026-08-14T10:00:00.000Z",
    }, true)).toBeNull();
    expect(parseDepartmentMutation({
      departmentId: uuid,
      name: "Content Studio",
      description: null,
      accentColor: null,
      expectedUpdatedAt: "not-a-date",
    }, true)).toBeNull();
  });
});
