export type ManagementDashboardData = {
  activeTasks: number;
  pendingReviews: number;
  delayedTasks: number;
  teamMembers: number;
  team: Array<{
    id: string;
    name: string;
    role: "graphic_designer" | "video_editor";
    active: number;
    completed: number;
    progress: number | null;
    status: "Delayed" | "Review Pending" | "On Track";
  }>;
  reviews: Array<{
    id: string;
    title: string;
    brand: string;
    assignee: string;
    type: "design" | "video";
  }>;
};
