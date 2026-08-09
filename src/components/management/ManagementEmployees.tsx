"use client";

import SystemTable from "@/components/ui/SystemTable";

import {
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import EmployeeDetailsDrawer from "@/components/management/EmployeeDetailsDrawer";
import ManagementShell from "@/components/management/ManagementShell";
import PillSelect from "@/components/ui/PillSelect";
import type { EmployeeDirectoryRow } from "@/lib/employees/employee-types";
import {
  getEmployeeDetailAction,
  updateManagedEmployeeAction,
} from "@/app/employees/actions";
import { inviteEmployeeAction } from "@/app/employees/invite-actions";

type Role = "Graphic Designer" | "Video Editor";
type Status = "Active" | "Inactive";
type WorkloadStatus = "On Track" | "Review Pending" | "Delayed";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  active: number;
  completed: number;
  progress: number;
  workloadStatus: WorkloadStatus;
  weekly: number[];
  updatedAt: string;
  department: "graphic_design" | "video_editing" | null;
};

type Draft = Pick<Member, "name" | "email" | "role" | "status">;

const roleOptions = [
  { label: "Graphic Designer", value: "Graphic Designer" },
  { label: "Video Editor", value: "Video Editor" },
] satisfies { label: string; value: Role }[];

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
] satisfies { label: string; value: Status }[];

const emptyDraft: Draft = {
  name: "",
  email: "",
  role: "Graphic Designer",
  status: "Active",
};

function roleLabel(role: EmployeeDirectoryRow["role"]): Role {
  return role === "graphic_designer" ? "Graphic Designer"
    : "Video Editor";
}

function mapRow(row: EmployeeDirectoryRow): Member {
  return {
    id: row.id,
    name: row.fullName,
    email: row.email,
    role: roleLabel(row.role),
    status: row.isActive ? "Active" : "Inactive",
    active: row.activeTaskCount,
    completed: row.completedTaskCount,
    progress: row.progressPercent ?? 0,
    workloadStatus: row.workloadStatus,
    weekly: [],
    updatedAt: row.updatedAt,
    department: row.department,
  };
}

