import MyTasks from "@frontend/components/tasks/MyTasks";
import { requireEmployeeProfile } from "@backend/modules/auth/requireAppProfile";
import { getSelfTaskOptions, listTasks } from "@backend/modules/tasks/task-service";
import { isCalendarDate, todayInTimeZone } from "@backend/modules/tasks/task-date";

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
