import DepartmentsManagement from "@frontend/components/management/DepartmentsManagement";
import { requireManagementProfile } from "@backend/modules/auth/requireAppProfile";
import { listDepartments } from "@backend/modules/departments/department-service";

export default async function DepartmentsPage() {
  await requireManagementProfile();
  const result = await listDepartments();
  return <DepartmentsManagement initialDepartments={result.ok ? result.data : []} />;
}
