"use client";

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
  Link2,
  Search,
} from "lucide-react";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import PillSelect from "@/components/ui/PillSelect";

import type {
  EmployeeDepartment,
} from "@/config/employee";

import { useEmployee } from "@/context/EmployeeContext";

type WeekDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "In Review"
  | "Revision Required"
  | "Approved"
  | "Published"
  | "Delayed";

type Platform =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "TikTok"
  | "YouTube";

type ScheduleTask = {
  id: number;
  brand: string;
  title: string;
  department: EmployeeDepartment;
  contentType: string;
  platforms: Platform[];
  day: WeekDay;
  date: string;
  deadline: string;
  status: TaskStatus;
  submissionLink?: string;
  publishedLink?: string;
  delayReason?: string;
};

type DayFilter = "All Days" | WeekDay;

type StatusFilter =
  | "All Statuses"
  | TaskStatus;

const weekDays: WeekDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const taskStatuses: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "In Review",
  "Revision Required",
  "Approved",
  "Published",
  "Delayed",
];

const dayFilterOptions: {
  label: string;
  value: DayFilter;
}[] = [
  {
    label: "All Days",
    value: "All Days",
  },
  ...weekDays.map((day) => ({
    label: day,
    value: day,
  })),
];

const statusFilterOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All Statuses",
    value: "All Statuses",
  },
  ...taskStatuses.map((status) => ({
    label: status,
    value: status,
  })),
];

const statusStyles: Record<TaskStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-50 text-blue-700",
  "In Review": "bg-amber-50 text-amber-700",
  "Revision Required": "bg-orange-50 text-orange-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Published: "bg-green-50 text-green-700",
  Delayed: "bg-red-50 text-red-700",
};

const scheduleTasks: ScheduleTask[] = [
  {
    id: 1,
    brand: "Softgenie",
    title: "AI Campaign Planner Carousel",
    department: "Graphic Design",
    contentType: "Carousel",
    platforms: ["Instagram", "Facebook"],
    day: "Monday",
    date: "20 Jul",
    deadline: "11:30 AM",
    status: "Approved",
    submissionLink: "https://drive.google.com/",
  },
  {
    id: 2,
    brand: "Softech",
    title: "Payroll Automation Post",
    department: "Graphic Design",
    contentType: "Static Post",
    platforms: ["LinkedIn"],
    day: "Tuesday",
    date: "21 Jul",
    deadline: "2:00 PM",
    status: "In Review",
    submissionLink: "https://drive.google.com/",
  },
  {
    id: 3,
    brand: "MARK47",
    title: "Esports Match Announcement",
    department: "Graphic Design",
    contentType: "Static Post",
    platforms: ["Instagram"],
    day: "Wednesday",
    date: "22 Jul",
    deadline: "12:00 PM",
    status: "In Progress",
  },
  {
    id: 4,
    brand: "Audit Tracker",
    title: "Audit Workflow Banner",
    department: "Graphic Design",
    contentType: "Banner",
    platforms: ["LinkedIn"],
    day: "Thursday",
    date: "23 Jul",
    deadline: "11:00 AM",
    status: "Not Started",
  },
  {
    id: 5,
    brand: "Solentrix",
    title: "Solar Product Highlight",
    department: "Graphic Design",
    contentType: "Static Post",
    platforms: ["Instagram", "Facebook"],
    day: "Friday",
    date: "24 Jul",
    deadline: "12:30 PM",
    status: "Delayed",
    delayReason:
      "The required product photographs are still pending from the client.",
  },
  {
    id: 6,
    brand: "Solentrix",
    title: "Residential Solar Promo Reel",
    department: "Video Editing",
    contentType: "Reel",
    platforms: ["Instagram", "TikTok"],
    day: "Monday",
    date: "20 Jul",
    deadline: "4:30 PM",
    status: "Approved",
    publishedLink: "https://instagram.com/",
  },
  {
    id: 7,
    brand: "MARK47",
    title: "Broadcast Overlay Demo",
    department: "Video Editing",
    contentType: "Product Reel",
    platforms: ["Instagram", "YouTube"],
    day: "Tuesday",
    date: "21 Jul",
    deadline: "3:00 PM",
    status: "In Progress",
  },
  {
    id: 8,
    brand: "Softech",
    title: "Business Automation Reel",
    department: "Video Editing",
    contentType: "Short Video",
    platforms: ["LinkedIn", "Instagram"],
    day: "Wednesday",
    date: "22 Jul",
    deadline: "5:00 PM",
    status: "In Review",
    submissionLink: "https://drive.google.com/",
  },
  {
    id: 9,
    brand: "Softgenie",
    title: "AI Platform Explainer",
    department: "Video Editing",
    contentType: "Motion Graphic",
    platforms: ["YouTube", "LinkedIn"],
    day: "Thursday",
    date: "23 Jul",
    deadline: "4:00 PM",
    status: "Not Started",
  },
  {
    id: 10,
    brand: "E-Bazaar",
    title: "POS Feature Reel",
    department: "Video Editing",
    contentType: "Reel",
    platforms: ["Instagram"],
    day: "Friday",
    date: "24 Jul",
    deadline: "3:30 PM",
    status: "Delayed",
    delayReason:
      "The updated product screen recording has not been received yet.",
  },
];

