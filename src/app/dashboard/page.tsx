import EmployeeRoleDashboard from "@/components/dashboard/roles/EmployeeRoleDashboard";
import HrRoleDashboard from "@/components/dashboard/roles/HrRoleDashboard";
import ManagerRoleDashboard from "@/components/dashboard/roles/ManagerRoleDashboard";
import { requireAppProfile } from "@/lib/auth/requireAppProfile";
import { listTasks } from "@/lib/tasks/task-service";
import { getManagementDashboard } from "@/lib/dashboard/dashboard-service";
import { todayInTimeZone } from "@/lib/tasks/task-date";

export default async function DashboardPage() {
  const profile = await requireAppProfile();

  if (profile.role === "graphic_designer" || profile.role === "video_editor") {
    const tasks = await listTasks();
    const backendTasks = tasks.ok ? tasks.data : [];
    return <EmployeeRoleDashboard profile={profile} backendTasks={backendTasks} today={todayInTimeZone(profile.timezone)} />;
  }

  const dashboard=await getManagementDashboard();
  const managementData=dashboard.ok?dashboard.data:null;
  return profile.role === "hr"
    ? <HrRoleDashboard profile={profile} data={managementData} />
    : <ManagerRoleDashboard profile={profile} data={managementData} />;
}
