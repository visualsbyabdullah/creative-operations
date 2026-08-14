"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, Layers, Plus, Search, Users, X } from "lucide-react";

import SystemTable from "@frontend/components/ui/SystemTable";

import DepartmentDetailsDrawer from "@frontend/components/management/DepartmentDetailsDrawer";
import ManagementShell from "@frontend/components/management/ManagementShell";
import {
  createDepartmentAction,
  setDepartmentArchivedAction,
  updateDepartmentAction,
} from "@frontend/app/employees/department-actions";
import type { DepartmentView } from "@shared/contracts/department-types";

type DepartmentStatus = "Active" | "Archived";

type DisplayDepartment = {
  id: string;
  name: string;
  initials: string;
  status: DepartmentStatus;
  backendStatus: DepartmentView["status"];
  accent: string;
  description: string | null;
  memberCount: number;
  updatedAt: string;
};

function toDisplayDepartment(department: DepartmentView): DisplayDepartment {
  return {
    id: department.id,
    name: department.name,
    initials: department.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    status: department.status === "active" ? "Active" : "Archived",
    backendStatus: department.status,
    accent: department.accentColor ?? "#2f80ed",
    description: department.description,
    memberCount: department.memberCount,
    updatedAt: department.updatedAt,
  };
}

const emptyForm = { name: "", description: "", accent: "#2f80ed" };

function DepartmentStatusBadge({ status }: { status: DepartmentStatus }) {
  const className = status === "Active"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${className}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "Active" ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {status}
    </span>
  );
}

