"use client";

import SystemTable from "@/components/ui/SystemTable";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import PillSelect from "@/components/ui/PillSelect";
import { useEmployee } from "@/context/EmployeeContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileImage,
  Film,
  Link2,
  ListChecks,
  Plus,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";
import type { TaskView } from "@/lib/tasks/task-types";
import type { TaskOption } from "@/lib/tasks/task-types";
import { createSelfTaskAction, submitTaskAction, transitionTaskAction } from "@/app/tasks/actions";
import { shiftCalendarDate } from "@/lib/tasks/task-date";
import {
  listAttachmentsAction,
  removeAttachmentAction,
  uploadAttachmentAction,
} from "@/app/attachments/actions";
import type { AttachmentView } from "@/lib/storage/storage-service";

type Department = "Graphic Design" | "Video Editing";

type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "In Review"
  | "Revision Required"
  | "Approved"
  | "Completed"
  | "Delayed";

type Priority = "Low" | "Medium" | "High" | "Urgent";

type WeekDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

type Platform =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "TikTok"
  | "YouTube";

type CreativeTask = {
  id: number | string;
  brand: string;
  title: string;
  department: Department;
  contentType: string;
  platforms: Platform[];
  day: WeekDay;
  deadline: string;
  status: TaskStatus;
  priority: Priority;
  assignedBy: string;
  description: string;
  referenceLink?: string;
  submissionLink?: string;
  publishedLink?: string;
  delayReason?: string;
  feedback?: string;
  canonicalStatus?: TaskView["status"];
  updatedAt?: string;
};

type StatusFilter = "All Statuses" | TaskStatus;

const statusStyles: Record<TaskStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-50 text-blue-700",
  "In Review": "bg-amber-50 text-amber-700",
  "Revision Required": "bg-orange-50 text-orange-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Completed: "bg-green-50 text-green-700",
  Delayed: "bg-red-50 text-red-700",
};

const priorityStyles: Record<Priority, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-amber-50 text-amber-700",
  Urgent: "bg-red-50 text-red-700",
};

