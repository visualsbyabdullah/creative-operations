import ManagementDashboard from "@/components/dashboard/ManagementDashboard";
import type { EmployeeProfile } from "@/types/auth";

export default function HrRoleDashboard({ profile }: { profile: EmployeeProfile }) {
  return <ManagementDashboard profile={profile} />;
}