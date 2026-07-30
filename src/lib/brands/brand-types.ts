export type BrandStatus = "active" | "paused" | "archived";

export type BrandView = {
  id: string;
  name: string;
  industry: string;
  status: BrandStatus;
  accentColor: string | null;
  description: string | null;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BrandMutation = {
  brandId?: string;
  name: string;
  industry: string;
  accentColor: string | null;
  description: string | null;
  websiteUrl: string | null;
  status?: "active" | "paused";
  expectedUpdatedAt?: string;
};

export type BrandScheduleSlotView = {
  id: string;
  weekday: number;
  department: "graphic_design" | "video_editing";
  contentType: string;
  publishingTime: string;
  platforms: Array<
    "facebook" | "instagram" | "linkedin" | "pinterest" |
    "tiktok" | "x" | "youtube" | "website" | "other"
  >;
  updatedAt: string;
};
