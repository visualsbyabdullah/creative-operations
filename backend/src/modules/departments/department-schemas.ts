import type { DepartmentMutation } from "@shared/contracts/department-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COLOR = /^#[0-9a-f]{6}$/i;
const KEY = /^[a-z][a-z0-9_]{0,79}$/;

export function departmentKeyFromName(name: string): string | null {
  const slug = name.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const withPrefix = /^[0-9]/.test(slug) ? `d_${slug}` : slug;
  const key = withPrefix.slice(0, 80);
  return KEY.test(key) ? key : null;
}

export function parseDepartmentMutation(
  input: unknown,
  editing: boolean,
): DepartmentMutation | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const allowed = new Set([
    "departmentId", "name", "description", "accentColor", "expectedUpdatedAt",
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return null;
  if (typeof value.name !== "string") return null;
  const name = value.name.trim();
  if (!name || name.length > 80) return null;
  const description = value.description === "" ? null : value.description;
  const accentColor = value.accentColor === "" ? null : value.accentColor;
  if (description !== null && (
    typeof description !== "string" || description.length > 4000
  )) return null;
  if (accentColor !== null && (
    typeof accentColor !== "string" || !COLOR.test(accentColor)
  )) return null;
  if (editing && (
    typeof value.departmentId !== "string" || !UUID.test(value.departmentId) ||
    typeof value.expectedUpdatedAt !== "string" ||
    Number.isNaN(Date.parse(value.expectedUpdatedAt))
  )) return null;
  return {
    departmentId: editing ? value.departmentId as string : undefined,
    name, description, accentColor,
    expectedUpdatedAt: editing ? value.expectedUpdatedAt as string : undefined,
  };
}
