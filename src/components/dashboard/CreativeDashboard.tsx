"use client";

import {
  useEffect,
  useState } from "react";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import Link from "next/link";
import { employeeNavigation } from "@/config/employeeNavigation";

import type { ComponentType } from "react";
import type { EmployeeProfile } from "@/types/auth";
import WeeklyProgressMeter from "@/components/dashboard/WeeklyProgressMeter";


import {
  Bell,
  Send,
  ListChecks,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileImage,
  LayoutDashboard,
  MoreHorizontal,
  Palette,
  Play,
  Search,
  Sparkles,
  Users,
  Eye,
  X,
  Flag,
  Globe2,
  Tag,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TaskStatus =
  | "Not Started"
  | "Published"
  | "Approved"
  | "In Review"
  | "In Progress"
  | "Delayed";

type Task = {
  id: number;
  brand: string;
  initials: string;
  content: string;
  platform: string;
  deadline: string;
  status: TaskStatus;
};

type MetricCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  featured?: boolean;
};


const performanceData = [
  { day: "Mon", completed: 4, remaining: 1 },
  { day: "Tue", completed: 5, remaining: 2 },
  { day: "Wed", completed: 3, remaining: 3 },
  { day: "Thu", completed: 6, remaining: 1 },
  { day: "Fri", completed: 2, remaining: 4 },
];

const initialTasks: Task[] = [
  {
    id: 1,
    brand: "Softgenie",
    initials: "SG",
    content: "AI Campaign Carousel",
    platform: "Instagram",
    deadline: "Today, 11:30 AM",
    status: "In Review",
  },
  {
    id: 2,
    brand: "Softech",
    initials: "ST",
    content: "Payroll Automation Post",
    platform: "LinkedIn",
    deadline: "Today, 2:00 PM",
    status: "In Progress",
  },
  {
    id: 3,
    brand: "Solentrix",
    initials: "SX",
    content: "Solar Energy Banner",
    platform: "Facebook",
    deadline: "Today, 4:30 PM",
    status: "Not Started",
  },
  {
    id: 4,
    brand: "MARK47",
    initials: "M7",
    content: "Esports Match Graphic",
    platform: "Instagram",
    deadline: "Yesterday, 6:00 PM",
    status: "Delayed",
  },
  {
    id: 5,
    brand: "E-Bazaar",
    initials: "EB",
    content: "POS Feature Post",
    platform: "LinkedIn",
    deadline: "Friday, 12:00 PM",
    status: "Not Started",
  },
];



const videoDashboardTasks: Task[] = [
  {
    id: 101,
    brand: "Solentrix",
    initials: "SX",
    content: "Residential Solar Promo Reel",
    platform: "Instagram",
    deadline: "Today, 11:30 AM",
    status: "Approved",
  },
  {
    id: 102,
    brand: "MARK47",
    initials: "M7",
    content: "Broadcast Overlay Demo",
    platform: "YouTube",
    deadline: "Today, 2:00 PM",
    status: "In Progress",
  },
  {
    id: 103,
    brand: "Softech",
    initials: "ST",
    content: "Business Automation Reel",
    platform: "LinkedIn",
    deadline: "Today, 4:30 PM",
    status: "In Review",
  },
  {
    id: 104,
    brand: "Softgenie",
    initials: "SG",
    content: "AI Platform Explainer",
    platform: "YouTube",
    deadline: "Thursday, 4:00 PM",
    status: "Not Started",
  },
  {
    id: 105,
    brand: "E-Bazaar",
    initials: "EB",
    content: "POS Feature Reel",
    platform: "Instagram",
    deadline: "Friday, 3:30 PM",
    status: "Delayed",
  },
  {
    id: 106,
    brand: "Audit Tracker",
    initials: "AT",
    content: "Audit Workflow Walkthrough",
    platform: "LinkedIn",
    deadline: "Friday, 5:00 PM",
    status: "Not Started",
  },
];
function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    "Not Started": "bg-slate-100 text-slate-700",
    Published: "bg-emerald-50 text-emerald-700",
    Approved: "bg-blue-50 text-blue-700",
    "In Review": "bg-amber-50 text-amber-700",
    "In Progress": "bg-violet-50 text-violet-700",
    Delayed: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function MetricCard({
  title,
  value,
  caption,
  icon: Icon,
  featured = false,
}: MetricCardProps) {

  const iconToneClass = featured
    ? "bg-white text-[#2f80ed]"
    : title === "Completed Today"
      ? "bg-emerald-50 text-emerald-600"
      : title === "Pending Review"
        ? "bg-amber-50 text-amber-600"
        : title === "Delayed Tasks"
          ? "bg-red-50 text-red-600"
          : "bg-blue-50 text-blue-600";

  return (
    <article
      className={`kpi-card-hover relative min-h-36 overflow-hidden rounded-[22px] border p-5 ${
        featured
          ? "border-blue-500 bg-brand-blue-gradient text-white shadow-[0_18px_40px_rgba(47,128,237,0.24)]"
          : "border-[#edf0f5] bg-white text-[#15181d] shadow-[0_12px_35px_rgba(24,39,75,0.035)]"
      }`}
    >

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm ${
              featured ? "text-white/75" : "text-[#7d8490]"
            }`}
          >
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            {value}
          </p>

          <p
            className={`mt-3 text-xs ${
              featured ? "text-white/70" : "text-[#959ca7]"
            }`}
          >
            {caption}
          </p>
        </div>

        <div
          className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-300 ${iconToneClass}`}
        >
          <Icon size={20} strokeWidth={1.9} />
        </div>
      </div>
    </article>
  );
}


