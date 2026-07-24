"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleAlert, Clock3, ExternalLink, ListChecks, Plus, Send, Users, X } from "lucide-react";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import WeeklyProgressMeter from "@/components/dashboard/WeeklyProgressMeter";
import type { EmployeeProfile } from "@/types/auth";

const metrics = [
  { label: "Active Tasks", value: "14", caption: "Across both departments", icon: ListChecks, featured: true },
  { label: "Pending Reviews", value: "4", caption: "Awaiting feedback", icon: Clock3, tone: "bg-amber-50 text-amber-600" },
  { label: "Delayed Tasks", value: "2", caption: "Reasons recorded", icon: CircleAlert, tone: "bg-red-50 text-red-600" },
  { label: "Team Members", value: "4", caption: "Design and video team", icon: Users, tone: "bg-violet-50 text-violet-600" },
];

const team = [
  { name: "Abdullah Naeem", role: "Graphic Designer", active: 4, completed: 8, progress: 67, status: "On Track", weekly: [45, 72, 58, 86, 67] },
  { name: "Ali Raza", role: "Graphic Designer", active: 3, completed: 9, progress: 75, status: "Review Pending", weekly: [62, 78, 70, 88, 75] },
  { name: "Hamza Khan", role: "Video Editor", active: 4, completed: 6, progress: 60, status: "Delayed", weekly: [38, 64, 52, 71, 60] },
  { name: "Usman Ali", role: "Video Editor", active: 3, completed: 7, progress: 70, status: "On Track", weekly: [54, 68, 76, 64, 70] },
];

const workloadStatusStyles: Record<string, string> = {
  "On Track": "bg-emerald-50 text-emerald-700",
  "Review Pending": "bg-amber-50 text-amber-700",
  Delayed: "bg-red-50 text-red-700",
};

const reviews = [
  { title: "Payroll Automation Post", brand: "Softech", assignee: "Ali Raza", type: "Design" },
  { title: "Business Automation Reel", brand: "Softech", assignee: "Hamza Khan", type: "Video" },
  { title: "AI Campaign Planner Carousel", brand: "Softgenie", assignee: "Abdullah Naeem", type: "Design" },
];

