"use client";

import { Archive, ArchiveRestore, Pencil, Users, X } from "lucide-react";
import type { ReactNode } from "react";

export type DepartmentDrawerData = {
  id: string;
  name: string;
  initials: string;
  accent: string;
  description: string | null;
  memberCount: number;
  status: "Active" | "Archived";
  updatedAt: string;
};

type DepartmentDetailsDrawerProps = {
  department: DepartmentDrawerData | null;
  onClose: () => void;
  isEditing?: boolean;
  editContent?: ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onArchive?: () => void;
};

export default function DepartmentDetailsDrawer({
  department,
  onClose,
  isEditing = false,
  editContent,
  onEdit,
  onSave,
  onArchive,
}: DepartmentDetailsDrawerProps) {
  if (!department) return null;

  const hasActions = Boolean(onEdit || onSave || onArchive);
  const isArchived = department.status === "Archived";

  return (
    <>
      <button
        type="button"
        aria-label="Close department details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
      />

      <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
          <div>
            <p className="text-xs font-bold text-[#2f80ed]">Team structure</p>
            <h2 className="mt-1 text-xl font-bold">Department Details</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close department details"
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
                className="grid size-16 place-items-center rounded-2xl text-xl font-bold text-white"
                style={{ backgroundColor: department.accent }}
              >
                {department.initials}
              </div>

              <div>
                <h3 className="text-2xl font-bold">{department.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[#777e89]">
                  <Users size={14} />
                  {department.memberCount}{" "}
                  {department.memberCount === 1 ? "member" : "members"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                    isArchived
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isArchived ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                  {department.status}
                </span>
              </div>

              <div className="rounded-[20px] border border-[#edf0f5] p-5">
                <p className="text-xs font-bold text-[#4e5661]">
                  Description
                </p>
                <p className="mt-3 text-sm leading-6 text-[#626b77]">
                  {department.description ??
                    "Department description has not been added yet."}
                </p>
              </div>

              <div className="rounded-[20px] border border-[#edf0f5] p-5">
                <p className="text-xs font-bold text-[#4e5661]">
                  Last updated
                </p>
                <p className="mt-2 text-sm font-bold">
                  {new Date(department.updatedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
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
                  {isEditing ? "Save Changes" : "Edit Department"}
                </button>
              ) : null}

              {onArchive ? (
                <button
                  type="button"
                  onClick={onArchive}
                  className="flex items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-3 text-xs font-bold text-red-600"
                >
                  {isArchived ? (
                    <>
                      <ArchiveRestore size={14} />
                      Activate Department
                    </>
                  ) : (
                    <>
                      <Archive size={14} />
                      Archive Department
                    </>
                  )}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}