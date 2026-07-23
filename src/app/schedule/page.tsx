import MySchedule from "@/components/schedule/MySchedule";
import { requireEmployeeProfile } from "@/lib/auth/requireAppProfile";

export default async function SchedulePage() {
  await requireEmployeeProfile();
  return <MySchedule />;
}