import WeeklyPlanner from "@frontend/components/planner/WeeklyPlanner";
import { requireManagementProfile } from "@backend/modules/auth/requireAppProfile";
import { getPlannerOptions, listTaskPage } from "@backend/modules/tasks/task-service";
import { currentMonday, weekRange } from "@backend/modules/tasks/week-range";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{
    week?: string; search?: string; status?: string; department?: string;
    assignee?: string; brand?: string;
  }>;
}) {
  await requireManagementProfile();
  const params = await searchParams;
  const requested = params.week ?? currentMonday();
  let range;
  try {
    range = weekRange(requested);
  } catch {
    range = weekRange(currentMonday());
  }
  const statusMap = {
    "Not Started":"assigned","In Progress":"in_progress","In Review":"submitted",
    "Revision Required":"revision_requested",Delayed:"revision_requested",
    Approved:"archived",Published:"completed",
  } as const;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const [result, options] = await Promise.all([
    listTaskPage({
      ...range,
      search: typeof params.search==="string"&&params.search.length<=120?params.search:null,
      status: statusMap[params.status as keyof typeof statusMap]??null,
      department: params.department==="Graphic Design"?"graphic_design":
        params.department==="Video Editing"?"video_editing":null,
      assigneeId: params.assignee&&uuid.test(params.assignee)?params.assignee:null,
      brandId: params.brand&&uuid.test(params.brand)?params.brand:null,
      pageSize: 100,
    }),
    getPlannerOptions(),
  ]);
  const tasks = result.ok ? result.data.items : [];
  return <WeeklyPlanner
    key={tasks.map((task) => `${task.id}:${task.updatedAt}`).join("|")}
    backendTasks={tasks}
    options={options}
    weekStart={range.startDate}
    initialFilters={{
      search:params.search??"",status:params.status??"All Statuses",
      department:params.department??"All Work",assigneeId:params.assignee??null,
    }}
  />;
}
