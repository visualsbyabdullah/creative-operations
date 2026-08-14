import BrandDetailsPage from "@frontend/components/brands/BrandDetailsPage";
import { requireManagementProfile } from "@backend/modules/auth/requireAppProfile";
import { getBrand, listBrandScheduleSlots } from "@backend/modules/brands/brand-service";
import type { Brand } from "@frontend/data/brands";

export default async function BrandDetailsRoute({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  await requireManagementProfile();
  const { brandId } = await params;
  const [result, slotsResult] = await Promise.all([
    getBrand(brandId),
    listBrandScheduleSlots(brandId),
  ]);
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
  const platformNames = {
    facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn",
    tiktok: "TikTok", youtube: "YouTube",
  } as const;
  const brand: Brand | null = result.ok ? {
    id: result.data.id,
    name: result.data.name,
    initials: result.data.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    industry: result.data.industry,
    status: result.data.status === "active" ? "Active"
      : result.data.status === "paused" ? "Paused" : "Archived",
    accent: result.data.accentColor ?? "#2f80ed",
    description: result.data.description ?? "Brand description has not been added yet.",
    website: result.data.websiteUrl ?? undefined,
    graphicDesigners: [],
    videoEditors: [],
    platforms: [],
    weeklySchedule: slotsResult.ok ? slotsResult.data
      .filter((slot) => slot.weekday <= 5)
      .map((slot) => ({
        id: slot.id,
        day: dayNames[slot.weekday - 1],
        department: slot.department === "graphic_design" ? "Graphic Design" : "Video Editing",
        contentType: slot.contentType,
        platforms: slot.platforms
          .filter((platform): platform is keyof typeof platformNames => platform in platformNames)
          .map((platform) => platformNames[platform]),
        publishingTime: slot.publishingTime.slice(0, 5),
      })) : [],
  } : null;

  return (
    <BrandDetailsPage
      brandId={brandId}
      initialBrand={brand}
      expectedUpdatedAt={result.ok ? result.data.updatedAt : null}
      backendStatus={result.ok ? result.data.status : null}
    />
  );
}