function StatusBadge({
  status,
}: {
  status: TaskStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1.5 text-[10px] font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default function MySchedule() {
  const {
    department: selectedDepartment,
    employee,
  } = useEmployee();

  const [dayFilter, setDayFilter] =
    useState<DayFilter>("All Days");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All Statuses");

  const [searchQuery, setSearchQuery] =
    useState("");


  const employeeTasks = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return scheduleTasks.filter((task) => {
      const departmentMatches =
        task.department === selectedDepartment;

      const dayMatches =
        dayFilter === "All Days" ||
        task.day === dayFilter;

      const statusMatches =
        statusFilter === "All Statuses" ||
        task.status === statusFilter;

      const searchMatches =
        query.length === 0 ||
        task.title
          .toLowerCase()
          .includes(query) ||
        task.brand
          .toLowerCase()
          .includes(query) ||
        task.contentType
          .toLowerCase()
          .includes(query);

      return (
        departmentMatches &&
        dayMatches &&
        statusMatches &&
        searchMatches
      );
    });
  }, [
    selectedDepartment,
    dayFilter,
    statusFilter,
    searchQuery,
  ]);

  const departmentTasks = useMemo(
    () =>
      scheduleTasks.filter(
        (task) =>
          task.department ===
          selectedDepartment,
      ),
    [selectedDepartment],
  );

  const stats = useMemo(() => {
    const total = departmentTasks.length;

    const completed = departmentTasks.filter(
      (task) =>
        task.status === "Approved" ||
        task.status === "Published",
    ).length;

    const active = departmentTasks.filter(
      (task) =>
        task.status === "In Progress" ||
        task.status === "In Review" ||
        task.status ===
          "Revision Required",
    ).length;

    const delayed = departmentTasks.filter(
      (task) => task.status === "Delayed",
    ).length;

    const percentage =
      total === 0
        ? 0
        : Math.round(
            (completed / total) * 100,
          );

    return {
      total,
      completed,
      active,
      delayed,
      percentage,
    };
  }, [departmentTasks]);

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader employee={employee} />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">
                {employee.department}
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                My Schedule
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                View your assigned content schedule, deadlines and task status from Monday to Friday.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-label="Previous week"
                className="grid size-11 place-items-center rounded-full border border-[#e7ebf0] bg-white"
              >
                <ChevronLeft size={17} />
              </button>

              <div className="inline-flex h-11 items-center gap-2.5 rounded-full border border-[#e7ebf0] bg-white px-4 text-xs font-bold text-[#4f5762]">
                <CalendarDays size={15} />
                20â€“24 July 2026
              </div>

              <button
                type="button"
                aria-label="Next week"
                className="grid size-11 place-items-center rounded-full border border-[#e7ebf0] bg-white"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </section>


          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="kpi-card-hover rounded-[22px] bg-brand-blue-gradient p-5 text-white shadow-[0_18px_40px_rgba(47,128,237,0.20)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/75">
                    Scheduled Tasks
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.total}
                  </p>

                  <p className="mt-3 text-xs text-white/70">
                    This working week
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
                  <p className="text-sm text-[#7d8490]">
                    Completed
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.completed}
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
                  <p className="text-sm text-[#7d8490]">
                    Active Tasks
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.active}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Production or review
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
                  <p className="text-sm text-[#7d8490]">
                    Delayed
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.delayed}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Reason recorded
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
              <div>
                <h2 className="text-lg font-bold">
                  Weekly Schedule
                </h2>

                <p className="mt-1 text-xs text-[#9299a4]">
                  {employeeTasks.length} tasks
                  matching current filters
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex h-11 min-w-[220px] items-center gap-2.5 rounded-full bg-[#f5f7fa] px-4">
                  <Search
                    size={15}
                    className="shrink-0 text-[#858c97]"
                  />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value,
                      )
                    }
                    placeholder="Search schedule..."
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </label>

                <PillSelect
                  icon={CalendarDays}
                  ariaLabel="Filter schedule by day"
                  value={dayFilter}
                  options={dayFilterOptions}
                  onValueChange={setDayFilter}
                />

                <PillSelect
                  icon={Check}
                  ariaLabel="Filter schedule by status"
                  value={statusFilter}
                  options={statusFilterOptions}
                  onValueChange={setStatusFilter}
                />
              </div>
            </div>
          </section>

          <section className="dashboard-scrollbar mt-5 overflow-x-auto pb-3">
            <div className="grid min-w-[1280px] grid-cols-5 gap-4">
              {weekDays.map((day) => {
                const dayTasks =
                  employeeTasks.filter(
                    (task) => task.day === day,
                  );

                return (
                  <article
                    key={day}
                    className="rounded-[24px] border border-[#edf0f5] bg-[#f8fafc] p-3"
                  >
                    <header className="rounded-[18px] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">
                            {day}
                          </p>

                          <p className="mt-1 text-[10px] text-[#969da8]">
                            {dayTasks[0]?.date ??
                              "â€”"}
                          </p>
                        </div>

                        <span className="grid size-8 place-items-center rounded-full bg-[#edf5ff] text-[10px] font-bold text-[#2f80ed]">
                          {dayTasks.length}
                        </span>
                      </div>
                    </header>

                    <div className="mt-3 space-y-3">
                      {dayTasks.length === 0 ? (
                        <div className="grid min-h-44 place-items-center rounded-[18px] border border-dashed border-[#dfe4eb] bg-white/60 px-5 text-center">
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
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div
                                className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                                  task.department ===
                                  "Graphic Design"
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

                            <StatusBadge
                              status={task.status}
                            />
                          </div>

                          <h3 className="mt-4 text-sm font-bold leading-5">
                            {task.title}
                          </h3>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {task.platforms.map(
                              (platform) => (
                                <span
                                  key={platform}
                                  className="rounded-full border border-[#e8ecf2] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#69717d]"
                                >
                                  {platform}
                                </span>
                              ),
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-[#6f7682]">
                              <Clock3 size={12} />

                              <span className="font-bold">
                                {task.deadline}
                              </span>
                            </div>

                            <a
                              href={`/tasks?task=${task.id}`}
                              className="grid size-8 place-items-center rounded-full border border-[#e7ebf0] text-[#2f80ed]"
                              aria-label={`Open ${task.title}`}
                            >
                              <ExternalLink
                                size={13}
                              />
                            </a>
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

                          {task.submissionLink ||
                          task.publishedLink ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {task.submissionLink ? (
                                <a
                                  href={
                                    task.submissionLink
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#2f80ed]"
                                >
                                  <Link2 size={12} />
                                  Submission
                                </a>
                              ) : null}

                              {task.publishedLink ? (
                                <a
                                  href={
                                    task.publishedLink
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600"
                                >
                                  <ExternalLink
                                    size={12}
                                  />
                                  Published
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-5 rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_12px_35px_rgba(24,39,75,0.035)]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold">
                  Weekly completion
                </p>

                <p className="mt-1 text-xs text-[#9299a4]">
                  {stats.completed} of {stats.total}{" "}
                  scheduled tasks completed
                </p>
              </div>

              <p className="text-2xl font-bold tracking-[-0.04em] text-[#2f80ed]">
                {stats.percentage}%
              </p>
            </div>

            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#edf1f6]">
              <div
                className="h-full rounded-full bg-brand-blue-gradient transition-all duration-500"
                style={{
                  width: `${stats.percentage}%`,
                }}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

