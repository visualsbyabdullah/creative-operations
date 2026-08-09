export type TaskStatus =
  | "draft" | "assigned" | "in_progress" | "submitted"
  | "revision_requested" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskView = {
  id: string;
  brandId: string;
  brandName: string;
  title: string;
  department: "graphic_design" | "video_editing";
  contentType: string;
  scheduledDate: string;
  deadlineAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
  referenceUrl: string | null;
  delayReason: string | null;
  updatedAt: string;
  assigneeIds: string[];
  assigneeNames: string[];
  source?: "management_assigned" | "self_created";
};
export type TaskOption = { id: string; name: string };
export type AssigneeOption = TaskOption & {
  department: "graphic_design" | "video_editing";
};
export type TaskPage = {
  items: TaskView[];
  nextCursor: string | null;
};
export type TaskPageQuery = {
  startDate: string;
  endDate: string;
  search?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  brandId?: string | null;
  assigneeId?: string | null;
  department?: TaskView["department"] | null;
  pageSize?: number;
  cursor?: string | null;
};
