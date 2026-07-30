import { describe, expect, it } from "vitest";

import {
  parseEmployeeList,
  parseInviteEmployee,
} from "@/lib/employees/employee-schemas";
import { digestInvitationEmail } from "@/lib/employees/invitation-service";

describe("employee schemas", () => {
  it("accepts a bounded directory query", () => {
    expect(parseEmployeeList({
      search: "",
      roles: ["manager", "graphic_designer"],
      departments: null,
      isActive: true,
      sort: "full_name",
      direction: "asc",
      limit: 25,
      cursor: null,
    })).not.toBeNull();
  });

  it("rejects unknown directory fields and unbounded limits", () => {
    expect(parseEmployeeList({
      search: "",
      roles: null,
      departments: null,
      isActive: null,
      sort: "full_name",
      direction: "asc",
      limit: 101,
      cursor: null,
      workspaceId: "attacker",
    })).toBeNull();
  });

  it("normalizes an approved invitation", () => {
    expect(parseInviteEmployee({
      email: " Person@Example.com ",
      fullName: " Person ",
      role: "graphic_designer",
      department: "graphic_design",
      managerId: null,
    })).toMatchObject({
      email: "person@example.com",
      fullName: "Person",
    });
  });

  it("rejects incompatible role and department", () => {
    expect(parseInviteEmployee({
      email: "person@example.com",
      fullName: "Person",
      role: "video_editor",
      department: "graphic_design",
      managerId: null,
    })).toBeNull();
  });
});

describe("invitation digest", () => {
  it("is stable, normalized, and one-way", () => {
    process.env.AUTH_SECURITY_HMAC_SECRET = "a-secure-test-secret-that-is-at-least-32-characters";
    const first = digestInvitationEmail("Person@Example.com");
    const second = digestInvitationEmail(" person@example.com ");
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/u);
    expect(first).not.toContain("person");
  });
});