export default function DepartmentsManagement({
  initialDepartments,
}: {
  initialDepartments: DepartmentView[];
}) {
  const [departments] = useState<DisplayDepartment[]>(
    initialDepartments.map(toDisplayDepartment),
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const selected =
    departments.find((department) => department.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return departments.filter((department) =>
      `${department.name} ${department.description ?? ""} ${department.status}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [departments, query]);

  function openAdd() {
    setForm(emptyForm);
    setFormMessage(null);
    setIsModalOpen(true);
  }

  function openDepartment(departmentId: string) {
    setSelectedId(departmentId);
    setIsEditing(false);
  }

  function closeDepartment() {
    setSelectedId(null);
    setIsEditing(false);
  }

  function startEdit() {
    if (!selected) {
      return;
    }

    setForm({
      name: selected.name,
      description: selected.description ?? "",
      accent: selected.accent,
    });
    setFormMessage(null);
    setIsEditing(true);
  }

  function saveDepartment() {
    if (!form.name.trim() || isPending) return;

    setFormMessage(null);
    startTransition(async () => {
      const result = selected && isEditing
        ? await updateDepartmentAction({
            departmentId: selected.id,
            name: form.name,
            description: form.description || null,
            accentColor: form.accent,
            expectedUpdatedAt: selected.updatedAt,
          })
        : await createDepartmentAction({
            name: form.name,
            description: form.description || null,
            accentColor: form.accent,
          });
      if (!result.ok) {
        setFormMessage(
          result.code === "rate_limited"
            ? "Too many department changes. Please try again later."
            : result.code === "stale_update"
              ? "This department changed in another session. Refresh before trying again."
              : "The department could not be saved. Check the fields and try again.",
        );
        return;
      }
      setIsModalOpen(false);
      setIsEditing(false);
      window.location.reload();
    });
  }

  function toggleArchive() {
    if (!selected || isPending) return;
    const archiving = selected.backendStatus !== "archived";
    if (archiving &&
      !window.confirm(`Archive ${selected.name}? Historical member counts are preserved.`)) {
      return;
    }
    setFormMessage(null);
    startTransition(async () => {
      const result = await setDepartmentArchivedAction({
        departmentId: selected.id,
        archived: archiving,
        expectedUpdatedAt: selected.updatedAt,
      });
      if (!result.ok) {
        setFormMessage(
          result.code === "stale_update"
            ? "This department changed in another session. Refresh before trying again."
            : "The department status could not be updated.",
        );
        return;
      }
      window.location.reload();
    });
  }

  function formFields() {
    return (
      <>
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-[#4d5560]">
            Department name
          </span>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className="mt-2 w-full rounded-2xl border border-[#e5e9ef] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-[#4d5560]">
            Description
          </span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="mt-2 w-full resize-none rounded-2xl border border-[#e5e9ef] p-4 text-sm leading-6 outline-none focus:border-[#2f80ed]"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-[#4d5560]">
            Department accent colour
          </span>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] p-3">
            <input
              type="color"
              value={form.accent}
              onChange={(event) =>
                setForm((current) => ({ ...current, accent: event.target.value }))
              }
              className="size-10 cursor-pointer rounded-xl border-0 bg-transparent p-0"
            />
            <input
              value={form.accent}
              onChange={(event) =>
                setForm((current) => ({ ...current, accent: event.target.value }))
              }
              className="flex-1 bg-transparent text-sm font-semibold outline-none"
            />
          </div>
        </label>
      </>
    );
  }

  return (
    <ManagementShell>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#2f80ed]">
            Team structure
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Departments
          </h1>
          <p className="mt-2 text-sm text-[#777e89]">
            Organize the team by department. Members are assigned by role.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-brand-blue-gradient px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Plus size={16} />
          Add Department
        </button>
      </section>

      <section className="page-section-gap overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f5] p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Department Directory</h2>
            <p className="mt-1 text-xs text-[#9299a4]">
              {filtered.length} departments
            </p>
          </div>

          <label className="flex h-11 items-center gap-2 rounded-full bg-[#f5f7fa] px-4">
            <Search size={15} className="text-[#858c97]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search departments..."
              className="bg-transparent text-xs outline-none"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="grid min-h-56 place-items-center p-8 text-center">
            <div>
              <Layers size={28} className="mx-auto text-[#adb4bf]" />
              <p className="mt-3 text-sm font-bold">
                {query ? "No matching departments" : "No departments yet"}
              </p>
              <p className="mt-1 text-xs text-[#9299a4]">
                {query
                  ? "Try a different search term."
                  : "Create the first department to start organizing the team."}
              </p>
            </div>
          </div>
        ) : (
          <div className="dashboard-scrollbar overflow-x-auto">
            <SystemTable columns={4} minWidth={860} cellWidth={170}>
              <thead className="bg-[#fafbfc] text-[10px] uppercase tracking-[0.08em] text-[#949ba6]">
                <tr>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Members</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((department) => (
                  <tr
                    key={department.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${department.name} details`}
                    onClick={() => openDepartment(department.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDepartment(department.id);
                      }
                    }}
                    className="cursor-pointer border-t border-[#f0f2f5] transition hover:bg-[#fafcff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f80ed]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: department.accent }}
                        >
                          {department.initials}
                        </div>

                        <div>
                          <p className="text-sm font-bold">{department.name}</p>
                          <p className="mt-1 max-w-52 truncate text-[10px] text-[#9299a4]">
                            {department.description ?? "No description yet"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <Users size={13} className="text-[#8a919c]" />
                        {department.memberCount}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <DepartmentStatusBadge status={department.status} />
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDepartment(department.id);
                        }}
                        aria-label={`Open ${department.name} details`}
                        className="flex items-center gap-2 rounded-full border border-[#e8ecf2] px-4 py-2 text-[11px] font-bold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </SystemTable>
          </div>
        )}
      </section>

      {formMessage ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {formMessage}
        </p>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="dashboard-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <header className="flex items-center justify-between border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">Add Department</h2>
                <p className="mt-1 text-xs text-[#8b929d]">
                  Create a new department for the workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-[#f5f7fa]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              {formFields()}
            </div>

            <footer className="flex justify-end gap-3 border-t border-[#edf0f5] p-5 sm:p-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-[#e5e9ef] px-5 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDepartment}
                disabled={!form.name.trim() || isPending}
                className="rounded-full bg-[#2f80ed] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add Department
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      <DepartmentDetailsDrawer
        department={selected}
        onClose={closeDepartment}
        isEditing={isEditing}
        editContent={<div className="space-y-5">{formFields()}</div>}
        onEdit={startEdit}
        onSave={saveDepartment}
        onArchive={toggleArchive}
      />
    </ManagementShell>
  );
}