const initialTasks: CreativeTask[] = [
  {
    id: 1,
    brand: "Softgenie",
    title: "AI Campaign Planner Carousel",
    department: "Graphic Design",
    contentType: "Carousel",
    platforms: ["Instagram", "Facebook"],
    day: "Monday",
    deadline: "Monday, 11:30 AM",
    status: "Approved",
    priority: "High",
    assignedBy: "HR",
    description:
      "Create a six-slide carousel explaining the AI campaign planning workflow. Follow the approved brochure visual language.",
    referenceLink: "https://drive.google.com/",
    submissionLink: "https://drive.google.com/",
    feedback: "Approved. Typography and spacing are aligned with the brand.",
  },
  {
    id: 2,
    brand: "Softech",
    title: "Payroll Automation Post",
    department: "Graphic Design",
    contentType: "Static Post",
    platforms: ["LinkedIn"],
    day: "Tuesday",
    deadline: "Tuesday, 2:00 PM",
    status: "In Review",
    priority: "Medium",
    assignedBy: "HR",
    description:
      "Create a minimal LinkedIn post highlighting the main benefit of payroll automation. Use limited copy and strong whitespace.",
    referenceLink: "https://drive.google.com/",
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
    deadline: "Wednesday, 12:00 PM",
    status: "In Progress",
    priority: "Urgent",
    assignedBy: "Manager",
    description:
      "Create a match announcement post using the MARK47 white and orange visual direction. Include both team names and match time.",
    referenceLink: "https://drive.google.com/",
  },
  {
    id: 4,
    brand: "Audit Tracker",
    title: "Audit Workflow Banner",
    department: "Graphic Design",
    contentType: "Banner",
    platforms: ["LinkedIn"],
    day: "Thursday",
    deadline: "Thursday, 11:00 AM",
    status: "Not Started",
    priority: "Medium",
    assignedBy: "Self Planned",
    description:
      "Create a professional banner presenting the audit workflow from planning to final reporting.",
  },
  {
    id: 5,
    brand: "Solentrix",
    title: "Solar Energy Product Highlight",
    department: "Graphic Design",
    contentType: "Static Post",
    platforms: ["Instagram", "Facebook"],
    day: "Friday",
    deadline: "Friday, 12:30 PM",
    status: "Delayed",
    priority: "High",
    assignedBy: "HR",
    description:
      "Create a residential solar panel product highlight with a clean green and white visual direction.",
    delayReason:
      "The required solar panel product photographs have not been received from the client.",
  },
  {
    id: 6,
    brand: "E-Bazaar",
    title: "POS Features Carousel",
    department: "Graphic Design",
    contentType: "Carousel",
    platforms: ["LinkedIn", "Facebook"],
    day: "Friday",
    deadline: "Friday, 4:00 PM",
    status: "Revision Required",
    priority: "Medium",
    assignedBy: "Manager",
    description:
      "Create a four-slide carousel covering inventory, billing, reporting and customer management.",
    submissionLink: "https://drive.google.com/",
    feedback:
      "Slide two needs less copy. Make the icons larger and increase the spacing between sections.",
  },
  {
    id: 7,
    brand: "Softech",
    title: "Business Automation Reel",
    department: "Video Editing",
    contentType: "Reel",
    platforms: ["Instagram"],
    day: "Wednesday",
    deadline: "Wednesday, 5:00 PM",
    status: "In Progress",
    priority: "Medium",
    assignedBy: "HR",
    description:
      "Edit a 30-second reel explaining how automation reduces manual work.",
  },
  {
    id: 8,
    brand: "Solentrix",
    title: "Residential Solar Promo Reel",
    department: "Video Editing",
    contentType: "Reel",
    platforms: ["Instagram", "TikTok"],
    day: "Monday",
    deadline: "Monday, 4:30 PM",
    status: "Approved",
    priority: "High",
    assignedBy: "Manager",
    description:
      "Edit a polished residential solar promotional reel using the approved footage, captions and brand direction.",
    referenceLink: "https://drive.google.com/",
    submissionLink: "https://drive.google.com/",
  },
  {
    id: 9,
    brand: "MARK47",
    title: "Broadcast Overlay Demo",
    department: "Video Editing",
    contentType: "Product Reel",
    platforms: ["Instagram", "YouTube"],
    day: "Tuesday",
    deadline: "Tuesday, 3:00 PM",
    status: "In Progress",
    priority: "High",
    assignedBy: "Manager",
    description:
      "Edit a product demo showing the MARK47 broadcast overlay workflow, match telemetry and live graphics.",
    referenceLink: "https://drive.google.com/",
  },
  {
    id: 10,
    brand: "Softgenie",
    title: "AI Platform Explainer",
    department: "Video Editing",
    contentType: "Motion Graphic",
    platforms: ["YouTube", "LinkedIn"],
    day: "Thursday",
    deadline: "Thursday, 4:00 PM",
    status: "Not Started",
    priority: "Medium",
    assignedBy: "HR",
    description:
      "Create a concise motion-graphics explainer presenting the AI campaign planning workflow and key platform benefits.",
    referenceLink: "https://drive.google.com/",
  },
  {
    id: 11,
    brand: "E-Bazaar",
    title: "POS Feature Reel",
    department: "Video Editing",
    contentType: "Reel",
    platforms: ["Instagram"],
    day: "Friday",
    deadline: "Friday, 3:30 PM",
    status: "Delayed",
    priority: "High",
    assignedBy: "Manager",
    description:
      "Edit a feature reel presenting inventory, billing, reporting and customer-management functionality.",
    delayReason:
      "The updated product screen recording has not been received yet.",
  },
  {
    id: 12,
    brand: "Audit Tracker",
    title: "Audit Workflow Walkthrough",
    department: "Video Editing",
    contentType: "Product Walkthrough",
    platforms: ["LinkedIn", "YouTube"],
    day: "Friday",
    deadline: "Friday, 5:00 PM",
    status: "Revision Required",
    priority: "Medium",
    assignedBy: "Manager",
    description:
      "Edit a product walkthrough covering audit planning, evidence collection, review and final reporting.",
    submissionLink: "https://drive.google.com/",
    feedback:
      "Reduce the opening duration and make the workflow labels easier to read.",
  },
];

const statuses: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "In Review",
  "Revision Required",
  "Approved",
  "Completed",
  "Delayed",
];

const statusFilterOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All Statuses",
    value: "All Statuses",
  },
  ...statuses.map((status) => ({
    label: status,
    value: status,
  })),
];


