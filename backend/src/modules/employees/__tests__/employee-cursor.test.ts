import { describe, expect, it } from "vitest";
import { decodeEmployeeCursor, encodeEmployeeCursor } from "@backend/modules/employees/employee-cursor";

const query = {
  search: "", roles: null, departments: null, isActive: null,
  sort: "full_name" as const, direction: "asc" as const,
};
const id = "51000000-0000-4000-8000-000000000003";

describe("employee keyset cursor", () => {
  it("round-trips a versioned sort value and UUID", () => {
    const cursor = encodeEmployeeCursor(query, "same name", id);
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(decodeEmployeeCursor(query, cursor)).toMatchObject({ v: 1, value: "same name", id });
  });
  it("supports explicit null sort values", () => {
    const selected = { ...query, sort: "progress_percent" as const };
    expect(decodeEmployeeCursor(
      selected, encodeEmployeeCursor(selected, null, id),
    )?.value).toBeNull();
  });
  it("rejects cursors after filters or sorting change", () => {
    const cursor = encodeEmployeeCursor(query, "person", id);
    expect(decodeEmployeeCursor({ ...query, search: "new" }, cursor)).toBeNull();
    expect(decodeEmployeeCursor({ ...query, direction: "desc" }, cursor)).toBeNull();
  });
  it("rejects malformed and oversized cursors", () => {
    expect(decodeEmployeeCursor(query, "not+a+cursor")).toBeNull();
    expect(decodeEmployeeCursor(query, "a".repeat(1025))).toBeNull();
  });
});
