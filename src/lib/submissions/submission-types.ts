export type SubmissionView = {
  id: string; taskId: string; taskTitle: string; brandName: string;
  submittedBy: string; submitterName: string; type: "design" | "video";
  sourceUrl: string | null; finalUrl: string | null; notes: string | null;
  status: "draft" | "submitted" | "in_review" | "revision_requested" |
    "approved" | "published" | "archived";
  revisionNumber: number; submittedAt: string | null; publishedUrl: string | null;
  updatedAt: string; taskUpdatedAt: string; latestFeedback: string | null;
};
