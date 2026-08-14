import type { BrandMutation } from "@shared/contracts/brand-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COLOR = /^#[0-9a-f]{6}$/i;

export function parseBrandMutation(
  input: unknown,
  editing: boolean,
): BrandMutation | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const allowed = new Set([
    "brandId", "name", "industry", "accentColor", "description",
    "websiteUrl", "status", "expectedUpdatedAt",
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return null;
  if (typeof value.name !== "string" || typeof value.industry !== "string") return null;
  const name = value.name.trim();
  const industry = value.industry.trim();
  if (!name || name.length > 120 || !industry || industry.length > 120) return null;
  const accentColor = value.accentColor === "" ? null : value.accentColor;
  const description = value.description === "" ? null : value.description;
  const websiteUrl = value.websiteUrl === "" ? null : value.websiteUrl;
  if (accentColor !== null && (typeof accentColor !== "string" || !COLOR.test(accentColor))) return null;
  if (description !== null && (typeof description !== "string" || description.length > 4000)) return null;
  if (websiteUrl !== null && (
    typeof websiteUrl !== "string" || websiteUrl.length > 2048 ||
    !websiteUrl.startsWith("https://")
  )) return null;
  if (editing && (
    typeof value.brandId !== "string" || !UUID.test(value.brandId) ||
    typeof value.expectedUpdatedAt !== "string" ||
    Number.isNaN(Date.parse(value.expectedUpdatedAt)) ||
    (value.status !== "active" && value.status !== "paused")
  )) return null;
  return {
    brandId: editing ? value.brandId as string : undefined,
    name, industry, accentColor, description, websiteUrl,
    status: editing ? value.status as "active" | "paused" : undefined,
    expectedUpdatedAt: editing ? value.expectedUpdatedAt as string : undefined,
  };
}