const dashboardTaskDetailsByTitle: Record<
  string,
  {
    assignedAt: string;
    deadline: string;
    deliveredAt?: string;
    platforms: string[];
    priority: "High" | "Medium" | "Low";
    contentType: string;
    department: string;
    brief: string;
  }
> = {
  "AI Campaign Carousel": {
    assignedAt: "Monday, 20 July 2026 Â· 9:15 AM",
    deadline: "Wednesday, 22 July 2026 Â· 11:30 AM",
    platforms: [
      "Instagram",
      "Facebook",
    ],
    priority: "High",
    contentType: "Carousel",
    department: "Graphic Design",
    brief:
      "Create a five-slide campaign carousel highlighting Softgenie's AI campaign planning features, key benefits and a clear call to action.",
  },

  "Payroll Automation Post": {
    assignedAt: "Monday, 20 July 2026 Â· 10:00 AM",
    deadline: "Wednesday, 22 July 2026 Â· 2:00 PM",
    platforms: [
      "LinkedIn",
    ],
    priority: "Medium",
    contentType: "Static Post",
    department: "Graphic Design",
    brief:
      "Design a professional B2B post explaining payroll automation benefits, reduced manual work and improved reporting accuracy.",
  },

  "Solar Energy Banner": {
    assignedAt: "Tuesday, 21 July 2026 Â· 9:30 AM",
    deadline: "Wednesday, 22 July 2026 Â· 4:30 PM",
    deliveredAt: "Wednesday, 22 July 2026 Â· 3:55 PM",
    platforms: [
      "Facebook",
      "Instagram",
    ],
    priority: "Medium",
    contentType: "Promotional Banner",
    department: "Graphic Design",
    brief:
      "Create a clean solar energy promotional banner featuring residential panels, service benefits and a quotation CTA.",
  },

  "Esports Match Graphic": {
    assignedAt: "Monday, 20 July 2026 Â· 11:20 AM",
    deadline: "Tuesday, 21 July 2026 Â· 6:00 PM",
    platforms: [
      "Instagram",
      "Facebook",
    ],
    priority: "High",
    contentType: "Match Announcement",
    department: "Graphic Design",
    brief:
      "Create an esports match announcement graphic containing team names, match timing, tournament branding and broadcast details.",
  },

  "POS Feature Post": {
    assignedAt: "Wednesday, 22 July 2026 Â· 9:00 AM",
    deadline: "Friday, 24 July 2026 Â· 12:00 PM",
    deliveredAt: "Friday, 24 July 2026 Â· 11:25 AM",
    platforms: [
      "LinkedIn",
      "Facebook",
    ],
    priority: "Low",
    contentType: "Feature Post",
    department: "Graphic Design",
    brief:
      "Design a product feature post highlighting POS inventory, sales tracking and reporting functionality for small businesses.",
  },
};
export default function CreativeDashboard({
  profile,
}: {
  profile?: EmployeeProfile;
}) {
  const employeeFirstName =
    profile?.full_name
      ?.trim()
      .split(/\s+/)[0] ||
    "Abdullah";

  const isVideoEditor =
    profile?.role === "video_editor";

  const dashboardDepartment =
    isVideoEditor
      ? "Video Editing"
      : "Graphic Design";

  const dashboardTaskLabel =
    isVideoEditor
      ? "Video Task"
      : "Creative Task";

  const dashboardDescription =
    isVideoEditor
      ? "Here is your video editing workload, scheduled content and weekly progress."
      : "Here is your creative workload, scheduled content and weekly progress.";

  const roleInitialTasks =
    isVideoEditor
      ? videoDashboardTasks
      : initialTasks;
  const [
    selectedDashboardTask,
    setSelectedDashboardTask,
  ] = useState<Record<string, unknown> | null>(
    null,
  );

  const [
    dashboardTasks,
    setDashboardTasks,
  ] = useState<Task[]>(roleInitialTasks);


  const [
    isStartTaskOpen,
    setIsStartTaskOpen,
  ] = useState(false);

  const [
    selectedStartTaskId,
    setSelectedStartTaskId,
  ] = useState<number | null>(null);

  const pendingTasks = dashboardTasks.filter(
    (task) => task.status === "Not Started",
  );
  const selectedTaskTitle =
    selectedDashboardTask
      ? String(
          selectedDashboardTask.content ??
            selectedDashboardTask.title ??
            selectedDashboardTask.taskTitle ??
            "",
        )
      : "";

  const selectedTaskDetail =
    selectedTaskTitle
      ? dashboardTaskDetailsByTitle[
          selectedTaskTitle
        ] ??
        (isVideoEditor
          ? {
              assignedAt:
                "Assigned this week",
              deadline: String(
                selectedDashboardTask
                  ?.deadline ??
                  "Not specified",
              ),
              platforms: [
                String(
                  selectedDashboardTask
                    ?.platform ??
                    "Not specified",
                ),
              ],
              priority:
                "Medium" as const,
              contentType:
                "Video Edit",
              department:
                "Video Editing",
              brief:
                "Edit and deliver the assigned video according to the approved brief, reference material and publishing requirements.",
            }
          : undefined)
      : undefined;


  const [
    animationProgress,
    setAnimationProgress,
  ] = useState(0);

  useEffect(() => {
    let frameId = 0;

    const duration = 1250;
    const delay = 180;
    const animationStart =
      performance.now() + delay;

    function animateDashboard(
      currentTime: number,
    ) {
      if (currentTime < animationStart) {
        frameId = requestAnimationFrame(
          animateDashboard,
        );

        return;
      }

      const rawProgress = Math.min(
        (currentTime - animationStart) /
          duration,
        1,
      );

      const easedProgress =
        1 - Math.pow(1 - rawProgress, 3);

      setAnimationProgress(
        rawProgress >= 1
          ? 1
          : easedProgress,
      );

      if (rawProgress < 1) {
        frameId = requestAnimationFrame(
          animateDashboard,
        );
      }
    }

    setAnimationProgress(0);

    frameId = requestAnimationFrame(
      animateDashboard,
    );

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  const weeklyCompleted = 20;
  const weeklyTotal = 27;
  const weeklyPercentage = Math.round(
    (weeklyCompleted / weeklyTotal) * 100,
  );

  const performanceYAxisMax = Math.max(
    ...performanceData.map(
      (entry) =>
        entry.completed +
        entry.remaining,
    ),
  );

  const animatedPerformanceData =
    performanceData.map((entry) => ({
      ...entry,
      completed:
        entry.completed *
        animationProgress,
      remaining:
        entry.remaining *
        animationProgress,
    }));

  function openStartTaskDialog() {
    setSelectedStartTaskId(
      pendingTasks[0]?.id ?? null,
    );
    setIsStartTaskOpen(true);
  }

  function closeStartTaskDialog() {
    setIsStartTaskOpen(false);
    setSelectedStartTaskId(null);
  }

  function handleStartSelectedTask() {
    if (selectedStartTaskId === null) {
      return;
    }

    const selectedTask = dashboardTasks.find(
      (task) => task.id === selectedStartTaskId,
    );

    if (!selectedTask) {
      return;
    }

    const startedTask: Task = {
      ...selectedTask,
      status: "In Progress",
    };

    setDashboardTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === startedTask.id
          ? startedTask
          : task,
      ),
    );

    closeStartTaskDialog();

    setSelectedDashboardTask(
      startedTask as unknown as Record<
        string,
        unknown
      >,
    );
  }

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">
                Wednesday, 22 July
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Good afternoon, {employeeFirstName}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                {dashboardDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={openStartTaskDialog}
                disabled={pendingTasks.length === 0}
                className="flex items-center gap-2 rounded-full bg-brand-blue-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Play size={15} fill="currentColor" />
                {pendingTasks.length === 0
                  ? "No Pending Tasks"
                  : "Start Task"}
              </button>
            </div>
          </section>

          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Tasks Today"
              value="6"
              caption="2 completed Â· 4 remaining"
              icon={CalendarDays}
              featured
            />

            <MetricCard
              title="Completed Today"
              value="2"
              caption="33% of today's workload"
              icon={Check}
            />

            <MetricCard
              title="Pending Review"
              value="3"
              caption="Awaiting manager feedback"
              icon={Clock3}
            />

            <MetricCard
              title="Delayed Tasks"
              value="1"
              caption="Reason needs to be updated"
              icon={CircleAlert}
            />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,0.8fr)]">
            <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-6">
              <div>
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.025em]">
                    Weekly Performance
                  </h2>

                  <p className="mt-1 text-xs text-[#9299a4]">
                    Completed tasks compared with remaining workload
                  </p>
                </div>


              </div>

              <div className="mt-6 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={animatedPerformanceData}
                    barCategoryGap="30%"
                    margin={{
                      top: 10,
                      right: 0,
                      left: -25,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#eef1f5"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8b929d",
                        fontSize: 12,
                      }}
                      dy={10}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, performanceYAxisMax]}
                      tick={{
                        fill: "#9ba2ad",
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      cursor={{
                        fill: "#f7f9fc",
                      }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid #edf0f5",
                        boxShadow:
                          "0 16px 40px rgba(24,39,75,0.10)",
                        fontSize: "12px",
                      }}
                    />

                    <Bar
                      dataKey="remaining"
                      stackId="tasks"
                      radius={[0, 0, 10, 10]}
                    
  isAnimationActive={false}
>
                      {performanceData.map((entry) => (
  <Cell key={entry.day} fill="#edf1f6" />
))}
                    </Bar>

                    <Bar
                      dataKey="completed"
                      stackId="tasks"
                      radius={[10, 10, 0, 0]}
                    
  isAnimationActive={false}
>
                      {performanceData.map((entry) => (
                        <Cell
                          key={entry.day}
                          fill="#2f80ed"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-[#f0f2f5] pt-5 text-xs text-[#7d8490]">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#2f80ed]" />
                  Completed
                </div>

                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#edf1f6]" />
                  Remaining
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.025em]">
                    Weekly Progress
                  </h2>

                  <p className="mt-1 text-xs text-[#9299a4]">
                    Overall task completion
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="More options"
                  className="grid size-9 place-items-center rounded-full border border-[#edf0f4] text-[#69707b]"
                >
                  <MoreHorizontal size={17} />
                </button>
              </div>

              <WeeklyProgressMeter
                percentage={weeklyPercentage}
                progress={animationProgress}
                completed={weeklyCompleted}
                total={weeklyTotal}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs text-[#8a919c]">
                    Completed
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {weeklyCompleted}
                    <span className="ml-1 text-xs font-medium text-[#9299a4]">
                      tasks
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs text-[#8a919c]">
                    Remaining
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {weeklyTotal - weeklyCompleted}
                    <span className="ml-1 text-xs font-medium text-[#9299a4]">
                      tasks
                    </span>
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-5 rounded-[24px] border border-[#edf0f5] bg-white shadow-[0_15px_42px_rgba(24,39,75,0.04)]">
            <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f5] p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h2 className="text-lg font-bold tracking-[-0.025em]">
                  {isVideoEditor
                    ? "Today's Video Tasks"
                    : "Today's Creative Tasks"}
                </h2>

                <p className="mt-1 text-xs text-[#9299a4]">
                  {isVideoEditor
                    ? "Video editing tasks assigned for today and upcoming dates"
                    : "Graphic design tasks assigned for today and upcoming dates"}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex items-center gap-2 rounded-full bg-[#f7f8fa] px-4 py-2.5 text-[#858c97]">
                  <Search size={16} />

                  <input
                    type="search"
                    placeholder="Search tasks..."
                    className="w-full bg-transparent text-xs text-[#303640] outline-none placeholder:text-[#a1a7b0] sm:w-40"
                  />
                </label>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#f7f8fa] px-4 py-2.5 text-xs font-semibold text-[#555c67]"
                >
                  Sort by
                  <ChevronDown size={15} />
                </button>
              </div>
            </div>

            <div className="dashboard-scrollbar overflow-x-auto">
              <table className="app-table w-full min-w-[920px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#fafbfc] text-[11px] uppercase tracking-[0.08em] text-[#949ba6]">
                    <th className="px-6 py-4 font-semibold">
                      Brand
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Content
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Platform
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Deadline
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Status
                    </th>

                    <th className="w-[104px] px-6 py-4 text-left font-semibold">
  ACTION
</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboardTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-t border-[#f0f2f5] transition hover:bg-[#fafcff]"
                    >
                      <td className="px-6 py-4 pr-6 text-left">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-xl bg-[#edf5ff] text-xs font-bold text-[#2f80ed]">
                            {task.initials}
                          </div>

                          <div>
                            <p className="text-sm font-bold">
                              {task.brand}
                            </p>

                            <p className="mt-0.5 text-[11px] text-[#989fa9]">
                              {dashboardDepartment}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileImage
                            size={16}
                            className="text-[#2f80ed]"
                          />
                          {task.content}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-[#656c77]">
                        {task.platform}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#656c77]">
                        {task.deadline}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="w-[104px] px-6 py-4 text-left">

  <button
    type="button"
    aria-label="View task details"
    onClick={() =>
      setSelectedDashboardTask(
        task as unknown as Record<
          string,
          unknown
        >,
      )
    }
    className="grid size-9 place-items-center rounded-full border border-[#e7ebf0] text-[#69717d] transition hover:border-[#2f80ed] hover:bg-[#edf5ff] hover:text-[#2f80ed]"
  >
    <Eye size={15} />
  </button>

</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    
      {isStartTaskOpen ? (
        <>
          <button
            type="button"
            aria-label="Close start task dialog"
            onClick={closeStartTaskDialog}
            className="fixed inset-0 z-[60] bg-[#111827]/35 backdrop-blur-[3px]"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-task-title"
            className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-32px)] max-w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">
                  Pending tasks
                </p>

                <h2
                  id="start-task-title"
                  className="mt-1 text-xl font-bold tracking-[-0.03em]"
                >
                  Select a task to start
                </h2>

                <p className="mt-2 text-xs leading-5 text-[#858c97]">
                  Select the next pending task you want to start.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close start task modal"
                onClick={closeStartTaskDialog}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f4f6f9] text-[#555d68] transition hover:bg-[#e9edf2]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="dashboard-scrollbar max-h-[430px] space-y-3 overflow-y-auto p-5 sm:p-6">
              {pendingTasks.map((task) => {
                const isSelected =
                  selectedStartTaskId === task.id;

                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() =>
                      setSelectedStartTaskId(task.id)
                    }
                    className={`flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition ${
                      isSelected
                        ? "border-[#2f80ed] bg-[#edf5ff] ring-4 ring-blue-50"
                        : "border-[#e7ebf0] bg-white hover:border-[#cfd8e5] hover:bg-[#fafcff]"
                    }`}
                  >
                    <div
                      className={`grid size-12 shrink-0 place-items-center rounded-2xl text-xs font-bold ${
                        isSelected
                          ? "bg-[#2f80ed] text-white"
                          : "bg-[#edf5ff] text-[#2f80ed]"
                      }`}
                    >
                      {task.initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold">
                          {task.content}
                        </p>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-600">
                          {task.status}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-[#858c97]">
                        {task.brand} Â· {task.platform}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold text-[#a0a6b0]">
                        {task.deadline}
                      </p>
                    </div>

                    <div
                      className={`grid size-7 shrink-0 place-items-center rounded-full border ${
                        isSelected
                          ? "border-[#2f80ed] bg-[#2f80ed] text-white"
                          : "border-[#dfe5ed] bg-white text-transparent"
                      }`}
                    >
                      <Check size={14} />
                    </div>
                  </button>
                );
              })}
            </div>

            <footer className="flex justify-center border-t border-[#edf0f5] bg-[#fafbfc] p-5 sm:p-6">
              <button
                type="button"
                onClick={handleStartSelectedTask}
                disabled={selectedStartTaskId === null}
                className="flex items-center justify-center gap-2 rounded-full bg-brand-blue-gradient px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Play size={14} fill="currentColor" />
                Start Selected Task
              </button>
            </footer>
          </section>
        </>
      ) : null}

      {selectedDashboardTask ? (
        <>
          <button
            type="button"
            aria-label="Close dashboard task details"
            onClick={() =>
              setSelectedDashboardTask(null)
            }
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[3px]"
          />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[560px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">
                  {String(
                    selectedDashboardTask.brand ??
                      dashboardTaskLabel,
                  )}
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">
                  {selectedTaskTitle ||
                    "Task Details"}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close task details"
                onClick={() =>
                  setSelectedDashboardTask(null)
                }
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f4f6f9] text-[#555d68] transition hover:bg-[#e9edf2]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-6 p-5 sm:p-6">
              <section className="flex items-center justify-between gap-4 rounded-[20px] bg-[#f7f9fc] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf5ff] text-[#2f80ed]">
                    <FileImage size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {String(
                        selectedDashboardTask.brand ??
                          "Unknown Brand",
                      )}
                    </p>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      {selectedTaskDetail?.department ??
                        String(
                          selectedDashboardTask.department ??
                            dashboardDepartment,
                        )}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-[#fff5df] px-3 py-1.5 text-[10px] font-bold text-[#b66a00]">
                  {String(
                    selectedDashboardTask.status ??
                      "Not Started",
                  )}
                </span>
              </section>

              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#969da8]">
                  Task information
                </p>

                <div className="mt-3 overflow-hidden rounded-[20px] border border-[#e7ebf0]">
                  <div className="grid grid-cols-2">
                    <div className="border-b border-r border-[#e7ebf0] p-4">
                      <div className="flex items-center gap-2 text-[#9299a4]">
                        <CalendarDays size={14} />

                        <p className="text-[10px] font-semibold">
                          Assigned on
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-bold leading-5">
                        {selectedTaskDetail?.assignedAt ??
                          "Not specified"}
                      </p>
                    </div>

                    <div className="border-b border-[#e7ebf0] p-4">
                      <div className="flex items-center gap-2 text-[#9299a4]">
                        <Clock3 size={14} />

                        <p className="text-[10px] font-semibold">
                          Delivery deadline
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-bold leading-5">
                        {selectedTaskDetail?.deadline ??
                          String(
                            selectedDashboardTask.deadline ??
                              "Not specified",
                          )}
                      </p>
                    </div>

                    <div className="border-b border-r border-[#e7ebf0] p-4">
                      <div className="flex items-center gap-2 text-[#9299a4]">
                        <Tag size={14} />

                        <p className="text-[10px] font-semibold">
                          Content type
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-bold">
                        {selectedTaskDetail?.contentType ??
                          "Social Media Post"}
                      </p>
                    </div>

                    <div className="border-b border-[#e7ebf0] p-4">
                      <div className="flex items-center gap-2 text-[#9299a4]">
                        <Flag size={14} />

                        <p className="text-[10px] font-semibold">
                          Priority
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-bold">
                        {selectedTaskDetail?.priority ??
                          "Medium"}
                      </p>
                    </div>

                    <div className="border-r border-[#e7ebf0] p-4">
                      <div className="flex items-center gap-2 text-[#9299a4]">
                        <Users size={14} />

                        <p className="text-[10px] font-semibold">
                          Department
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-bold">
                        {selectedTaskDetail?.department ??
                          "Graphic Design"}
                      </p>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 text-[#9299a4]">
                        <Clock3 size={14} />

                        <p className="text-[10px] font-semibold">
                          Delivered on
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-bold">
                        {selectedTaskDetail?.deliveredAt ??
                          "Not delivered yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2">
                  <Globe2
                    size={15}
                    className="text-[#2f80ed]"
                  />

                  <p className="text-xs font-bold">
                    Publishing platforms
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    selectedTaskDetail?.platforms ??
                    [
                      String(
                        selectedDashboardTask.platform ??
                          "Not specified",
                      ),
                    ]
                  ).map((platform) => (
                    <span
                      key={platform}
                      className="rounded-full border border-[#e4e9ef] bg-white px-3 py-2 text-[10px] font-bold text-[#626a75]"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-[20px] border border-[#e7ebf0] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#969da8]">
                  Task brief
                </p>

                <p className="mt-3 text-sm leading-7 text-[#68717c]">
                  {selectedTaskDetail?.brief ??
                    "Detailed task brief has not been added yet."}
                </p>
              </section>
            </div>
          </aside>
        </>
      ) : null}
</main>
  );
}