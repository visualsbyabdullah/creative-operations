import { describe, expect, it } from "vitest";

import { departmentLabel, roleLabel } from "@/config/employee";

describe("authenticated identity labels", () => {
  it.each([
    ["manager", "Manager", "Management"],
    ["hr", "HR", "Management"],
    ["graphic_designer", "Graphic Designer", "Graphic Design"],
    ["video_editor", "Video Editor", "Video Editing"],
  ] as const)("maps %s without a fallback", (role, label, department) => {
    expect(roleLabel(role)).toBe(label);
    expect(departmentLabel(role)).toBe(department);
  });
});
