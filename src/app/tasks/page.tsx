import MyTasks from "@/components/tasks/MyTasks";
import { requireEmployeeProfile } from "@/lib/auth/requireAppProfile";
import { getSelfTaskOptions, listTasks } from "@/lib/tasks/task-service";
import { isCalendarDate, todayInTimeZone } from "@/lib/tasks/task-date";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireEmployeeProfile();
  const requested = (await searchParams).date;
  const today = todayInTimeZone(profile.timezone);
  const selectedDate = isCalendarDate(requested) ? requested : today;
  const [result, brands] = await Promise.all([
    listTasks(),
    getSelfTaskOptions(),
  ]);
  return <MyTasks
    backendTasks={result.ok ? result.data : []}
    selectedDate={selectedDate}
    today={today}
    brands={brands}
  />;
}