export default function ManagementEmployees({
  initialRows,
}: {
  initialRows: EmployeeDirectoryRow[];
}) {
  const [members, setMembers] = useState(() => initialRows.map(mapRow));
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const selected =
    members.find((member) => member.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return members.filter((member) =>
      `${member.name} ${member.email} ${member.role}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [members, query]);

  function openAdd() {
    setDraft(emptyDraft);
    setIsAdding(true);
  }

  async function addEmployee() {
    if (!draft.name.trim() || !draft.email.trim()) {
      return;
    }

    const role = draft.role === "Graphic Designer" ? "graphic_designer"
      : "video_editor";
    const department = role === "graphic_designer" ? "graphic_design"
      : role === "video_editor" ? "video_editing" : null;
    const result = await inviteEmployeeAction({
      email: draft.email,
      fullName: draft.name,
      role,
      department,
      managerId: null,
    });
    if (result.ok) setIsAdding(false);
  }

  function openEmployee(memberId: string) {
    setSelectedId(memberId);
    setIsEditing(false);
  }

  function closeEmployee() {
    setSelectedId(null);
    setIsEditing(false);
  }

  function startEdit() {
    if (!selected) {
      return;
    }

    setDraft({
      name: selected.name,
      email: selected.email,
      role: selected.role,
      status: selected.status,
    });
    setIsEditing(true);
  }

  async function saveEmployee() {
    if (!selected || !draft.name.trim() || !draft.email.trim()) {
      return;
    }

    const detail = await getEmployeeDetailAction({ profileId: selected.id });
    if (!detail.ok) return;
    const role = draft.role === "Graphic Designer" ? "graphic_designer"
      : "video_editor";
    const department = role === "graphic_designer" ? "graphic_design"
      : role === "video_editor" ? "video_editing" : null;
    const result = await updateManagedEmployeeAction({
      profileId: detail.data.id,
      fullName: draft.name,
      avatarUrl: detail.data.avatarUrl,
      phone: detail.data.phone,
      timezone: detail.data.timezone,
      role,
      department,
      isActive: draft.status === "Active",
      managerId: detail.data.managerId,
      expectedUpdatedAt: detail.data.updatedAt,
    });
    if (result.ok) {
      setMembers((current) => current.map((member) =>
        member.id === selected.id ? mapRow(result.data) : member));
      setIsEditing(false);
    }
  }

  async function deleteEmployee() {
    if (!selected) {
      return;
    }

    const detail = await getEmployeeDetailAction({ profileId: selected.id });
    if (!detail.ok) return;
    const result = await updateManagedEmployeeAction({
      profileId: detail.data.id,
      fullName: detail.data.fullName,
      avatarUrl: detail.data.avatarUrl,
      phone: detail.data.phone,
      timezone: detail.data.timezone,
      role: detail.data.role,
      department: detail.data.department,
      isActive: false,
      managerId: detail.data.managerId,
      expectedUpdatedAt: detail.data.updatedAt,
    });
    if (result.ok) {
      setMembers((current) => current.map((member) =>
        member.id === selected.id ? mapRow(result.data) : member));
      closeEmployee();
    }
  }

  const fields = (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-bold text-[#4d5560]">Full name</span>
        <input
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none focus:border-[#2f80ed]"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold text-[#4d5560]">Email</span>
        <input
          type="email"
          value={draft.email}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none focus:border-[#2f80ed]"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold text-[#4d5560]">Role</span>
        <PillSelect<Role>
          value={draft.role}
          options={roleOptions}
          onValueChange={(role) =>
            setDraft((current) => ({ ...current, role }))
          }
          ariaLabel="Select employee role"
          variant="field"
          fullWidth
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold text-[#4d5560]">Status</span>
        <PillSelect<Status>
          value={draft.status}
          options={statusOptions}
          onValueChange={(status) =>
            setDraft((current) => ({ ...current, status }))
          }
          ariaLabel="Select employee status"
          variant="field"
          fullWidth
        />
      </label>
    </div>
  );

  return (
    <ManagementShell>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#2f80ed]">
            Team management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Employees
          </h1>
          <p className="mt-2 text-sm text-[#777e89]">
            Manage Graphic Designers and Video Editors.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-full bg-brand-blue-gradient px-5 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Add Employee
        </button>
      </section>

      <section className="page-section-gap overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f5] p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Employee Directory</h2>
            <p className="mt-1 text-xs text-[#9299a4]">
              {filtered.length} employees
            </p>
          </div>

          <label className="flex h-11 items-center gap-2 rounded-full bg-[#f5f7fa] px-4">
            <Search size={15} className="text-[#858c97]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search employees..."
              className="bg-transparent text-xs outline-none"
            />
          </label>
        </div>

        <div className="dashboard-scrollbar overflow-x-auto">
          <SystemTable columns={4} minWidth={860} cellWidth={170}>
            <thead className="bg-[#fafbfc] text-[10px] uppercase tracking-[0.08em] text-[#949ba6]">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((member) => (
                <tr
                  key={member.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${member.name} details`}
                  onClick={() => openEmployee(member.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openEmployee(member.id);
                    }
                  }}
                  className="cursor-pointer border-t border-[#f0f2f5] transition hover:bg-[#fafcff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f80ed]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid size-10 place-items-center rounded-full ${
                          member.role === "Graphic Designer"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-violet-50 text-violet-600"
                        }`}
                      >
                        <UserRound size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-bold">{member.name}</p>
                        <p className="mt-1 text-[10px] text-[#9299a4]">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold">
                    {member.role}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                        member.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEmployee(member.id);
                      }}
                      aria-label={`Open ${member.name} details`}
                      className="grid size-9 place-items-center rounded-full border border-[#e8ecf2] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </SystemTable>
        </div>
      </section>

      {isAdding ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[26px] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Employee</h2>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="grid size-10 place-items-center rounded-full bg-[#f5f7fa]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5">{fields}</div>

            <button
              type="button"
              onClick={addEmployee}
              disabled={!draft.name.trim() || !draft.email.trim()}
              className="mt-5 w-full rounded-full bg-brand-blue-gradient px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              Add Employee
            </button>
          </div>
        </div>
      ) : null}

      <EmployeeDetailsDrawer
        employee={selected}
        onClose={closeEmployee}
        isEditing={isEditing}
        editContent={fields}
        onEdit={startEdit}
        onSave={saveEmployee}
        onDelete={deleteEmployee}
      />
    </ManagementShell>
  );
}
