import "server-only";

import { getActiveProfile } from "@backend/modules/auth/authorization";
import { parseBrandMutation } from "@backend/modules/brands/brand-schemas";
import type { BrandScheduleSlotView, BrandView } from "@shared/contracts/brand-types";
import {
  businessRateLimitDenied,
  enforceBusinessRateLimit,
} from "@backend/security/business-rate-limit";
import type { ActionResult } from "@shared/contracts/action-result";
import { createClient } from "@backend/supabase/server";

function mapBrand(row: Record<string, unknown>): BrandView {
  return {
    id: String(row.id),
    name: String(row.name),
    industry: String(row.industry),
    status: row.status as BrandView["status"],
    accentColor: row.accent_color as string | null,
    description: row.description as string | null,
    websiteUrl: row.website_url as string | null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function managementActor() {
  const actor = await getActiveProfile();
  if (actor.status !== "active") return null;
  if (actor.profile.role !== "manager" && actor.profile.role !== "hr") return null;
  return actor.profile;
}

export async function listBrands(): Promise<ActionResult<BrandView[]>> {
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("brand_read", actor.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { data, error } = await client
    .from("brands")
    .select("id,name,industry,status,accent_color,description,website_url,created_at,updated_at")
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .limit(200);
  if (error) return { ok: false, code: "temporarily_unavailable" };
  return { ok: true, data: (data ?? []).map((row) => mapBrand(row)) };
}

export async function getBrand(brandId: string): Promise<ActionResult<BrandView>> {
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  if (!/^[0-9a-f-]{36}$/i.test(brandId)) return { ok: false, code: "not_found" };
  const limit = await enforceBusinessRateLimit("brand_read", actor.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { data, error } = await client
    .from("brands")
    .select("id,name,industry,status,accent_color,description,website_url,created_at,updated_at")
    .eq("id", brandId)
    .maybeSingle();
  if (error) return { ok: false, code: "temporarily_unavailable" };
  if (!data) return { ok: false, code: "not_found" };
  return { ok: true, data: mapBrand(data) };
}

export async function createBrand(input: unknown): Promise<ActionResult<string>> {
  const parsed = parseBrandMutation(input, false);
  if (!parsed) return { ok: false, code: "validation_failed" };
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("brand_mutation", actor.id);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { data, error } = await client.rpc("create_brand", {
    p_name: parsed.name, p_industry: parsed.industry,
    p_accent_color: parsed.accentColor, p_description: parsed.description,
    p_website_url: parsed.websiteUrl,
  });
  if (error || typeof data !== "string") {
    return { ok: false, code: error?.code === "23505" ? "validation_failed" : "temporarily_unavailable" };
  }
  return { ok: true, data };
}

export async function updateBrand(input: unknown): Promise<ActionResult<true>> {
  const parsed = parseBrandMutation(input, true);
  if (!parsed?.brandId || !parsed.expectedUpdatedAt || !parsed.status) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("brand_mutation", actor.id, parsed.brandId);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { error } = await client.rpc("update_brand_v2", {
    p_brand_id: parsed.brandId, p_name: parsed.name, p_industry: parsed.industry,
    p_accent_color: parsed.accentColor, p_description: parsed.description,
    p_website_url: parsed.websiteUrl, p_status: parsed.status,
    p_expected_updated_at: parsed.expectedUpdatedAt,
  });
  if (error?.code === "40001") return { ok: false, code: "stale_update" };
  if (error?.code === "P0002") return { ok: false, code: "not_found" };
  if (error) return { ok: false, code: "temporarily_unavailable" };
  return { ok: true, data: true };
}

export async function setBrandArchived(input: unknown): Promise<ActionResult<true>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, code: "validation_failed" };
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some((key) => !["brandId","archived","expectedUpdatedAt"].includes(key)) ||
    typeof value.brandId !== "string" || typeof value.archived !== "boolean" ||
    typeof value.expectedUpdatedAt !== "string") return { ok: false, code: "validation_failed" };
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("brand_mutation", actor.id, value.brandId);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { error } = await client.rpc("set_brand_archived_v2", {
    p_brand_id: value.brandId, p_archived: value.archived,
    p_expected_updated_at: value.expectedUpdatedAt,
  });
  if (error?.code === "40001") return { ok: false, code: "stale_update" };
  if (error?.code === "P0002") return { ok: false, code: "not_found" };
  if (error) return { ok: false, code: "temporarily_unavailable" };
  return { ok: true, data: true };
}

export async function listBrandScheduleSlots(
  brandId: string,
): Promise<ActionResult<BrandScheduleSlotView[]>> {
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  if (!/^[0-9a-f-]{36}$/i.test(brandId)) return { ok: false, code: "not_found" };
  const limit = await enforceBusinessRateLimit("brand_read", actor.id, brandId);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { data, error } = await client.rpc("get_brand_schedule_slots_v1", {
    p_brand_id: brandId,
  });
  if (error) return { ok: false, code: "temporarily_unavailable" };
  return {
    ok: true,
    data: (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      weekday: Number(row.weekday),
      department: row.department as BrandScheduleSlotView["department"],
      contentType: String(row.content_type),
      publishingTime: String(row.publishing_time),
      platforms: row.platforms as BrandScheduleSlotView["platforms"],
      updatedAt: String(row.updated_at),
    })),
  };
}

export async function createBrandScheduleSlot(
  input: unknown,
): Promise<ActionResult<string>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, code: "validation_failed" };
  }
  const value = input as Record<string, unknown>;
  const allowed = new Set([
    "brandId", "weekday", "department", "contentType", "publishingTime", "platforms",
  ]);
  const platformAllowlist = new Set([
    "facebook", "instagram", "linkedin", "pinterest",
    "tiktok", "x", "youtube", "website", "other",
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key)) ||
    typeof value.brandId !== "string" ||
    !Number.isInteger(value.weekday) || Number(value.weekday) < 1 || Number(value.weekday) > 7 ||
    (value.department !== "graphic_design" && value.department !== "video_editing") ||
    typeof value.contentType !== "string" ||
    !value.contentType.trim() || value.contentType.trim().length > 120 ||
    typeof value.publishingTime !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.publishingTime) ||
    !Array.isArray(value.platforms) || value.platforms.length < 1 || value.platforms.length > 8 ||
    value.platforms.some((item) => typeof item !== "string" || !platformAllowlist.has(item)) ||
    new Set(value.platforms).size !== value.platforms.length) {
    return { ok: false, code: "validation_failed" };
  }
  const actor = await managementActor();
  if (!actor) return { ok: false, code: "forbidden" };
  const limit = await enforceBusinessRateLimit("brand_mutation", actor.id, value.brandId);
  if (businessRateLimitDenied(limit)) return { ok: false, code: "rate_limited" };
  const client = await createClient();
  const { data, error } = await client.rpc("create_brand_schedule_slot_v1", {
    p_brand_id: value.brandId,
    p_weekday: value.weekday,
    p_department: value.department,
    p_content_type: value.contentType.trim(),
    p_publishing_time: value.publishingTime,
    p_platforms: value.platforms,
  });
  if (error?.code === "P0002") return { ok: false, code: "not_found" };
  if (error || typeof data !== "string") return { ok: false, code: "temporarily_unavailable" };
  return { ok: true, data };
}
