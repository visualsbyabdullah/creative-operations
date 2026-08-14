import ManagementDashboard from "@frontend/components/dashboard/ManagementDashboard";
import type { EmployeeProfile } from "@shared/contracts/auth";
import type { ManagementDashboardData } from "@shared/contracts/dashboard-types";

export default function ManagerRoleDashboard({ profile,data }: { profile: EmployeeProfile;data:ManagementDashboardData|null }) {
  return <ManagementDashboard profile={profile} data={data} />;
}
