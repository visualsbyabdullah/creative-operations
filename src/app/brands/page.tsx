import BrandsManagement from "@/components/brands/BrandsManagement";
import { requireManagementProfile } from "@/lib/auth/requireAppProfile";
import { listBrands } from "@/lib/brands/brand-service";

export default async function BrandsPage() {
  await requireManagementProfile();
  const result = await listBrands();
  return <BrandsManagement backendBrands={result.ok ? result.data : []} />;
}
