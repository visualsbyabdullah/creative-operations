import MyTasks from "@/components/tasks/MyTasks";
import { requireEmployeeProfile } from "@/lib/auth/requireAppProfile";
import { getSelfTaskOptions, listTaskPage } from "@/lib/tasks/task-service";
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
    listTaskPage({ startDate: selectedDate, endDate: selectedDate, pageSize: 100 }),
    getSelfTaskOptions(),
  ]);
  return <MyTasks
    backendTasks={result.ok ? result.data.items : []}
    selectedDate={selectedDate}
    today={today}
    brands={brands}
  />;
}
