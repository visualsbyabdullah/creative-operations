import CreativeDashboard from "@/components/dashboard/CreativeDashboard";

import type {
  EmployeeProfile,
} from "@/types/auth";
import type { TaskView } from "@/lib/tasks/task-types";

export default function EmployeeRoleDashboard({
  profile,
  backendTasks,
}: {
  profile: EmployeeProfile;
  backendTasks: TaskView[];
}) {
  return (
    <CreativeDashboard
      profile={profile}
      backendTasks={backendTasks}
    />
  );
}
