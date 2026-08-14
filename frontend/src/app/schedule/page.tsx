import MySchedule from "@frontend/components/schedule/MySchedule";
import { requireEmployeeProfile } from "@backend/modules/auth/requireAppProfile";
import { listTaskPage } from "@backend/modules/tasks/task-service";
import { currentMonday, weekRange } from "@backend/modules/tasks/week-range";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; search?: string; status?: string; day?: string }>;
}) {
  await requireEmployeeProfile();
  const params = await searchParams;
  const requested = params.week ?? currentMonday();
  let range;
  try {
    range = weekRange(requested);
  } catch {
    range = weekRange(currentMonday());
  }
  const selectedWeekStart=range.startDate;
  const statusMap = {
    "Not Started":"assigned","In Progress":"in_progress","In Review":"submitted",
    "Revision Required":"revision_requested",Delayed:"revision_requested",
    Approved:"archived",Published:"completed",
  } as const;
  const dayNames=["Monday","Tuesday","Wednesday","Thursday","Friday"];
  if(params.day&&dayNames.includes(params.day)){
    const date=new Date(`${range.startDate}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate()+dayNames.indexOf(params.day));
    range={startDate:date.toISOString().slice(0,10),endDate:date.toISOString().slice(0,10)};
  }
  const result = await listTaskPage({
    ...range,
    search:typeof params.search==="string"&&params.search.length<=120?params.search:null,
    status:statusMap[params.status as keyof typeof statusMap]??null,
    pageSize:100,
  });
  return <MySchedule
    backendTasks={result.ok ? result.data.items : []}
    weekStart={selectedWeekStart}
    initialFilters={{
      search:params.search??"",status:params.status??"All Statuses",
      day:params.day??"All Days",
    }}
  />;
}
