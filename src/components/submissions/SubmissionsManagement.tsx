"use client";

import SystemTable from "@/components/ui/SystemTable";

import { useMemo, useState } from "react";

import {
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  FileImage,
  FileText,
  Film,
  Link2,
  MessageSquareText,
  Plus,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import PillSelect from "@/components/ui/PillSelect";

import type {
  EmployeeDepartment,
} from "@/config/employee";

import { useEmployee } from "@/context/EmployeeContext";

type SubmissionStatus =
  | "Draft"
  | "Submitted"
  | "In Review"
  | "Revision Required"
  | "Approved"
  | "Published";

type SubmissionType =
  | "Design"
  | "Video";

type Submission = {
  id: number;
  taskTitle: string;
  brand: string;
  department: EmployeeDepartment;
  type: SubmissionType;
  submittedAt: string;
  status: SubmissionStatus;
  sourceLink?: string;
  finalLink: string;
  publishedLink?: string;
  feedback?: string;
  revisionNumber: number;
};

type StatusFilter =
  | "All Statuses"
  | SubmissionStatus;

type BrandFilter =
  | "All Brands"
  | string;

const statusOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All Statuses",
    value: "All Statuses",
  },
  {
    label: "Draft",
    value: "Draft",
  },
  {
    label: "Submitted",
    value: "Submitted",
  },
  {
    label: "In Review",
    value: "In Review",
  },
  {
    label: "Revision Required",
    value: "Revision Required",
  },
  {
    label: "Approved",
    value: "Approved",
  },
  {
    label: "Published",
    value: "Published",
  },
];

const statusStyles: Record<
  SubmissionStatus,
  string
> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-blue-50 text-blue-700",
  "In Review": "bg-amber-50 text-amber-700",
  "Revision Required":
    "bg-orange-50 text-orange-700",
  Approved:
    "bg-emerald-50 text-emerald-700",
  Published:
    "bg-green-50 text-green-700",
};

const initialSubmissions: Submission[] = [
  {
    id: 1,
    taskTitle:
      "AI Campaign Planner Carousel",
    brand: "Softgenie",
    department: "Graphic Design",
    type: "Design",
    submittedAt: "20 Jul 2026, 10:45 AM",
    status: "Approved",
    sourceLink:
      "https://drive.google.com/",
    finalLink:
      "https://drive.google.com/",
    revisionNumber: 1,
  },
  {
    id: 2,
    taskTitle:
      "Payroll Automation Post",
    brand: "Softech",
    department: "Graphic Design",
    type: "Design",
    submittedAt: "21 Jul 2026, 1:20 PM",
    status: "In Review",
    sourceLink:
      "https://drive.google.com/",
    finalLink:
      "https://drive.google.com/",
    revisionNumber: 1,
  },
  {
    id: 3,
    taskTitle:
      "E-Bazaar Feature Carousel",
    brand: "E-Bazaar",
    department: "Graphic Design",
    type: "Design",
    submittedAt: "19 Jul 2026, 4:10 PM",
    status: "Revision Required",
    sourceLink:
      "https://drive.google.com/",
    finalLink:
      "https://drive.google.com/",
    feedback:
      "Shorten the heading on slide two and make the CTA more prominent.",
    revisionNumber: 2,
  },
  {
    id: 4,
    taskTitle:
      "Solar Product Highlight",
    brand: "Solentrix",
    department: "Graphic Design",
    type: "Design",
    submittedAt: "18 Jul 2026, 12:30 PM",
    status: "Published",
    sourceLink:
      "https://drive.google.com/",
    finalLink:
      "https://drive.google.com/",
    publishedLink:
      "https://instagram.com/",
    revisionNumber: 1,
  },
  {
    id: 5,
    taskTitle:
      "Residential Solar Promo Reel",
    brand: "Solentrix",
    department: "Video Editing",
    type: "Video",
    submittedAt: "20 Jul 2026, 3:55 PM",
    status: "Approved",
    sourceLink:
      "https://drive.google.com/",
    finalLink:
      "https://drive.google.com/",
    revisionNumber: 1,
  },
  {
    id: 6,
    taskTitle:
      "Broadcast Overlay Demo",
    brand: "MARK47",
    department: "Video Editing",
    type: "Video",
    submittedAt: "21 Jul 2026, 2:35 PM",
    status: "In Review",
    sourceLink:
      "https://drive.google.com/",
    finalLink:
      "https://drive.google.com/",
    revisionNumber: 1,
  },
  {
    id: 7,
    taskTitle:
      "Business Automation Reel",
    brand: "Softech",
    department: "Video Editing",
    type: "Video",
    submittedAt: "19 Jul 2026, 5:15 PM",
    status: "Revision Required",
    sourceLink:
      "https://drive.google.com/",
    finalLink:
      "https://drive.google.com/",
    feedback:
      "Make the opening three seconds faster and increase the caption size.",
    revisionNumber: 2,
  },
  {
    id: 8,
    taskTitle:
      "AI Platform Explainer",
    brand: "Softgenie",
    department: "Video Editing",
    type: "Video",
    submittedAt: "18 Jul 2026, 4:00 PM",
    status: "Published",
    sourceLink:
      "https://drive.google.com/",
    finalLink:
      "https://drive.google.com/",
    publishedLink:
      "https://youtube.com/",
    revisionNumber: 1,
  },
];

