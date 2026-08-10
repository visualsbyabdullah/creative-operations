import "server-only";

import { createHash } from "node:crypto";

import type { EmployeeListInput } from "@/lib/employees/employee-schemas";

type CursorPayload = {
  v: 1;
  fingerprint: string;
  value: string | boolean | number | null;
  id: string;
};

function queryFingerprint(input: Omit<EmployeeListInput, "cursor" | "limit">) {
  return createHash("sha256").update(JSON.stringify({
    search: input.search.trim().toLowerCase(),
    roles: input.roles ? [...input.roles].sort() : null,
    departments: input.departments ? [...input.departments].sort() : null,
    isActive: input.isActive,
    sort: input.sort,
    direction: input.direction,
  })).digest("hex");
}

export function encodeEmployeeCursor(
  input: Omit<EmployeeListInput, "cursor" | "limit">,
  value: CursorPayload["value"],
  id: string,
) {
  const payload: CursorPayload = {
    v: 1,
    fingerprint: queryFingerprint(input),
    value,
    id,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeEmployeeCursor(
  input: Omit<EmployeeListInput, "cursor" | "limit">,
  cursor: string | null,
): CursorPayload | null {
  if (!cursor) return null;
  try {
    if (cursor.length > 1024 || !/^[A-Za-z0-9_-]+$/u.test(cursor)) return null;
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const item = value as Record<string, unknown>;
    if (
      Object.keys(item).sort().join(",") !== "fingerprint,id,v,value" ||
      item.v !== 1 ||
      item.fingerprint !== queryFingerprint(input) ||
      typeof item.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(item.id) ||
      !(
        item.value === null ||
        typeof item.value === "string" ||
        typeof item.value === "boolean" ||
        typeof item.value === "number"
      )
    ) return null;
    return item as CursorPayload;
  } catch {
    return null;
  }
}
