import CreativeDashboard from "@/components/dashboard/CreativeDashboard";
import type { EmployeeProfile } from "@/types/auth";

export default function EmployeeRoleDashboard({
  profile,
}: {
  profile: EmployeeProfile;
}) {
  /*
   * Current CreativeDashboard dummy data
   * later logged-in employee ID se filter hoga.
   */
  return <CreativeDashboard />;
}
