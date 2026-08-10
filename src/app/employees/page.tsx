import ManagementEmployees from "@/components/management/ManagementEmployees";
import { requireManagementProfile } from "@/lib/auth/requireAppProfile";
import { listEmployees } from "@/lib/employees/employee-service";

export default async function EmployeesPage() {
  await requireManagementProfile();
  const result = await listEmployees({
    search: "", roles: null, departments: null, isActive: null,
    sort: "full_name", direction: "asc", limit: 25, cursor: null,
  });
  return <ManagementEmployees initialRows={result.ok ? result.data : []} />;
}
