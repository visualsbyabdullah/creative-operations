import CreativeDashboard from "@/components/dashboard/CreativeDashboard";

import type {
  EmployeeProfile,
} from "@/types/auth";
import type { TaskView } from "@/lib/tasks/task-types";

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