function StatusBadge({
  status,
}: {
  status: SubmissionStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1.5 text-[10px] font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default function SubmissionsManagement() {
  const {
    department: selectedDepartment,
    employee,
  } = useEmployee();

  const [submissions, setSubmissions] =
    useState<Submission[]>(
      initialSubmissions,
    );

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All Statuses");

  const [brandFilter, setBrandFilter] =
    useState<BrandFilter>("All Brands");

  const [
    selectedSubmissionId,
    setSelectedSubmissionId,
  ] = useState<number | null>(null);

  const [
    isSubmissionModalOpen,
    setIsSubmissionModalOpen,
  ] = useState(false);

  const [newSubmission, setNewSubmission] =
    useState({
      taskTitle: "",
      brand: "",
      sourceLink: "",
      finalLink: "",
      notes: "",
    });


  const departmentSubmissions = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.department ===
          selectedDepartment,
      ),
    [submissions, selectedDepartment],
  );

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        departmentSubmissions.map(
          (submission) =>
            submission.brand,
        ),
      ),
    );
  }, [departmentSubmissions]);

  const brandOptions = useMemo(
    () => [
      {
        label: "All Brands",
        value: "All Brands",
      },
      ...brands.map((brand) => ({
        label: brand,
        value: brand,
      })),
    ],
    [brands],
  );

  const filteredSubmissions =
    useMemo(() => {
      const query = searchQuery
        .trim()
        .toLowerCase();

      return departmentSubmissions.filter(
        (submission) => {
          const searchMatches =
            query.length === 0 ||
            submission.taskTitle
              .toLowerCase()
              .includes(query) ||
            submission.brand
              .toLowerCase()
              .includes(query);

          const statusMatches =
            statusFilter ===
              "All Statuses" ||
            submission.status ===
              statusFilter;

          const brandMatches =
            brandFilter === "All Brands" ||
            submission.brand ===
              brandFilter;

          return (
            searchMatches &&
            statusMatches &&
            brandMatches
          );
        },
      );
    }, [
      departmentSubmissions,
      searchQuery,
      statusFilter,
      brandFilter,
    ]);

  const selectedSubmission =
    submissions.find(
      (submission) =>
        submission.id ===
        selectedSubmissionId,
    ) ?? null;

  const stats = useMemo(() => {
    const total =
      departmentSubmissions.length;

    const review =
      departmentSubmissions.filter(
        (submission) =>
          submission.status ===
            "Submitted" ||
          submission.status ===
            "In Review",
      ).length;

    const revisions =
      departmentSubmissions.filter(
        (submission) =>
          submission.status ===
          "Revision Required",
      ).length;

    const completed =
      departmentSubmissions.filter(
        (submission) =>
          submission.status ===
            "Approved" ||
          submission.status ===
            "Published",
      ).length;

    return {
      total,
      review,
      revisions,
      completed,
    };
  }, [departmentSubmissions]);

  function addSubmission() {
    if (
      !newSubmission.taskTitle.trim() ||
      !newSubmission.brand.trim() ||
      !newSubmission.finalLink.trim()
    ) {
      return;
    }

    const submission: Submission = {
      id: Date.now(),
      taskTitle:
        newSubmission.taskTitle.trim(),
      brand: newSubmission.brand.trim(),
      department: selectedDepartment,
      type:
        selectedDepartment ===
        "Graphic Design"
          ? "Design"
          : "Video",
      submittedAt:
        "22 Jul 2026, 4:45 PM",
      status: "Submitted",
      sourceLink:
        newSubmission.sourceLink.trim() ||
        undefined,
      finalLink:
        newSubmission.finalLink.trim(),
      revisionNumber: 1,
    };

    setSubmissions((current) => [
      submission,
      ...current,
    ]);

    setNewSubmission({
      taskTitle: "",
      brand: "",
      sourceLink: "",
      finalLink: "",
      notes: "",
    });

    setIsSubmissionModalOpen(false);
  }

  function resubmit(
    submissionId: number,
  ) {
    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === submissionId
          ? {
              ...submission,
              status: "Submitted",
              revisionNumber:
                submission.revisionNumber +
                1,
            }
          : submission,
      ),
    );
  }

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
                Submissions
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                Manage source, final and published links for your completed work.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsSubmissionModalOpen(true)
              }
              className="flex items-center gap-2 rounded-full bg-[#2f80ed] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1769d2]"
            >
              <Plus size={17} />
              New Submission
            </button>
          </section>


          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="kpi-card-hover rounded-[22px] bg-brand-blue-gradient p-5 text-white shadow-[0_18px_40px_rgba(47,128,237,0.20)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/75">
                    Total Submissions
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.total}
                  </p>

                  <p className="mt-3 text-xs text-white/70">
                    Current employee record
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-white text-[#2f80ed]">
                  <Send size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">
                    In Review
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.review}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Waiting for feedback
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-amber-50 text-amber-600">
                  <Clock3 size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">
                    Revisions
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.revisions}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Action required
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-orange-50 text-orange-600">
                  <RotateCcw size={20} />
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
          </section>

          <section className="mt-5 rounded-[24px] border border-[#edf0f5] bg-white p-4 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold">
                  Submission History
                </h2>

                <p className="mt-1 text-xs text-[#9299a4]">
                  {filteredSubmissions.length}{" "}
                  matching submissions
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
                    placeholder="Search submissions..."
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </label>

                <PillSelect
                  icon={Check}
                  ariaLabel="Filter submissions by status"
                  value={statusFilter}
                  options={statusOptions}
                  onValueChange={setStatusFilter}
                />

                <PillSelect
                  icon={FileText}
                  ariaLabel="Filter submissions by brand"
                  value={brandFilter}
                  options={brandOptions}
                  onValueChange={setBrandFilter}
                />
              </div>
            </div>
          </section>

          <section className="mt-5 overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white">
            <div className="dashboard-scrollbar overflow-x-auto">
              <SystemTable columns={6} minWidth={1120} cellWidth={150}>
                <thead>
                  <tr className="border-b border-[#edf0f5] bg-[#f8fafc] text-left">
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9198a3] text-[11px]">
                      Submission
                    </th>

                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9198a3] text-[11px]">
                      Brand
                    </th>

                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9198a3] text-[11px]">
                      Submitted
                    </th>

                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9198a3] text-[11px]">
                      Revision
                    </th>

                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9198a3] text-[11px]">
                      Status
                    </th>

                    <th className="w-[190px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9198a3]">
  ACTION
