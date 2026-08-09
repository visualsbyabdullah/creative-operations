export type AppRole =
  | "graphic_designer"
  | "video_editor"
  | "hr"
  | "manager";

export type EmployeeProfile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function isAppRole(
  value: unknown,
): value is AppRole {
  return (
    value === "graphic_designer" ||
    value === "video_editor" ||
    value === "hr" ||
    value === "manager"
  );
}
