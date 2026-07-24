"use client";

import { Pencil, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import WeeklyProgressMeter from "@/components/dashboard/WeeklyProgressMeter";

export type EmployeeDrawerData = {
  name: string;
  email?: string;
  role: string;
  status?: string;
  active: number;
  completed: number;
  progress: number;
  workloadStatus: "On Track" | "Review Pending" | "Delayed";
  weekly: number[];
};

type EmployeeDetailsDrawerProps = {
  employee: EmployeeDrawerData | null;
  onClose: () => void;
  isEditing?: boolean;
  editContent?: ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
};

const workloadStatusStyles: Record<
  EmployeeDrawerData["workloadStatus"],
  string
> = {
  "On Track": "bg-emerald-50 text-emerald-700",
  "Review Pending": "bg-amber-50 text-amber-700",
  Delayed: "bg-red-50 text-red-700",
};

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function EmployeeDetailsDrawer({
  employee,
  onClose,
  isEditing = false,
  editContent,
  onEdit,
  onSave,
  onDelete,
}: EmployeeDetailsDrawerProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationKey = employee
    ? `${employee.name}-${employee.progress}-${employee.completed}-${employee.active}`
    : null;

  useEffect(() => {
    if (!animationKey) {
      requestAnimationFrame(() => setAnimationProgress(0));
      return;
    }

    let frame = 0;
    requestAnimationFrame(() => setAnimationProgress(0));

    const timer = window.setTimeout(() => {
      const startedAt = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / 1250, 1);
        setAnimationProgress(1 - Math.pow(1 - progress, 3));

        if (progress < 1) frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);
    }, 180);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [animationKey]);

  if (!employee) return null;

  const hasActions = Boolean(onEdit || onSave || onDelete);

  return (
    <>
      <button
        type="button"
        aria-label="Close employee details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
      />

      <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
          <div>
            <p className="text-xs font-bold text-[#2f80ed]">
              {employee.role}
            </p>
            <h2 className="mt-1 text-xl font-bold">Employee Details</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close employee details"
            className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          {isEditing && editContent ? (
            editContent
          ) : (
            <>
              <div
                className={`grid size-16 place-items-center rounded-full text-xl font-bold ${
                  employee.role === "Graphic Designer"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-violet-50 text-violet-600"
                }`}
              >
                {employee.name
                  .split(/\s+/)
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div>
                <h3 className="text-2xl font-bold">{employee.name}</h3>
                <p className="mt-1 text-sm text-[#777e89]">
                  {employee.email ?? employee.role}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[9px] font-bold uppercase text-[#969da8]">
                    Active Tasks
                  </p>
                  <p className="mt-2 text-2xl font-bold">{employee.active}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[9px] font-bold uppercase text-[#969da8]">
                    Completed
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {employee.completed}
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
                  {employee.weekly.map((value, index) => (
                    <div
                      key={`${dayLabels[index] ?? index}-${value}`}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[9px] font-bold text-[#2f80ed]">
                        {Math.round(value * animationProgress)}%
                      </span>

                      <div className="flex h-32 w-full max-w-9 items-end overflow-hidden rounded-lg bg-[#edf1f6]">
                        <div
                          className="w-full rounded-lg bg-brand-blue-gradient"
                          style={{
                            height: `${value * animationProgress}%`,
                          }}
                        />
                      </div>

                      <span className="text-[9px] font-semibold text-[#9299a4]">
                        {dayLabels[index] ?? `Day ${index + 1}`}
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
                  percentage={employee.progress}
                  progress={animationProgress}
                  completed={employee.completed}
                  total={employee.completed + employee.active}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#f7f9fc] p-4">
                    <p className="text-xs text-[#8a919c]">Completed</p>
                    <p className="mt-2 text-xl font-bold">
                      {employee.completed}
                      <span className="ml-1 text-xs font-medium text-[#9299a4]">
                        tasks
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f7f9fc] p-4">
                    <p className="text-xs text-[#8a919c]">Remaining</p>
                    <p className="mt-2 text-xl font-bold">
                      {employee.active}
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
                    workloadStatusStyles[employee.workloadStatus]
                  }`}
                >
                  {employee.workloadStatus}
                </span>
              </div>

              {employee.status ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#f7f9fc] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                      Role
                    </p>
                    <p className="mt-2 text-sm font-bold">{employee.role}</p>
                  </div>

                  <div className="rounded-2xl bg-[#f7f9fc] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                      Account Status
                    </p>
                    <p className="mt-2 text-sm font-bold">
                      {employee.status}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {hasActions ? (
            <div className="grid grid-cols-2 gap-3">
              {onEdit || onSave ? (
                <button
                  type="button"
                  onClick={isEditing ? onSave : onEdit}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-xs font-bold text-white"
                >
                  <Pencil size={14} />
                  {isEditing ? "Save Changes" : "Edit Employee"}
                </button>
              ) : null}

              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-3 text-xs font-bold text-red-600"
                >
                  <Trash2 size={14} />
                  Delete Employee
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
