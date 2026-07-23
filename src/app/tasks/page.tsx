import MyTasks from "@/components/tasks/MyTasks";
import { requireEmployeeProfile } from "@/lib/auth/requireAppProfile";

export default async function TasksPage() {
  await requireEmployeeProfile();
  return <MyTasks />;
}