</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubmissions.map(
                    (submission) => (
                      <tr
                        key={submission.id}
                        className="border-b border-[#f0f2f5] last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                                submission.type ===
                                "Design"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-violet-50 text-violet-600"
                              }`}
                            >
                              {submission.type ===
                              "Design" ? (
                                <FileImage
                                  size={17}
                                />
                              ) : (
                                <Film size={17} />
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-bold">
                                {
                                  submission.taskTitle
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-[#9299a4]">
                                {submission.type}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-[#606874]">
                          {submission.brand}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs text-[#6f7682]">
                            <CalendarDays
                              size={14}
                            />
                            {
                              submission.submittedAt
                            }
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs font-bold">
                          V
                          {
                            submission.revisionNumber
                          }
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              submission.status
                            }
                          />
                        </td>

                        <td className="w-[190px] px-5 py-4 text-left">
  <div className="flex items-center justify-start">


                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSubmissionId(
                                submission.id,
                              )
                            }
                            className="inline-flex whitespace-nowrap items-center gap-2 rounded-full border border-[#e6eaf0] px-4 py-2 text-[10px] font-bold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                          >
                            View Details
                            <ExternalLink
                              size={13}
                            />
                          </button>


  </div>
</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </SystemTable>
            </div>

            {filteredSubmissions.length ===
            0 ? (
              <div className="grid min-h-64 place-items-center p-8 text-center">
                <div>
                  <Search
                    size={26}
                    className="mx-auto text-[#adb4bf]"
                  />

                  <p className="mt-3 text-sm font-bold">
                    No matching submissions
                  </p>

                  <p className="mt-1 text-xs text-[#9299a4]">
                    Adjust the search or filters.
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </section>

      {selectedSubmission ? (
        <>
          <button
            type="button"
            aria-label="Close submission details"
            onClick={() =>
              setSelectedSubmissionId(null)
            }
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
          />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[560px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">
                  {selectedSubmission.brand}
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">
                  {
                    selectedSubmission.taskTitle
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSubmissionId(null)
                }
                className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-6 p-5 sm:p-6">
              <section className="flex items-center justify-between">
                <StatusBadge
                  status={
                    selectedSubmission.status
                  }
                />

                <span className="rounded-full bg-[#f5f7fa] px-3 py-2 text-[10px] font-bold text-[#626a75]">
                  Revision{" "}
                  {
                    selectedSubmission.revisionNumber
                  }
                </span>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Type
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {selectedSubmission.type}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Submitted
                  </p>

                  <p className="mt-2 text-xs font-bold">
                    {
                      selectedSubmission.submittedAt
                    }
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold">
                  Submission Links
                </h3>

                <div className="mt-3 space-y-3">
                  {selectedSubmission.sourceLink ? (
                    <a
                      href={
                        selectedSubmission.sourceLink
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[18px] border border-[#e7ebf0] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-[#edf5ff] text-[#2f80ed]">
                          <FileText size={17} />
                        </div>

                        <div>
                          <p className="text-xs font-bold">
                            Source / Project Link
                          </p>

                          <p className="mt-1 text-[10px] text-[#9299a4]">
                            Editable working files
                          </p>
                        </div>
                      </div>

                      <ExternalLink
                        size={15}
                        className="text-[#2f80ed]"
                      />
                    </a>
                  ) : null}

                  <a
                    href={
                      selectedSubmission.finalLink
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[18px] border border-[#e7ebf0] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Link2 size={17} />
                      </div>

                      <div>
                        <p className="text-xs font-bold">
                          Final Submission Link
                        </p>

                        <p className="mt-1 text-[10px] text-[#9299a4]">
                          Final exported work
                        </p>
                      </div>
                    </div>

                    <ExternalLink
                      size={15}
                      className="text-emerald-600"
                    />
                  </a>

                  {selectedSubmission.publishedLink ? (
                    <a
                      href={
                        selectedSubmission.publishedLink
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[18px] border border-[#e7ebf0] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                          <ExternalLink
                            size={17}
                          />
                        </div>

                        <div>
                          <p className="text-xs font-bold">
                            Published Link
                          </p>

                          <p className="mt-1 text-[10px] text-[#9299a4]">
                            Live social media content
                          </p>
                        </div>
                      </div>

                      <ExternalLink
                        size={15}
                        className="text-violet-600"
                      />
                    </a>
                  ) : null}
                </div>
              </section>

              {selectedSubmission.feedback ? (
                <section className="rounded-[20px] bg-orange-50 p-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <MessageSquareText
                      size={16}
                    />

                    <h3 className="text-xs font-bold">
                      Revision Feedback
                    </h3>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-orange-800">
                    {
                      selectedSubmission.feedback
                    }
                  </p>
                </section>
              ) : null}

              {selectedSubmission.status ===
              "Revision Required" ? (
                <button
                  type="button"
                  onClick={() => {
                    resubmit(
                      selectedSubmission.id,
                    );
                    setSelectedSubmissionId(
                      null,
                    );
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-sm font-bold text-white"
                >
                  <RotateCcw size={17} />
                  Mark Revision Resubmitted
                </button>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}

      {isSubmissionModalOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="dashboard-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <header className="flex items-center justify-between border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">
                  New Submission
                </h2>

                <p className="mt-1 text-xs text-[#8b929d]">
                  Submit the task&apos;s final work and source links.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsSubmissionModalOpen(false)
                }
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
                  value={
                    newSubmission.taskTitle
                  }
                  onChange={(event) =>
                    setNewSubmission(
                      (current) => ({
                        ...current,
                        taskTitle:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Assigned task ka title"
                  className="mt-2 w-full rounded-2xl border border-[#e5e9ef] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  Brand
                </span>

                <input
                  value={newSubmission.brand}
                  onChange={(event) =>
                    setNewSubmission(
                      (current) => ({
                        ...current,
                        brand:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Example: Softgenie"
                  className="mt-2 w-full rounded-2xl border border-[#e5e9ef] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  {selectedDepartment ===
                  "Graphic Design"
                    ? "Editable design/source link"
                    : "Video project/source link"}
                </span>

                <input
                  type="url"
                  value={
                    newSubmission.sourceLink
                  }
                  onChange={(event) =>
                    setNewSubmission(
                      (current) => ({
                        ...current,
                        sourceLink:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Google Drive, Figma, Canva or project link"
                  className="mt-2 w-full rounded-2xl border border-[#e5e9ef] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  Final submission link
                </span>

                <input
                  type="url"
                  value={
                    newSubmission.finalLink
                  }
                  onChange={(event) =>
                    setNewSubmission(
                      (current) => ({
                        ...current,
                        finalLink:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Final exported work ka link"
                  className="mt-2 w-full rounded-2xl border border-[#e5e9ef] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  Notes
                </span>

                <textarea
                  rows={4}
                  value={newSubmission.notes}
                  onChange={(event) =>
                    setNewSubmission(
                      (current) => ({
                        ...current,
                        notes:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Optional submission notes"
                  className="mt-2 w-full resize-none rounded-2xl border border-[#e5e9ef] p-4 text-sm leading-6 outline-none focus:border-[#2f80ed]"
                />
              </label>
            </div>

            <footer className="flex justify-end gap-3 border-t border-[#edf0f5] p-5 sm:p-6">
              <button
                type="button"
                onClick={() =>
                  setIsSubmissionModalOpen(false)
                }
                className="rounded-full border border-[#e5e9ef] px-5 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addSubmission}
                disabled={
                  !newSubmission.taskTitle.trim() ||
                  !newSubmission.brand.trim() ||
                  !newSubmission.finalLink.trim()
                }
                className="flex items-center gap-2 rounded-full bg-[#2f80ed] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
                Submit Work
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </main>
  );
}



