import EmployeeRoleDashboard from "@/components/dashboard/roles/EmployeeRoleDashboard";
import HrRoleDashboard from "@/components/dashboard/roles/HrRoleDashboard";
import ManagerRoleDashboard from "@/components/dashboard/roles/ManagerRoleDashboard";
import { requireAppProfile } from "@/lib/auth/requireAppProfile";

export default async function DashboardPage() {
  const profile = await requireAppProfile();

  if (profile.role === "graphic_designer" || profile.role === "video_editor") {
    return <EmployeeRoleDashboard profile={profile} />;
  }

  return profile.role === "hr"
    ? <HrRoleDashboard profile={profile} />
    : <ManagerRoleDashboard profile={profile} />;
}