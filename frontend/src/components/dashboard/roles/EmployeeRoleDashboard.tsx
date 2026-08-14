import CreativeDashboard from "@frontend/components/dashboard/CreativeDashboard";

import type {
  EmployeeProfile,
} from "@shared/contracts/auth";
import type { TaskView } from "@shared/contracts/task-types";

export default function EmployeeRoleDashboard({
  profile,
  backendTasks,
  today,
}: {
  profile: EmployeeProfile;
  backendTasks: TaskView[];
  today?: string;
}) {
  return (
    <CreativeDashboard
      profile={profile}
      backendTasks={backendTasks}
      today={today}
    />
  );
}
