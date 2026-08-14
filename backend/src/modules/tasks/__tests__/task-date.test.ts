import { describe, expect, it } from "vitest";

import {
  isCalendarDate,
  shiftCalendarDate,
  todayInTimeZone,
} from "@backend/modules/tasks/task-date";

describe("task calendar dates", () => {
  it("validates real date-only values", () => {
    expect(isCalendarDate("2026-08-10")).toBe(true);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2026-8-10")).toBe(false);
  });

  it("moves between dates without local timezone conversion", () => {
    expect(shiftCalendarDate("2026-08-10", -1)).toBe("2026-08-09");
    expect(shiftCalendarDate("2026-08-10", 1)).toBe("2026-08-11");
    expect(shiftCalendarDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("returns a stable calendar date for a profile timezone", () => {
    expect(todayInTimeZone("Asia/Karachi")).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
  });
});
