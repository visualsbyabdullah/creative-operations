import BrandsManagement from "@/components/brands/BrandsManagement";
import { requireManagementProfile } from "@/lib/auth/requireAppProfile";

export default async function BrandsPage() {
  await requireManagementProfile();
  return <BrandsManagement />;
}