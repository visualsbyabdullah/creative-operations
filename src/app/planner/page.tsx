import WeeklyPlanner from "@/components/planner/WeeklyPlanner";
import { requireManagementProfile } from "@/lib/auth/requireAppProfile";

export default async function PlannerPage() {
  await requireManagementProfile();
  return <WeeklyPlanner />;
}