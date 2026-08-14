import { describe, expect, it } from "vitest";

import { weekRange } from "@backend/modules/tasks/week-range";

describe("weekRange", () => {
  it("normalizes a weekday to its Monday-through-Sunday range", () => {
    expect(weekRange("2026-07-30")).toEqual({
      startDate: "2026-07-27",
      endDate: "2026-08-02",
    });
  });

  it("treats Sunday as the final day of the preceding ISO week", () => {
    expect(weekRange("2026-08-02")).toEqual({
      startDate: "2026-07-27",
      endDate: "2026-08-02",
    });
  });

  it("rejects malformed or impossible date-only input", () => {
    expect(() => weekRange("2026-02-30")).toThrow("invalid_date");
    expect(() => weekRange("07/30/2026")).toThrow("invalid_date");
  });
});
