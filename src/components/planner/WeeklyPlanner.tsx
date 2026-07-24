"use client";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import PillSelect from "@/components/ui/PillSelect";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileImage,
  Film,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

type Department = "Graphic Design" | "Video Editing";

type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "In Review"
  | "Approved"
  | "Published"
  | "Delayed";

type Platform =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "TikTok"
  | "YouTube";

type PlannerTask = {
  id: number;
  title: string;
  brand: string;
  department: Department;
  contentType: string;
  platform: Platform[];
  assignee: string;
  day: WeekDay;
  time: string;
  status: TaskStatus;
  link?: string;
  delayReason?: string;
};

type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

type DepartmentFilter = "All Work" | Department;
type StatusFilter = "All Statuses" | TaskStatus;
type AssigneeFilter = "All Assignees" | string;

const weekDays: WeekDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const brands = [
  "Softgenie",
  "Softech",
  "Solentrix",
  "MARK47",
  "E-Bazaar",
  "Audit Tracker",
];

const teamMembers = {
  "Graphic Design": ["Abdullah Naeem", "Ali Raza"],
  "Video Editing": ["Hamza Khan", "Usman Ali"],
};

const contentTypes = {
  "Graphic Design": [
    "Static Post",
    "Carousel",
    "Story",
    "Banner",
    "Thumbnail",
  ],
  "Video Editing": [
    "Reel",
    "Short Video",
    "Video Advertisement",
    "Motion Graphic",
  ],
};

const statusStyles: Record<TaskStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-600",
  "In Progress": "bg-blue-50 text-blue-700",
  "In Review": "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Published: "bg-green-50 text-green-700",
  Delayed: "bg-red-50 text-red-700",
};

const plannerStatusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Statuses", value: "All Statuses" },
  ...(Object.keys(statusStyles) as TaskStatus[]).map((value) => ({ label: value, value })),
];

const plannerAssigneeOptions: { label: string; value: AssigneeFilter }[] = [
  { label: "All Assignees", value: "All Assignees" },
  ...Object.values(teamMembers).flat().map((value) => ({ label: value, value })),
];
const initialTasks: PlannerTask[] = [
  {
    id: 1,
    title: "AI Campaign Planner Carousel",
    brand: "Softgenie",
    department: "Graphic Design",
    contentType: "Carousel",
    platform: ["Instagram", "Facebook"],
    assignee: "Abdullah Naeem",
    day: "Monday",
    time: "11:30 AM",
    status: "Approved",
  },
  {
    id: 2,
    title: "Payroll Automation Post",
    brand: "Softech",
    department: "Graphic Design",
    contentType: "Static Post",
    platform: ["LinkedIn"],
    assignee: "Ali Raza",
    day: "Monday",
    time: "2:00 PM",
    status: "In Review",
  },
  {
    id: 3,
    title: "Solar Energy Promotional Reel",
    brand: "Solentrix",
    department: "Video Editing",
    contentType: "Reel",
    platform: ["Instagram", "TikTok"],
    assignee: "Hamza Khan",
    day: "Monday",
    time: "4:30 PM",
    status: "In Progress",
  },
  {
    id: 4,
    title: "Esports Match Announcement",
    brand: "MARK47",
    department: "Graphic Design",
    contentType: "Static Post",
    platform: ["Instagram"],
    assignee: "Abdullah Naeem",
    day: "Tuesday",
    time: "12:00 PM",
    status: "Not Started",
  },
  {
    id: 5,
    title: "Overlay Product Demo Reel",
    brand: "MARK47",
    department: "Video Editing",
    contentType: "Reel",
    platform: ["Instagram", "YouTube"],
    assignee: "Usman Ali",
    day: "Tuesday",
    time: "3:00 PM",
    status: "Delayed",
    delayReason: "The required gameplay footage is still pending from the client.",
  },
  {
    id: 6,
    title: "POS Features Carousel",
    brand: "E-Bazaar",
    department: "Graphic Design",
    contentType: "Carousel",
    platform: ["LinkedIn", "Facebook"],
    assignee: "Ali Raza",
    day: "Wednesday",
    time: "1:00 PM",
    status: "In Progress",
  },
  {
    id: 7,
    title: "Business Automation Reel",
    brand: "Softech",
    department: "Video Editing",
    contentType: "Short Video",
    platform: ["LinkedIn", "Instagram"],
    assignee: "Hamza Khan",
    day: "Wednesday",
    time: "5:00 PM",
    status: "Not Started",
  },
  {
    id: 8,
    title: "Audit Workflow Banner",
    brand: "Audit Tracker",
    department: "Graphic Design",
    contentType: "Banner",
    platform: ["LinkedIn"],
    assignee: "Abdullah Naeem",
    day: "Thursday",
    time: "11:00 AM",
    status: "Not Started",
  },
  {
    id: 9,
    title: "AI Platform Explainer",
    brand: "Softgenie",
    department: "Video Editing",
    contentType: "Motion Graphic",
    platform: ["YouTube", "LinkedIn"],
    assignee: "Usman Ali",
    day: "Thursday",
    time: "4:00 PM",
    status: "Not Started",
  },
  {
    id: 10,
    title: "Weekly Product Highlight",
    brand: "Solentrix",
    department: "Graphic Design",
    contentType: "Static Post",
    platform: ["Instagram", "Facebook"],
    assignee: "Ali Raza",
    day: "Friday",
    time: "12:30 PM",
    status: "Not Started",
  },
];

