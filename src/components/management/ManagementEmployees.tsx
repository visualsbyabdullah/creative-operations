"use client";

import { MoreHorizontal, Pencil, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";

import ManagementShell from "./ManagementShell";
import PillSelect from "@/components/ui/PillSelect";

type Role = "Graphic Designer" | "Video Editor";
type Status = "Active" | "Inactive";
type Member = { id: number; name: string; email: string; role: Role; status: Status };
type Draft = Pick<Member, "name" | "email" | "role" | "status">;

const initialMembers: Member[] = [
  { id: 1, name: "Abdullah Naeem", email: "abdullah@example.com", role: "Graphic Designer", status: "Active" },
  { id: 2, name: "Ali Raza", email: "ali@example.com", role: "Graphic Designer", status: "Active" },
  { id: 3, name: "Hamza Khan", email: "hamza@example.com", role: "Video Editor", status: "Active" },
  { id: 4, name: "Usman Ali", email: "usman@example.com", role: "Video Editor", status: "Active" },
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

  const selected = members.find((member) => member.id === selectedId) ?? null;
  const filtered = useMemo(
    () => members.filter((member) => `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(query.trim().toLowerCase())),
    [members, query],
  );

  function openAdd() {
    setDraft(emptyDraft);
    setIsAdding(true);
  }

  function addEmployee() {
    if (!draft.name.trim() || !draft.email.trim()) return;
    setMembers((current) => [...current, { id: Date.now(), ...draft, name: draft.name.trim(), email: draft.email.trim() }]);
    setIsAdding(false);
  }

  function startEdit() {
    if (!selected) return;
    setDraft({ name: selected.name, email: selected.email, role: selected.role, status: selected.status });
    setIsEditing(true);
  }

  function saveEmployee() {
    if (!selected || !draft.name.trim() || !draft.email.trim()) return;
    setMembers((current) =>
      current.map((member) =>
        member.id === selected.id ? { ...member, ...draft, name: draft.name.trim(), email: draft.email.trim() } : member,
      ),
    );
    setIsEditing(false);
  }

  function deleteEmployee() {
    if (!selected) return;
    setMembers((current) => current.filter((member) => member.id !== selected.id));
    setSelectedId(null);
    setIsEditing(false);
  }

  const fields = (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-bold text-[#4d5560]">Full name</span>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none focus:border-[#2f80ed]" />
      </label>

      <label className="block">
        <span className="text-xs font-bold text-[#4d5560]">Email</span>
        <input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none focus:border-[#2f80ed]" />
      </label>

      <label className="block">
        <span className="text-xs font-bold text-[#4d5560]">Role</span>
        <PillSelect<Role> value={draft.role} options={roleOptions} onValueChange={(role) => setDraft({ ...draft, role })} ariaLabel="Select employee role" variant="field" fullWidth />
      </label>

      <label className="block">
        <span className="text-xs font-bold text-[#4d5560]">Status</span>
        <PillSelect<Status> value={draft.status} options={statusOptions} onValueChange={(status) => setDraft({ ...draft, status })} ariaLabel="Select employee status" variant="field" fullWidth />
      </label>
    </div>
  );

  return (
    <ManagementShell>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#2f80ed]">Team management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Employees</h1>
          <p className="mt-2 text-sm text-[#777e89]">Manage Graphic Designers and Video Editors.</p>
        </div>

        <button type="button" onClick={openAdd} className="flex items-center gap-2 rounded-full bg-brand-blue-gradient px-5 py-2.5 text-sm font-semibold text-white">
          <Plus size={16} />
          Add Employee
        </button>
      </section>

      <section className="page-section-gap overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f5] p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Employee Directory</h2>
            <p className="mt-1 text-xs text-[#9299a4]">{filtered.length} employees</p>
          </div>

          <label className="flex h-11 items-center gap-2 rounded-full bg-[#f5f7fa] px-4">
            <Search size={15} className="text-[#858c97]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees..." className="bg-transparent text-xs outline-none" />
          </label>
        </div>

        <div className="dashboard-scrollbar overflow-x-auto">
          <table className="app-table w-full min-w-[860px] text-left">
            <thead className="bg-[#fafbfc] text-[10px] uppercase tracking-[0.08em] text-[#949ba6]">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-t border-[#f0f2f5]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`grid size-10 place-items-center rounded-full ${member.role === "Graphic Designer" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                        <UserRound size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{member.name}</p>
                        <p className="mt-1 text-[10px] text-[#9299a4]">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold">{member.role}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${member.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {member.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button type="button" onClick={() => { setSelectedId(member.id); setIsEditing(false); }} aria-label={`Open ${member.name} actions`} className="ml-auto grid size-9 place-items-center rounded-full border border-[#e8ecf2] transition hover:border-[#2f80ed] hover:text-[#2f80ed]">
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAdding ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[26px] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Employee</h2>
              <button type="button" onClick={() => setIsAdding(false)} className="grid size-10 place-items-center rounded-full bg-[#f5f7fa]"><X size={18} /></button>
            </div>

            <div className="mt-5">{fields}</div>
            <button type="button" onClick={addEmployee} disabled={!draft.name.trim() || !draft.email.trim()} className="mt-5 w-full rounded-full bg-brand-blue-gradient px-5 py-3 text-sm font-bold text-white disabled:opacity-40">
              Add Employee
            </button>
          </div>
        </div>
      ) : null}

      {selected ? (
        <>
          <button type="button" aria-label="Close employee details" onClick={() => setSelectedId(null)} className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]" />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[500px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="sticky top-0 flex items-center justify-between border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">{selected.role}</p>
                <h2 className="mt-1 text-xl font-bold">Employee Details</h2>
              </div>

              <button type="button" onClick={() => setSelectedId(null)} className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]">
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 p-5 sm:p-6">
              {isEditing ? fields : (
                <>
                  <div className={`grid size-16 place-items-center rounded-full ${selected.role === "Graphic Designer" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                    <UserRound size={25} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold">{selected.name}</h3>
                    <p className="mt-1 text-sm text-[#777e89]">{selected.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#f7f9fc] p-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#969da8]">Role</p>
                      <p className="mt-2 text-sm font-bold">{selected.role}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f7f9fc] p-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#969da8]">Status</p>
                      <p className="mt-2 text-sm font-bold">{selected.status}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={isEditing ? saveEmployee : startEdit} className="flex items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-xs font-bold text-white">
                  <Pencil size={14} />
                  {isEditing ? "Save Changes" : "Edit Employee"}
                </button>

                <button type="button" onClick={deleteEmployee} className="flex items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-3 text-xs font-bold text-red-600">
                  <Trash2 size={14} />
                  Delete Employee
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </ManagementShell>
  );
}