function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.05em] ${priorityStyles[priority]}`}
    >
      {priority}
    </span>
  );
}

function ProgressMeter({
  percentage,
  label,
}: {
  percentage: number;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#626a75]">
          {label}
        </p>

        <p className="text-xs font-bold text-[#2f80ed]">
          {percentage}%
        </p>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#edf1f6]">
        <div
          className="h-full rounded-full bg-brand-blue-gradient transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function MyTasks({
  backendTasks,
  selectedDate = new Date().toISOString().slice(0, 10),
  today = selectedDate,
  brands = [],
}: {
  backendTasks?: TaskView[];
  selectedDate?: string;
  today?: string;
  brands?: TaskOption[];
}) {
  const router = useRouter();
  const [datePending, startDateTransition] = useTransition();
  const {
    department,
    employee,
  } = useEmployee();

  const departmentTasks = useMemo(
    () => {
      if (backendTasks !== undefined) {
        return backendTasks.map((task) => ({
          id: task.id,
          brand: task.brandName,
          title: task.title,
          department: task.department === "video_editing" ? "Video Editing" as const : "Graphic Design" as const,
          contentType: task.contentType,
          platforms: [] as Platform[],
          day: new Date(`${task.scheduledDate}T12:00:00.000Z`).toLocaleDateString("en-US", { weekday: "long" }) as WeekDay,
          deadline: task.deadlineAt ? new Date(task.deadlineAt).toLocaleString() : "No deadline set",
          status: task.status === "in_progress" ? "In Progress" as const
            : task.status === "submitted" ? "In Review" as const
              : task.status === "revision_requested" ? "Revision Required" as const
                : task.status === "completed" ? "Completed" as const : "Not Started" as const,
          priority: `${task.priority[0].toUpperCase()}${task.priority.slice(1)}` as Priority,
          assignedBy: task.source === "self_created" ? "Employee Added" : "Management",
          description: task.description,
          referenceLink: task.referenceUrl ?? undefined,
          delayReason: task.delayReason ?? undefined,
          canonicalStatus: task.status,
          updatedAt: task.updatedAt,
        }));
      }
      return initialTasks.filter(
        (task) =>
          task.department === department,
      );
    },
    [backendTasks, department],
  );

  const [tasks, setTasks] =
    useState<CreativeTask[]>(departmentTasks);
const [selectedTaskId, setSelectedTaskId] =
    useState<number | string | null>(null);
  const submissionKeys = useRef(new Map<string, string>());

  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All Statuses");

  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionFile,setSubmissionFile]=useState<File|null>(null);
  const [submissionMessage,setSubmissionMessage]=useState("");
  const [taskFile,setTaskFile]=useState<File|null>(null);
  const [taskAttachmentMessage,setTaskAttachmentMessage]=useState("");
  const [taskAttachments,setTaskAttachments]=useState<AttachmentView[]>([]);

  const [publishedLink, setPublishedLink] = useState("");

  const [delayReason, setDelayReason] = useState("");

  const [showDelayForm, setShowDelayForm] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [createPending, startCreateTransition] = useTransition();
  const [createMessage, setCreateMessage] = useState("");
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    scheduledDate: selectedDate,
    brandId: brands[0]?.id ?? "",
    priority: "medium",
    description: "",
  });

  const selectedDateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  }).format(new Date(`${selectedDate}T12:00:00.000Z`));

  useEffect(() => {
    if (!showAddTask) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowAddTask(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showAddTask]);

  function navigateDate(date: string) {
    startDateTransition(() => router.push(`/tasks?date=${date}`));
  }

  function openAddTask() {
    setTaskDraft((current) => ({ ...current, scheduledDate: selectedDate }));
    setCreateMessage("");
    setShowAddTask(true);
  }

  function createTask() {
    if (createPending || !taskDraft.title.trim() || !taskDraft.brandId) return;
    startCreateTransition(async () => {
      const result = await createSelfTaskAction(taskDraft);
      if (!result.ok) {
        setCreateMessage(result.code === "validation_failed"
          ? "Check the task details and try again."
          : "The task could not be added. Please try again.");
        return;
      }
      setShowAddTask(false);
      setTaskDraft({
        title: "", scheduledDate: selectedDate, brandId: brands[0]?.id ?? "",
        priority: "medium", description: "",
      });
      router.refresh();
    });
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTasks(departmentTasks);
      setSelectedTaskId(null);
      setSearchQuery("");
      setStatusFilter("All Statuses");
    });

    return () => cancelAnimationFrame(frame);
  }, [departmentTasks]);
  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? null;

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const searchMatches =
        query.length === 0 ||
        task.title.toLowerCase().includes(query) ||
        task.brand.toLowerCase().includes(query) ||
        task.contentType.toLowerCase().includes(query);

      const statusMatches =
        statusFilter === "All Statuses" ||
        task.status === statusFilter;

      return searchMatches && statusMatches;
    });
  }, [tasks, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter((task) =>
      ["Approved", "Completed"].includes(task.status),
    ).length;

    const active = tasks.filter((task) =>
      ["In Progress", "In Review", "Revision Required"].includes(
        task.status,
      ),
    ).length;

    const delayed = tasks.filter(
      (task) => task.status === "Delayed",
    ).length;

    const todayTasks = tasks;

    const todayCompleted = todayTasks.filter((task) =>
      ["Approved", "Completed"].includes(task.status),
    ).length;

    const weeklyPercentage =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    const dailyPercentage =
      todayTasks.length === 0
        ? 0
        : Math.round(
            (todayCompleted / todayTasks.length) * 100,
          );

    return {
      total,
      completed,
      active,
      delayed,
      todayTasks: todayTasks.length,
      todayCompleted,
      weeklyPercentage,
      dailyPercentage,
    };
  }, [tasks]);

  function openTask(task: CreativeTask) {
    setSelectedTaskId(task.id);
    setSubmissionLink(task.submissionLink ?? "");
    setPublishedLink(task.publishedLink ?? "");
    setDelayReason(task.delayReason ?? "");
    setShowDelayForm(task.status === "Delayed");
    setTaskAttachments([]);
    void listAttachmentsAction("task",String(task.id)).then((result)=>{
      if(result.ok)setTaskAttachments(result.data);
    });
  }

  function closeDrawer() {
    setSelectedTaskId(null);
    setSubmissionLink("");
    setSubmissionFile(null);
    setSubmissionMessage("");
    setTaskFile(null);
    setTaskAttachmentMessage("");
    setPublishedLink("");
    setDelayReason("");
    setShowDelayForm(false);
  }

  function updateSelectedTask(
    updates: Partial<CreativeTask>,
  ) {
    if (!selectedTaskId) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === selectedTaskId
          ? {
              ...task,
              ...updates,
            }
          : task,
      ),
    );
  }

  async function handleStatusChange(status: TaskStatus) {
    if (!selectedTask?.canonicalStatus || !selectedTask.updatedAt) return;
    const target = status === "In Progress" &&
      selectedTask.canonicalStatus === "assigned"
      ? ["assigned","in_progress"]
      : status === "In Progress" &&
        selectedTask.canonicalStatus === "revision_requested"
        ? ["revision_requested","in_progress"] : null;
    if (!target) return;
    const result = await transitionTaskAction({
      taskId: String(selectedTask.id),
      expectedFrom: target[0],
      toStatus: target[1],
      reason: null,
    });
    if (result.ok) {
      updateSelectedTask({
        status: "In Progress",
        canonicalStatus: "in_progress",
        updatedAt: result.data.updatedAt,
      });
      setSubmissionMessage("Task status updated. You can now submit work using the form below.");
    } else {
      setSubmissionMessage(
        result.code === "stale_update"
          ? "This task changed in another session. Close and reopen it before trying again."
          : "The task status could not be updated. Please try again.",
      );
    }
  }

  function saveDelay() {
    if (!delayReason.trim()) {
      return;
    }

    updateSelectedTask({
      status: "Delayed",
      delayReason: delayReason.trim(),
    });

    setShowDelayForm(false);
  }

  async function saveSubmission() {
    if (!submissionLink.trim() || !selectedTask?.updatedAt ||
      selectedTask.canonicalStatus !== "in_progress") {
      return;
    }
    const taskId = String(selectedTask.id);
    let key = submissionKeys.current.get(taskId);
    if (!key) {
      key = crypto.randomUUID();
      submissionKeys.current.set(taskId, key);
    }
    const result = await submitTaskAction({
      taskId,
      expectedUpdatedAt: selectedTask.updatedAt,
      idempotencyKey: key,
      type: selectedTask.department === "Video Editing" ? "video" : "design",
      sourceUrl: null,
      finalUrl: submissionLink.trim(),
      notes: "",
    });
    if (result.ok) {
      if(submissionFile){
        const formData=new FormData();
        formData.set("file",submissionFile);
        formData.set("parentType","submission");
        formData.set("parentId",result.data.submissionId);
        const attachment=await uploadAttachmentAction(formData);
        setSubmissionMessage(attachment.ok
          ?"Submission and private attachment uploaded."
          :"Submission succeeded, but the attachment upload failed. You may retry from submission history.");
      }else{
        setSubmissionMessage("Submission sent for review.");
      }
      updateSelectedTask({
        submissionLink: submissionLink.trim(),
        status: "In Review",
        canonicalStatus: "submitted",
      });
    } else {
      submissionKeys.current.delete(taskId);
      setSubmissionMessage(
        result.code === "stale_update"
          ? "This task changed after it was opened. Close and reopen it, then submit again."
          : result.code === "validation_failed"
            ? "Enter a valid HTTPS work link before submitting."
            : result.code === "idempotency_conflict"
              ? "This submission request conflicts with an earlier attempt. Please try again."
              : "The submission could not be sent. Please try again.",
      );
    }
  }

  async function uploadTaskAttachment(){
    if(!selectedTask||!taskFile)return;
    const formData=new FormData();
    formData.set("file",taskFile);
    formData.set("parentType","task");
    formData.set("parentId",String(selectedTask.id));
    const result=await uploadAttachmentAction(formData);
    setTaskAttachmentMessage(result.ok
      ?"Private task attachment uploaded."
      : result.code==="validation_failed"
        ?"The selected file type, extension, or size is not allowed."
        :"Task attachment upload was not authorized or is temporarily unavailable.");
    if(result.ok)setTaskFile(null);
    if(result.ok){
      const refreshed=await listAttachmentsAction("task",String(selectedTask.id));
      if(refreshed.ok)setTaskAttachments(refreshed.data);
    }
  }

  async function removeTaskAttachment(id:string){
    const result=await removeAttachmentAction(id,"task");
    if(result.ok)setTaskAttachments((current)=>current.filter((item)=>item.id!==id));
    else setTaskAttachmentMessage("Attachment removal could not be completed.");
  }

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader employee={employee} />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">
                {department}
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                My Tasks
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                {department === "Video Editing"
                  ? "Manage your assigned video editing tasks, upload video submissions and update daily progress."
                  : "Manage your assigned creative tasks, upload submissions and update daily progress."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-full border border-[#e7ebf0] bg-white p-1">
                <button
                  type="button"
                  aria-label="Previous day"
                  onClick={() => navigateDate(shiftCalendarDate(selectedDate, -1))}
                  disabled={datePending}
                  className="grid size-9 place-items-center rounded-full text-[#59616d] transition hover:bg-[#f2f6fb] disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <label className="relative flex min-w-[210px] cursor-pointer items-center justify-center gap-2 px-3 text-xs font-bold text-[#39414c]">
                  <CalendarDays size={15} className="text-[#2f80ed]" />
                  <span>{selectedDate === today ? `Today · ${selectedDateLabel}` : selectedDateLabel}</span>
                  <input
                    type="date"
                    value={selectedDate}
                    aria-label="Select task date"
                    onChange={(event) => navigateDate(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <button
                  type="button"
                  aria-label="Next day"
                  onClick={() => navigateDate(shiftCalendarDate(selectedDate, 1))}
                  disabled={datePending}
                  className="grid size-9 place-items-center rounded-full text-[#59616d] transition hover:bg-[#f2f6fb] disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              {selectedDate !== today ? (
                <button
                  type="button"
                  onClick={() => navigateDate(today)}
                  className="h-11 rounded-full border border-[#dfe5ed] bg-white px-4 text-xs font-bold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                >
                  Today
                </button>
              ) : null}
              <button
                type="button"
                onClick={openAddTask}
                disabled={brands.length === 0}
                className="flex h-11 items-center gap-2 rounded-full bg-[#2f80ed] px-5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#1769d2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={15} />
                Add Task
              </button>
            </div>
          </section>

          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="kpi-card-hover rounded-[22px] bg-brand-blue-gradient p-5 text-white shadow-[0_18px_40px_rgba(47,128,237,0.20)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/75">
                    Total Tasks
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.total}
                  </p>

                  <p className="mt-3 text-xs text-white/70">
                    Scheduled for this date
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-white text-[#2f80ed]">
                  <ListChecks size={20} />
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
                    Production and review
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
                    Reason required
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-red-50 text-red-600">
                  <CircleAlert size={20} />
                </div>
              </div>
            </article>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[22px] border border-[#edf0f5] bg-white p-5 shadow-[0_12px_35px_rgba(24,39,75,0.035)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">
                    Date Progress
                  </h2>

                  <p className="mt-1 text-xs text-[#9299a4]">
                    {stats.todayCompleted} of{" "}
                    {stats.todayTasks} tasks completed on this date
                  </p>
                </div>

                <div className="grid size-10 place-items-center rounded-full bg-[#edf5ff] text-[#2f80ed]">
                  <CalendarDays size={18} />
                </div>
              </div>

              <div className="mt-6">
                <ProgressMeter
                  percentage={stats.dailyPercentage}
                  label="Selected date completion"
                />
              </div>
            </article>

            <article className="rounded-[22px] border border-[#edf0f5] bg-white p-5 shadow-[0_12px_35px_rgba(24,39,75,0.035)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">
                    Workflow Progress
                  </h2>

                  <p className="mt-1 text-xs text-[#9299a4]">
                    {stats.completed} of {stats.total} tasks
                    completed
                  </p>
                </div>

                <div className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={18} />
                </div>
              </div>

              <div className="mt-6">
                <ProgressMeter
                  percentage={stats.weeklyPercentage}
                  label="Task completion"
                />
              </div>
            </article>
          </section>

          <section className="mt-5 rounded-[24px] border border-[#edf0f5] bg-white shadow-[0_15px_42px_rgba(24,39,75,0.04)]">
            <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f5] p-5 lg:flex-row lg:items-center sm:p-6">
              <div>
                <h2 className="text-lg font-bold">
                  Assigned Tasks
                </h2>

                <p className="mt-1 text-xs text-[#9299a4]">
                  Only {department.toLowerCase()} tasks
                  are visible.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex h-11 min-w-[220px] items-center gap-2.5 rounded-full bg-[#f5f7fa] px-4">
                  <Search
                    size={15}
                    className="text-[#858c97]"
                  />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Search tasks..."
                    className="w-full bg-transparent text-xs outline-none sm:w-48"
                  />
                </label>

                <PillSelect
                  icon={Check}
                  ariaLabel="Filter tasks by status"
                  value={statusFilter}
                  options={statusFilterOptions}
                  onValueChange={setStatusFilter}
                />

              </div>
            </div>

            <div className="dashboard-scrollbar overflow-x-auto">
              <SystemTable columns={6} minWidth={1140} cellWidth={155}>
                <thead>
                  <tr className="bg-[#fafbfc] text-[11px] uppercase tracking-[0.08em] text-[#949ba6]">
                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.08em]">
                      Task
                    </th>

                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.08em]">
                      Schedule
                    </th>

                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.08em]">
                      Platforms
                    </th>

                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.08em]">
                      Priority
                    </th>

                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.08em]">
                      Status
                    </th>

                    <th className="w-[190px] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#949ba6]">
  ACTION
</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-t border-[#f0f2f5] transition hover:bg-[#fafcff]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf5ff] text-[#2f80ed]">
                            {task.department ===
                            "Graphic Design" ? (
                              <FileImage size={18} />
                            ) : (
                              <Film size={18} />
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-bold">
                              {task.title}
                            </p>

                            <p className="mt-1 text-[11px] text-[#8f96a1]">
                              {task.brand} -{" "}
                              {task.contentType}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-[#555d68]">
                          {task.day}
                        </p>

                        <p className="mt-1 text-[11px] text-[#9299a4]">
                          {task.deadline}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {task.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="rounded-full border border-[#e8ecf2] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#69717d]"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <PriorityBadge
                          priority={task.priority}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="w-[190px] px-6 py-4 text-left">

                        <div className="flex justify-start gap-2">
                          <button
                            type="button"
                            onClick={() => openTask(task)}
                            className="flex items-center gap-2 rounded-full border border-[#e6eaf0] px-4 py-2 text-[10px] font-bold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                          >
                            Open Task
                            <ExternalLink size={13} />
                          </button>


                        </div>

</td>
                    </tr>
                  ))}
                </tbody>
              </SystemTable>

              {filteredTasks.length === 0 ? (
                <div className="grid min-h-64 place-items-center p-8 text-center">
                  <div>
                    <Search
                      size={26}
                      className="mx-auto text-[#adb4bf]"
                    />

                    <p className="mt-3 text-sm font-bold">
                      {tasks.length === 0 ? "No tasks scheduled for this date." : "No matching tasks"}
                    </p>

                    <p className="mt-1 text-xs text-[#9299a4]">
                      {tasks.length === 0
                        ? "Add your own task if no work has been assigned."
                        : "Adjust the search or status filter and try again."}
                    </p>
                    {tasks.length === 0 ? (
                      <button
                        type="button"
                        onClick={openAddTask}
                        disabled={brands.length === 0}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-xs font-bold text-white disabled:opacity-40"
                      >
                        <Plus size={14} /> Add Task
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>

      {showAddTask ? (
        <>
          <button
            type="button"
            aria-label="Close add task dialog"
            onClick={() => setShowAddTask(false)}
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-title"
            className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[26px] bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.25)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">Personal work</p>
                <h2 id="add-task-title" className="mt-1 text-2xl font-bold tracking-[-0.04em]">Add Task</h2>
                <p className="mt-2 text-xs leading-5 text-[#7b838e]">
                  This task will be assigned only to you and visible to management.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close add task dialog"
                onClick={() => setShowAddTask(false)}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">Task title</span>
                <input
                  autoFocus
                  value={taskDraft.title}
                  maxLength={160}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#e2e7ed] px-4 text-sm outline-none focus:border-[#2f80ed] focus:ring-4 focus:ring-blue-50"
                />
              </label>
              <label>
                <span className="text-xs font-bold text-[#4d5560]">Work date</span>
                <input
                  type="date"
                  value={taskDraft.scheduledDate}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, scheduledDate: event.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#e2e7ed] px-4 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>
              <label>
                <span className="text-xs font-bold text-[#4d5560]">Brand</span>
                <select
                  value={taskDraft.brandId}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, brandId: event.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#e2e7ed] bg-white px-4 text-sm outline-none focus:border-[#2f80ed]"
                >
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs font-bold text-[#4d5560]">Priority</span>
                <select
                  value={taskDraft.priority}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, priority: event.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#e2e7ed] bg-white px-4 text-sm outline-none focus:border-[#2f80ed]"
                >
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">Description <span className="font-normal text-[#9299a4]">(optional)</span></span>
                <textarea
                  rows={4}
                  value={taskDraft.description}
                  maxLength={5000}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))}
                  className="mt-2 w-full resize-none rounded-2xl border border-[#e2e7ed] p-4 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>
            </div>
            {createMessage ? <p role="alert" className="mt-4 text-xs font-semibold text-red-600">{createMessage}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddTask(false)} className="h-11 rounded-full border border-[#dfe5ed] px-5 text-xs font-bold text-[#59616d]">Cancel</button>
              <button
                type="button"
                onClick={createTask}
                disabled={createPending || !taskDraft.title.trim() || !taskDraft.brandId || !taskDraft.scheduledDate}
                className="h-11 rounded-full bg-[#2f80ed] px-5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {createPending ? "Adding..." : "Add Task"}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {selectedTask ? (
        <>
          <button
            type="button"
            aria-label="Close task drawer"
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
          />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[560px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">
                  {selectedTask.brand}
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">
                  Task Details
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-6 p-5 sm:p-6">
              <section>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={selectedTask.status}
                  />

                  <PriorityBadge
                    priority={selectedTask.priority}
                  />
                </div>

                <h3 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.04em]">
                  {selectedTask.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#737b86]">
                  {selectedTask.description}
                </p>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Content Type
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {selectedTask.contentType}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Assigned By
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {selectedTask.assignedBy}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Scheduled Day
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {selectedTask.day}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Deadline
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {selectedTask.deadline}
                  </p>
                </div>
              </section>

              <section>
                <p className="text-xs font-bold text-[#4e5661]">
                  Publishing Platforms
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTask.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="rounded-full bg-[#edf5ff] px-3 py-2 text-[10px] font-bold text-[#2f80ed]"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </section>

              {selectedTask.referenceLink ? (
                <section className="rounded-2xl border border-[#e7ebf0] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-[#edf5ff] text-[#2f80ed]">
                        <Link2 size={17} />
                      </div>

                      <div>
                        <p className="text-xs font-bold">
                          Reference Material
                        </p>

                        <p className="mt-1 text-[10px] text-[#9299a4]">
                          Brief, copy or visual references
                        </p>
                      </div>
                    </div>

                    <a
                      href={selectedTask.referenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-9 place-items-center rounded-full border border-[#e7ebf0] text-[#2f80ed]"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </section>
              ) : null}

              <section>
                <label className="text-xs font-bold text-[#4e5661]">
                  Update Status
                </label>

                <PillSelect<TaskStatus>
                  value={selectedTask.status}
                  options={(
                    selectedTask.canonicalStatus === "assigned" ||
                    selectedTask.canonicalStatus === "revision_requested"
                      ? [selectedTask.status, "In Progress" as TaskStatus]
                      : [selectedTask.status]
                  ).filter((value, index, items) => items.indexOf(value) === index).map(
                    (status) => ({
                      label: status,
                      value: status,
                    }),
                  )}
                  onValueChange={
                    handleStatusChange
                  }
                  ariaLabel="Update task status"
                  variant="field"
                  fullWidth
                />
              </section>

              {showDelayForm ? (
                <section className="rounded-[20px] border border-red-100 bg-red-50 p-4">
                  <div className="flex items-center gap-3">
                    <CircleAlert
                      size={18}
                      className="text-red-600"
                    />

                    <div>
                      <p className="text-xs font-bold text-red-700">
                        Delay reason required
                      </p>

                      <p className="mt-1 text-[10px] text-red-600">
                        Enter a reason before marking the task
                        as delayed.
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={delayReason}
                    onChange={(event) =>
                      setDelayReason(event.target.value)
                    }
                    rows={4}
                    placeholder="Example: Required content or client assets are still pending."
                    className="mt-4 w-full resize-none rounded-2xl border border-red-100 bg-white p-4 text-sm leading-6 outline-none focus:border-red-400"
                  />

                  <button
                    type="button"
                    onClick={saveDelay}
                    disabled={!delayReason.trim()}
                    className="mt-3 w-full rounded-full bg-red-600 px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save Delay Reason
                  </button>
                </section>
              ) : null}

              {selectedTask.delayReason ? (
                <section className="rounded-[20px] bg-red-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-500">
                    Current Delay Reason
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-700">
                    {selectedTask.delayReason}
                  </p>
                </section>
              ) : null}

              <section className="rounded-[22px] border border-[#e7ebf0] p-4">
                <p className="text-xs font-bold">Task attachment</p>
                <p className="mt-1 text-[10px] text-[#9299a4]">
                  Private files are available only to assigned staff and workspace management.
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,.docx,.xlsx"
                  disabled={!["assigned","in_progress","revision_requested"].includes(selectedTask.canonicalStatus??"")}
                  onChange={(event)=>setTaskFile(event.target.files?.[0]??null)}
                  className="mt-3 block w-full text-xs disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={uploadTaskAttachment}
                  disabled={!taskFile}
                  className="mt-3 rounded-full border border-[#dfe5ed] px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Upload privately
                </button>
                {taskAttachmentMessage?(
                  <p role="status" className="mt-2 text-xs text-[#626a75]">{taskAttachmentMessage}</p>
                ):null}
                {taskAttachments.length>0?(
                  <div className="mt-3 space-y-2">
                    {taskAttachments.map((attachment)=>(
                      <div key={attachment.id} className="flex items-center justify-between rounded-xl bg-[#f7f9fc] p-3">
                        <a href={attachment.url} target="_blank" rel="noreferrer" className="truncate text-xs font-bold text-[#2f80ed]">
                          {attachment.name}
                        </a>
                        <button type="button" onClick={()=>removeTaskAttachment(attachment.id)} className="ml-3 text-[10px] font-bold text-red-600">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ):null}
              </section>

              <section className="rounded-[22px] border border-[#e7ebf0] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#edf5ff] text-[#2f80ed]">
                    <Upload size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold">
                      {department === "Video Editing"
                        ? "Submit Video Work"
                        : "Submit Creative Work"}
                    </p>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      Google Drive, project file or storage link
                    </p>
                  </div>
                </div>

                <input
                  type="url"
                  value={submissionLink}
                  onChange={(event) =>
                    setSubmissionLink(event.target.value)
                  }
                  placeholder="Paste submission link"
                  className="mt-4 w-full rounded-2xl border border-[#e2e7ed] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />

                <label className="mt-3 block rounded-2xl border border-dashed border-[#d5dce5] p-4 text-xs font-semibold text-[#626a75]">
                  Optional private attachment
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,.docx"
                    onChange={(event)=>setSubmissionFile(event.target.files?.[0]??null)}
                    className="mt-2 block w-full text-xs"
                  />
                  <span className="mt-2 block text-[10px] font-normal text-[#9299a4]">
                    Validated server-side; maximum 25 MB.
                  </span>
                </label>

                {submissionMessage?(
                  <p role="status" className="mt-3 text-xs font-semibold text-[#4f5762]">
                    {submissionMessage}
                  </p>
                ):null}

                <button
                  type="button"
                  onClick={saveSubmission}
                  disabled={!submissionLink.trim()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={14} />
                  Submit for Review
                </button>
              </section>

              <section className="rounded-[22px] border border-[#e7ebf0] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ExternalLink size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold">
                      Published Content Link
                    </p>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      Instagram, LinkedIn, Facebook or another
                      platform link
                    </p>
                  </div>
                </div>

                <input
                  type="url"
                  value={publishedLink}
                  readOnly
                  placeholder="Publishing is completed by management after review."
                  className="mt-4 w-full rounded-2xl border border-[#e2e7ed] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />

                <button
                  type="button"
                  disabled
                  title="Only Manager or HR can publish an approved submission."
                  className="mt-3 w-full rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Management publishing only
                </button>
              </section>

              {selectedTask.submissionLink ? (
                <a
                  href={selectedTask.submissionLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[18px] bg-[#edf5ff] p-4 text-[#2f80ed]"
                >
                  <div>
                    <p className="text-xs font-bold">
                      Current Submission
                    </p>

                    <p className="mt-1 text-[10px]">
                      Open submitted creative work
                    </p>
                  </div>

                  <ExternalLink size={16} />
                </a>
              ) : null}

              {selectedTask.feedback ? (
                <section className="rounded-[20px] bg-amber-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-600">
                    Manager Feedback
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    {selectedTask.feedback}
                  </p>
                </section>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </main>
  );
}