function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className="rounded-full border border-[#e8ecf2] bg-white px-2 py-1 text-[9px] font-semibold text-[#69717d]">
      {platform}
    </span>
  );
}

export default function WeeklyPlanner() {
  const [tasks, setTasks] = useState<PlannerTask[]>(initialTasks);
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilter>("All Work");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Statuses");
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("All Assignees");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [delayTaskId, setDelayTaskId] = useState<number | null>(null);
  const [delayReason, setDelayReason] = useState("");

  const [newTask, setNewTask] = useState({
    title: "",
    brand: brands[0],
    department: "Graphic Design" as Department,
    contentType: contentTypes["Graphic Design"][0],
    platform: "Instagram" as Platform,
    assignee: teamMembers["Graphic Design"][0],
    day: "Monday" as WeekDay,
    time: "10:00",
  });

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const weekLabel = useMemo(() => {
    const start = new Date(2026, 6, 20 + weekOffset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    return `${start.getDate()} - ${end.getDate()} ${end.toLocaleString("en-US", { month: "long" })} ${end.getFullYear()}`;
  }, [weekOffset]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const departmentMatches =
        departmentFilter === "All Work" ||
        task.department === departmentFilter;

      const query = searchQuery.trim().toLowerCase();

      const searchMatches =
        query.length === 0 ||
        task.title.toLowerCase().includes(query) ||
        task.brand.toLowerCase().includes(query) ||
        task.assignee.toLowerCase().includes(query);

      const statusMatches = statusFilter === "All Statuses" || task.status === statusFilter;
      const assigneeMatches = assigneeFilter === "All Assignees" || task.assignee === assigneeFilter;

      return departmentMatches && statusMatches && assigneeMatches && searchMatches;
    });
  }, [tasks, departmentFilter, statusFilter, assigneeFilter, searchQuery]);

  const taskStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((task) =>
      ["Approved", "Published"].includes(task.status),
    ).length;
    const inProgress = filteredTasks.filter(
      (task) => task.status === "In Progress",
    ).length;
    const delayed = filteredTasks.filter(
      (task) => task.status === "Delayed",
    ).length;

    return {
      total,
      completed,
      inProgress,
      delayed,
    };
  }, [filteredTasks]);

  function saveDelayReason() {
    if (!delayTaskId || !delayReason.trim()) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === delayTaskId
          ? {
              ...task,
              status: "Delayed",
              delayReason: delayReason.trim(),
            }
          : task,
      ),
    );

    setDelayTaskId(null);
    setDelayReason("");
  }

  function handleDepartmentChange(department: Department) {
    setNewTask((current) => ({
      ...current,
      department,
      contentType: contentTypes[department][0],
      assignee: teamMembers[department][0],
    }));
  }

  function addTask() {
    if (!newTask.title.trim()) {
      return;
    }

    const formattedTime = new Date(
      `2026-01-01T${newTask.time}`,
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const task: PlannerTask = {
      id: Date.now(),
      title: newTask.title.trim(),
      brand: newTask.brand,
      department: newTask.department,
      contentType: newTask.contentType,
      platform: [newTask.platform],
      assignee: newTask.assignee,
      day: newTask.day,
      time: formattedTime,
      status: "Not Started",
    };

    setTasks((currentTasks) =>
      editingTaskId
        ? currentTasks.map((currentTask) =>
            currentTask.id === editingTaskId
              ? { ...currentTask, ...task, id: currentTask.id }
              : currentTask,
          )
        : [...currentTasks, task],
    );

    setNewTask({
      title: "",
      brand: brands[0],
      department: "Graphic Design",
      contentType: contentTypes["Graphic Design"][0],
      platform: "Instagram",
      assignee: teamMembers["Graphic Design"][0],
      day: "Monday",
      time: "10:00",
    });

    setEditingTaskId(null);
    setIsTaskModalOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader variant="management" workspaceLabel="Management workspace" />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">
                Content scheduling
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Weekly Planner
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                Manage graphics, reels, platforms and team assignments from Monday to Friday.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
  type="button"
  onClick={() => setWeekOffset((current) => current - 1)}
  aria-label="Show previous week"
  className="grid size-10 place-items-center rounded-full border border-[#e8ebf0] bg-white transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
>
  <ChevronLeft size={17} />
</button>

              <button
  type="button"
  onClick={() => setWeekOffset(0)}
  aria-label="Return to current planning week"
  className="flex items-center gap-2 rounded-full border border-[#e8ebf0] bg-white px-4 py-2.5 text-xs font-bold transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
>
  {weekLabel}
</button>

              <button
  type="button"
  onClick={() => setWeekOffset((current) => current + 1)}
  aria-label="Show next week"
  className="grid size-10 place-items-center rounded-full border border-[#e8ebf0] bg-white transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
>
  <ChevronRight size={17} />
</button>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-[#2f80ed] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200"
              >
                <Plus size={17} />
                Add Task
              </button>
            </div>
          </section>

          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="kpi-card-hover rounded-[22px] bg-brand-blue-gradient p-5 text-white shadow-[0_18px_40px_rgba(47,128,237,0.20)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/75">Weekly Tasks</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {taskStats.total}
                  </p>
                  <p className="mt-3 text-xs text-white/70">
                    Scheduled from Monday to Friday
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-white text-[#2f80ed]">
                  <CalendarDays size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">Completed</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {taskStats.completed}
                  </p>
                  <p className="mt-3 text-xs text-[#959ca7]">
                    Approved or published
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">In Progress</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {taskStats.inProgress}
                  </p>
                  <p className="mt-3 text-xs text-[#959ca7]">
                    Currently under production
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <Clock3 size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">Delayed</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {taskStats.delayed}
                  </p>
                  <p className="mt-3 text-xs text-[#959ca7]">
                    Delay reason available
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-red-50 text-red-600">
                  <CircleAlert size={20} />
                </div>
              </div>
            </article>
          </section>

          <section className="mt-5 rounded-[24px] border border-[#edf0f5] bg-white p-4 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "All Work",
                    "Graphic Design",
                    "Video Editing",
                  ] as DepartmentFilter[]
                ).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setDepartmentFilter(filter)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                      departmentFilter === filter
                        ? "bg-[#15181d] text-white"
                        : "bg-[#f5f7fa] text-[#626a75]"
                    }`}
                  >
                    {filter === "Graphic Design" ? (
                      <FileImage size={15} />
                    ) : null}

                    {filter === "Video Editing" ? (
                      <Film size={15} />
                    ) : null}

                    {filter === "All Work" ? (
                      <ListChecks size={15} />
                    ) : null}

                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex items-center gap-2 rounded-full bg-[#f5f7fa] px-4 py-2.5">
                  <Search size={15} className="text-[#858c97]" />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Search brand, task or assignee..."
                    className="w-full bg-transparent text-xs outline-none sm:w-64"
                  />
                </label>

                <PillSelect<StatusFilter>
  icon={Check}
  value={statusFilter}
  options={plannerStatusOptions}
  onValueChange={setStatusFilter}
  ariaLabel="Filter tasks by status"
  menuAlign="right"
/>

<PillSelect<AssigneeFilter>
  icon={Users}
  value={assigneeFilter}
  options={plannerAssigneeOptions}
  onValueChange={setAssigneeFilter}
  ariaLabel="Filter tasks by assignee"
  menuAlign="right"
/>
              </div>
            </div>
          </section>

          <section className="dashboard-scrollbar mt-5 overflow-x-auto pb-3">
            <div className="grid min-w-[1320px] grid-cols-5 gap-4">
              {weekDays.map((day) => {
                const dayTasks = filteredTasks.filter(
                  (task) => task.day === day,
                );

                return (
                  <article
                    key={day}
                    className="rounded-[24px] border border-[#edf0f5] bg-[#f8fafc] p-3"
                  >
                    <header className="mb-3 flex items-center justify-between rounded-[18px] bg-white p-4">
                      <div>
                        <p className="text-sm font-bold">{day}</p>
                        <p className="mt-1 text-[10px] text-[#969da8]">
                          {dayTasks.length} scheduled tasks
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setNewTask((current) => ({
                            ...current,
                            day,
                          }));
                          setIsTaskModalOpen(true);
                        }}
                        className="grid size-8 place-items-center rounded-full bg-[#edf5ff] text-[#2f80ed]"
                      >
                        <Plus size={15} />
                      </button>
                    </header>

                    <div className="space-y-3">
                      {dayTasks.length === 0 ? (
                        <div className="grid min-h-40 place-items-center rounded-[18px] border border-dashed border-[#dfe4eb] bg-white/60 px-5 text-center">
                          <div>
                            <CalendarDays
                              size={22}
                              className="mx-auto text-[#adb4bf]"
                            />
                            <p className="mt-2 text-xs font-semibold text-[#7d8490]">
                              No task scheduled
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-[19px] border border-[#edf0f5] bg-white p-4 shadow-[0_10px_25px_rgba(24,39,75,0.035)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <div
                                className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                                  task.department === "Graphic Design"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-violet-50 text-violet-600"
                                }`}
                              >
                                {task.department ===
                                "Graphic Design" ? (
                                  <FileImage size={16} />
                                ) : (
                                  <Film size={16} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-bold text-[#2f80ed]">
                                  {task.brand}
                                </p>
                                <p className="mt-0.5 text-[9px] text-[#989fa9]">
                                  {task.contentType}
                                </p>
                              </div>
                            </div>

                            <button
  type="button"
  onClick={() => setSelectedTaskId(task.id)}
  aria-label={`Open ${task.title} actions`}
  className="grid size-7 shrink-0 place-items-center rounded-full border border-[#edf0f4] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
>
  <MoreHorizontal size={14} />
</button>
                          </div>

                          <h3 className="mt-4 text-sm font-bold leading-5">
                            {task.title}
                          </h3>

                          <div className="mt-3 flex flex-wrap gap-1">
                            {task.platform.map((platform) => (
                              <PlatformBadge
                                key={platform}
                                platform={platform}
                              />
                            ))}
                          </div>

                          <div className="mt-4 space-y-2 border-t border-[#f0f2f5] pt-3">
                            <div className="flex items-center justify-between gap-2 text-[10px]">
                              <span className="text-[#9299a4]">
                                Assignee
                              </span>
                              <span className="truncate font-bold text-[#434a55]">
                                {task.assignee}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-[#9299a4]">
                                Publishing
                              </span>
                              <span className="font-bold text-[#434a55]">
                                {task.time}
                              </span>
                            </div>
                          </div>

                          {task.delayReason ? (
                            <div className="mt-3 rounded-xl bg-red-50 p-3">
                              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-red-500">
                                Delay reason
                              </p>
                              <p className="mt-1 text-[10px] leading-4 text-red-700">
                                {task.delayReason}
                              </p>
                            </div>
                          ) : null}

                          <div className="mt-4">
  <StatusBadge status={task.status} />
</div>

                          {task.link ? (
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[#2f80ed]"
                            >
                              <ExternalLink size={12} />
                              View submission
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      {selectedTask ? (
        <>
          <button
            type="button"
            aria-label="Close task details"
            onClick={() => setSelectedTaskId(null)}
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
          />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">{selectedTask.brand}</p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">Task Details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 p-5 sm:p-6">
              <section>
                <StatusBadge status={selectedTask.status} />
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.04em]">{selectedTask.title}</h3>
              </section>

              <section className="grid grid-cols-2 gap-3">
                {[
                  ["Department", selectedTask.department],
                  ["Content Type", selectedTask.contentType],
                  ["Assignee", selectedTask.assignee],
                  ["Schedule", `${selectedTask.day}, ${selectedTask.time}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7f9fc] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#969da8]">{label}</p>
                    <p className="mt-2 text-sm font-bold">{value}</p>
                  </div>
                ))}
              </section>

              <section>
                <p className="text-xs font-bold text-[#4e5661]">Platforms</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTask.platform.map((platform) => (
                    <PlatformBadge key={platform} platform={platform} />
                  ))}
                </div>
              </section>

              {selectedTask.delayReason ? (
                <section className="rounded-[18px] bg-red-50 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-red-500">Delay reason</p>
                  <p className="mt-2 text-xs leading-5 text-red-700">{selectedTask.delayReason}</p>
                </section>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTaskId(selectedTask.id);
                    setNewTask({
                      title: selectedTask.title,
                      brand: selectedTask.brand,
                      department: selectedTask.department,
                      contentType: selectedTask.contentType,
                      platform: selectedTask.platform[0],
                      assignee: selectedTask.assignee,
                      day: selectedTask.day,
                      time: "10:00",
                    });
                    setSelectedTaskId(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-xs font-bold text-white"
                >
                  <Pencil size={14} />
                  Edit Task
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTasks((current) => current.filter((task) => task.id !== selectedTask.id));
                    setSelectedTaskId(null);
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-3 text-xs font-bold text-red-600"
                >
                  <Trash2 size={14} />
                  Delete Task
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}
      {isTaskModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="dashboard-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <header className="flex items-center justify-between border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">Add New Task</h2>
                <p className="mt-1 text-xs text-[#8b929d]">
                  Add a graphic or video task to the weekly schedule.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-[#f5f7fa]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  Task title
                </span>

                <input
                  value={newTask.title}
                  onChange={(event) =>
                    setNewTask((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Example: AI Campaign Carousel"
                  className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none transition focus:border-[#2f80ed]"
                />
              </label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Department
                </span>

<PillSelect<Department>
  value={newTask.department}
  options={[
    { label: "Graphic Design", value: "Graphic Design" },
    { label: "Video Editing", value: "Video Editing" },
  ]}
  onValueChange={handleDepartmentChange}
  ariaLabel="Select department"
  variant="field"
  fullWidth
/>
</label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Brand
                </span>

<PillSelect<string>
  value={newTask.brand}
  options={brands.map((value) => ({ label: value, value }))}
  onValueChange={(brand) => setNewTask((current) => ({ ...current, brand }))}
  ariaLabel="Select brand"
  variant="field"
  fullWidth
/>
</label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Content type
                </span>

<PillSelect<string>
  value={newTask.contentType}
  options={contentTypes[newTask.department].map((value) => ({ label: value, value }))}
  onValueChange={(contentType) => setNewTask((current) => ({ ...current, contentType }))}
  ariaLabel="Select content type"
  variant="field"
  fullWidth
/>
</label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Platform
                </span>

<PillSelect<Platform>
  value={newTask.platform}
  options={["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube"].map((value) => ({
    label: value,
    value: value as Platform,
  }))}
  onValueChange={(platform) => setNewTask((current) => ({ ...current, platform }))}
  ariaLabel="Select platform"
  variant="field"
  fullWidth
/>
</label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Assignee
                </span>

<PillSelect<string>
  value={newTask.assignee}
  options={teamMembers[newTask.department].map((value) => ({ label: value, value }))}
  onValueChange={(assignee) => setNewTask((current) => ({ ...current, assignee }))}
  ariaLabel="Select assignee"
  variant="field"
  fullWidth
/>
</label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Day
                </span>

<PillSelect<WeekDay>
  value={newTask.day}
  options={weekDays.map((value) => ({ label: value, value }))}
  onValueChange={(day) => setNewTask((current) => ({ ...current, day }))}
  ariaLabel="Select day"
  variant="field"
  fullWidth
/>
</label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Publishing time
                </span>

                <input
                  type="time"
                  value={newTask.time}
                  onChange={(event) =>
                    setNewTask((current) => ({
                      ...current,
                      time: event.target.value,
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none"
                />
              </label>
            </div>

            <footer className="flex justify-end gap-3 border-t border-[#edf0f5] p-5 sm:p-6">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="rounded-full border border-[#e5e9ef] px-5 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addTask}
                disabled={!newTask.title.trim()}
                className="rounded-full bg-[#2f80ed] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {editingTaskId ? "Save Changes" : "Add Task"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {delayTaskId ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[26px] bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.25)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="grid size-11 place-items-center rounded-full bg-red-50 text-red-600">
                  <CircleAlert size={21} />
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  Task delay reason
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#7d8490]">
                  A reason is required when marking a task as delayed
                  hai.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDelayTaskId(null);
                  setDelayReason("");
                }}
                className="grid size-9 place-items-center rounded-full bg-[#f5f7fa]"
              >
                <X size={17} />
              </button>
            </div>

            <textarea
              value={delayReason}
              onChange={(event) =>
                setDelayReason(event.target.value)
              }
              rows={5}
              placeholder="Example: Client assets were pending, so the task could not be completed."
              className="mt-5 w-full resize-none rounded-2xl border border-[#e5e9ef] p-4 text-sm leading-6 outline-none focus:border-[#2f80ed]"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDelayTaskId(null);
                  setDelayReason("");
                }}
                className="rounded-full border border-[#e5e9ef] px-5 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveDelayReason}
                disabled={!delayReason.trim()}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save Reason
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
