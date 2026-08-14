import BrandsManagement from "@frontend/components/brands/BrandsManagement";
import { requireManagementProfile } from "@backend/modules/auth/requireAppProfile";
import { listBrands } from "@backend/modules/brands/brand-service";

export default async function BrandsPage() {
  await requireManagementProfile();
  const result = await listBrands();
  return <BrandsManagement backendBrands={result.ok ? result.data : []} />;
}
