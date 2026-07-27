import BrandDetailsPage from "@/components/brands/BrandDetailsPage";
import { requireManagementProfile } from "@/lib/auth/requireAppProfile";

export default async function BrandDetailsRoute({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  await requireManagementProfile();
  const { brandId } = await params;

  return <BrandDetailsPage brandId={brandId} />;
}
