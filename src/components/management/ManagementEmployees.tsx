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

type Role = "Graphic Designer" | "Video Editor";
type Status = "Active" | "Inactive";
type WorkloadStatus = "On Track" | "Review Pending" | "Delayed";

type Member = {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: Status;
  active: number;
  completed: number;
  progress: number;
  workloadStatus: WorkloadStatus;
  weekly: number[];
};

type Draft = Pick<Member, "name" | "email" | "role" | "status">;

const initialMembers: Member[] = [
  {
    id: 1,
    name: "Abdullah Naeem",
    email: "abdullah@example.com",
    role: "Graphic Designer",
    status: "Active",
    active: 4,
    completed: 8,
    progress: 67,
    workloadStatus: "On Track",
    weekly: [45, 72, 58, 86, 67],
  },
  {
    id: 2,
    name: "Ali Raza",
    email: "ali@example.com",
    role: "Graphic Designer",
    status: "Active",
    active: 3,
    completed: 9,
    progress: 75,
    workloadStatus: "Review Pending",
    weekly: [62, 78, 70, 88, 75],
  },
  {
    id: 3,
    name: "Hamza Khan",
    email: "hamza@example.com",
    role: "Video Editor",
    status: "Active",
    active: 4,
    completed: 6,
    progress: 60,
    workloadStatus: "Delayed",
    weekly: [38, 64, 52, 71, 60],
  },
  {
    id: 4,
    name: "Usman Ali",
    email: "usman@example.com",
    role: "Video Editor",
    status: "Active",
    active: 3,
    completed: 7,
    progress: 70,
    workloadStatus: "On Track",
    weekly: [54, 68, 76, 64, 70],
  },
];

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

export default function ManagementEmployees() {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
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

  function addEmployee() {
    if (!draft.name.trim() || !draft.email.trim()) {
      return;
    }

    setMembers((current) => [
      ...current,
      {
        id: Date.now(),
        ...draft,
        name: draft.name.trim(),
        email: draft.email.trim(),
        active: 0,
        completed: 0,
        progress: 0,
        workloadStatus: "On Track",
        weekly: [0, 0, 0, 0, 0],
      },
    ]);
    setIsAdding(false);
  }

  function openEmployee(memberId: number) {
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

  function saveEmployee() {
    if (!selected || !draft.name.trim() || !draft.email.trim()) {
      return;
    }

    setMembers((current) =>
      current.map((member) =>
        member.id === selected.id
          ? {
              ...member,
              ...draft,
              name: draft.name.trim(),
              email: draft.email.trim(),
            }
          : member,
      ),
    );
    setIsEditing(false);
  }

  function deleteEmployee() {
    if (!selected) {
      return;
    }

    setMembers((current) =>
      current.filter((member) => member.id !== selected.id),
    );
    closeEmployee();
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