export default function ManagementDashboard({ profile }: { profile: EmployeeProfile }) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [selectedEmployee, setSelectedEmployee] =
    useState<(typeof team)[number] | null>(null);
  const [drawerAnimationProgress, setDrawerAnimationProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 1250;
    const timer = window.setTimeout(() => {
      const startedAt = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        setAnimationProgress(1 - Math.pow(1 - progress, 3));

        if (progress < 1) frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);
    }, 180);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);
  // Drawer chart animation
  useEffect(() => {
    if (!selectedEmployee) {
      requestAnimationFrame(() => setDrawerAnimationProgress(0));
      return;
    }

    let frame = 0;
    requestAnimationFrame(() => setDrawerAnimationProgress(0));

    const timer = window.setTimeout(() => {
      const startedAt = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / 1250, 1);
        setDrawerAnimationProgress(1 - Math.pow(1 - progress, 3));

        if (progress < 1) {
          frame = requestAnimationFrame(animate);
        }
      };

      frame = requestAnimationFrame(animate);
    }, 180);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [selectedEmployee]);
  const firstName = profile.full_name.trim().split(/\s+/)[0] || "Team";
  const roleLabel = profile.role === "hr" ? "HR" : "Manager";
  const description = profile.role === "hr"
    ? "Manage employees, task assignments and team delivery from one workspace."
    : "Manage team workload, task assignments and submission reviews from one workspace.";

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader variant="management" workspaceLabel="Management workspace" />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">{roleLabel} workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Good afternoon, {firstName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">{description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/employees" className="flex items-center gap-2 rounded-full border border-[#e5e9ef] bg-white px-5 py-2.5 text-sm font-semibold text-[#424852]">
                <Users size={16} /> Employees
              </Link>
              <Link href="/planner" className="flex items-center gap-2 rounded-full bg-brand-blue-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200">
                <Plus size={16} /> Add Task
              </Link>
            </div>
          </section>

          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, caption, icon: Icon, featured, tone }) => (
              <article key={label} className={`kpi-card-hover rounded-[22px] p-5 ${featured ? "bg-brand-blue-gradient text-white shadow-[0_18px_40px_rgba(47,128,237,0.20)]" : "border border-[#edf0f5] bg-white"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm ${featured ? "text-white/75" : "text-[#7d8490]"}`}>{label}</p>
                    <p className="mt-3 text-3xl font-semibold">{value}</p>
                    <p className={`mt-3 text-xs ${featured ? "text-white/70" : "text-[#959ca7]"}`}>{caption}</p>
                  </div>
                  <div className={`grid size-11 place-items-center rounded-full ${featured ? "bg-white text-[#2f80ed]" : tone}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.8fr)]">
            <article className="overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white shadow-[0_15px_42px_rgba(24,39,75,0.04)]">
              <div className="flex items-center justify-between border-b border-[#f0f2f5] p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-bold">Team Workload</h2>
                  <p className="mt-1 text-xs text-[#9299a4]">Current workload and weekly completion</p>
                </div>
                <Link href="/employees" className="flex items-center gap-2 text-xs font-bold text-[#2f80ed]">View Employees <ExternalLink size={14} /></Link>
              </div>

              <div className="dashboard-scrollbar overflow-x-auto">
                <table className="app-table w-full min-w-[720px] text-left">
                  <thead className="bg-[#fafbfc] text-[10px] uppercase tracking-[0.08em] text-[#949ba6]">
                    <tr><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Active</th><th className="px-6 py-4">Completed</th><th className="px-6 py-4">Weekly Progress</th><th className="px-6 py-4"><div className="text-left">Workload Status</div></th></tr>
                  </thead>
                  <tbody>
                    {team.map((member) => (
                      <tr
  key={member.name}
  onClick={() => setSelectedEmployee(member)}
  className="cursor-pointer border-t border-[#f0f2f5] transition hover:bg-[#fafcff]"
>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold">{member.name}</p>
                          <p className="mt-1 text-[10px] text-[#9299a4]">{member.role}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">{member.active}</td>
                        <td className="px-6 py-4 text-sm font-semibold">{member.completed}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-[#edf1f6]"><div className="h-full rounded-full bg-brand-blue-gradient" style={{ width: `${member.progress * animationProgress}%` }} /></div>
                            <span className="text-xs font-bold text-[#2f80ed]">{member.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-left">
                            <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${workloadStatusStyles[member.status]}`}>
                              {member.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-bold">Review Queue</h2>
      <p className="mt-1 text-xs text-[#9299a4]">
        Submissions waiting for review
      </p>
    </div>

    <div className="grid size-10 place-items-center rounded-full bg-amber-50 text-amber-600">
      <Send size={18} />
    </div>
  </div>

  <div className="mt-5 space-y-3">
    {reviews.map((review) => (
      <Link
        key={review.title}
        href="/submissions"
        className="flex min-h-[62px] items-center justify-between gap-3 rounded-[18px] border border-[#edf0f5] p-4 transition hover:border-[#cfd8e5]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">
            {review.title}
          </p>

          <p className="mt-1 truncate text-[10px] text-[#9299a4]">
            {review.brand} - {review.assignee}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#f5f7fa] px-3 py-1.5 text-[9px] font-bold text-[#626a75]">
          {review.type}
        </span>
      </Link>
    ))}
  </div>

  <Link
    href="/submissions"
    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#e5e9ef] px-5 py-3 text-xs font-bold text-[#4f5762]"
  >
    Open Submissions
    <ExternalLink size={14} />
  </Link>
</article>
          </section>
        </div>
      </section>

      {selectedEmployee ? (
        <>
          <button
            type="button"
            aria-label="Close employee details"
            onClick={() => setSelectedEmployee(null)}
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
          />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="flex items-center justify-between border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">
                  {selectedEmployee.role}
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Employee Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid size-16 place-items-center rounded-full bg-blue-50 text-xl font-bold text-blue-600">
                {selectedEmployee.name
                  .split(/\s+/)
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div>
                <h3 className="text-2xl font-bold">
                  {selectedEmployee.name}
                </h3>
                <p className="mt-1 text-sm text-[#777e89]">
                  {selectedEmployee.role}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[9px] font-bold uppercase text-[#969da8]">
                    Active Tasks
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {selectedEmployee.active}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[9px] font-bold uppercase text-[#969da8]">
                    Completed
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {selectedEmployee.completed}
                  </p>
                </div>
              </div>

              <section className="rounded-[20px] border border-[#edf0f5] p-5">
                <div>
                  <p className="text-sm font-bold">Weekly Activity</p>
                  <p className="mt-1 text-xs text-[#9299a4]">
                    Monday to Friday task completion
                  </p>
                </div>

                <div className="mt-5 flex h-44 items-end justify-between gap-3">
                  {selectedEmployee.weekly.map((value, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[9px] font-bold text-[#2f80ed]">
                        {Math.round(value * drawerAnimationProgress)}%
                      </span>

                      <div className="flex h-32 w-full max-w-9 items-end overflow-hidden rounded-lg bg-[#edf1f6]">
                        <div
                          className="w-full rounded-lg bg-brand-blue-gradient"
                          style={{
                            height: `${value * drawerAnimationProgress}%`,
                          }}
                        />
                      </div>

                      <span className="text-[9px] font-semibold text-[#9299a4]">
                        {["Mon", "Tue", "Wed", "Thu", "Fri"][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[20px] border border-[#edf0f5] p-5">
  <div>
    <p className="text-sm font-bold">Weekly Progress</p>
    <p className="mt-1 text-xs text-[#9299a4]">
      Overall task completion
    </p>
  </div>

  <WeeklyProgressMeter
    percentage={selectedEmployee.progress}
    progress={drawerAnimationProgress}
    completed={selectedEmployee.completed}
    total={
      selectedEmployee.completed +
      selectedEmployee.active
    }
  />

  <div className="grid grid-cols-2 gap-3">
    <div className="rounded-2xl bg-[#f7f9fc] p-4">
      <p className="text-xs text-[#8a919c]">
        Completed
      </p>

      <p className="mt-2 text-xl font-bold">
        {selectedEmployee.completed}
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
        {selectedEmployee.active}
        <span className="ml-1 text-xs font-medium text-[#9299a4]">
          tasks
        </span>
      </p>
    </div>
  </div>
</section>

              <div className="rounded-[20px] border border-[#edf0f5] p-5">
                <p className="text-xs font-bold text-[#4e5661]">
                  Workload Status
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${
                    workloadStatusStyles[selectedEmployee.status]
                  }`}
                >
                  {selectedEmployee.status}
                </span>
              </div>
            </div>
          </aside>
        </>
      ) : null}
</main>
  );
}