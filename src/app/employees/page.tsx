import ManagementEmployees from "@/components/management/ManagementEmployees";
import { requireManagementProfile } from "@/lib/auth/requireAppProfile";

export default async function EmployeesPage() {
  await requireManagementProfile();
  return <ManagementEmployees />;
}