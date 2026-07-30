import MyTasks from "@/components/tasks/MyTasks";
import { requireEmployeeProfile } from "@/lib/auth/requireAppProfile";
import { listTasks } from "@/lib/tasks/task-service";

export default async function TasksPage() {
  await requireEmployeeProfile();
  const result = await listTasks();
  return <MyTasks backendTasks={result.ok ? result.data : []} />;
}
