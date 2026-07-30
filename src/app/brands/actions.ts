"use server";

import { revalidatePath } from "next/cache";
import {
  createBrand,
  createBrandScheduleSlot,
  setBrandArchived,
  updateBrand,
} from "@/lib/brands/brand-service";

function refreshBrands(brandId?: string) {
  revalidatePath("/brands");
  revalidatePath("/planner");
  if (brandId) revalidatePath(`/brands/${brandId}`);
}

export async function createBrandScheduleSlotAction(input: unknown) {
  const result = await createBrandScheduleSlot(input);
  if (result.ok && input && typeof input === "object" && "brandId" in input) {
    refreshBrands(String(input.brandId));
  }
  return result;
}

export async function createBrandAction(input: unknown) {
  const result = await createBrand(input);
  if (result.ok) refreshBrands(result.data);
  return result;
}

export async function updateBrandAction(input: unknown) {
  const result = await updateBrand(input);
  if (result.ok && input && typeof input === "object" && "brandId" in input) {
    refreshBrands(String(input.brandId));
  }
  return result;
}

export async function setBrandArchivedAction(input: unknown) {
  const result = await setBrandArchived(input);
  if (result.ok && input && typeof input === "object" && "brandId" in input) {
    refreshBrands(String(input.brandId));
  }
  return result;
}
