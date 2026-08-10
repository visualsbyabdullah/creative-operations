import ManagementDashboard from "@/components/dashboard/ManagementDashboard";
import type { EmployeeProfile } from "@/types/auth";
import type { ManagementDashboardData } from "@/lib/dashboard/dashboard-service";

export default function HrRoleDashboard({ profile,data }: { profile: EmployeeProfile;data:ManagementDashboardData|null }) {
  return <ManagementDashboard profile={profile} data={data} />;
}
