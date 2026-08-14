import type { AppRole } from "@shared/contracts/auth";

export type EmployeeDepartment =
  | "Graphic Design"
  | "Video Editing"
  | "Management";

export type EmployeeRole =
  | "Graphic Designer"
  | "Video Editor"
  | "Manager"
  | "HR";

export type EmployeeProfile = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  role: EmployeeRole;
  department: EmployeeDepartment;
  avatarUrl?: string | null;
};

export const roleLabels: Record<AppRole, EmployeeRole> = {
  manager: "Manager",
  hr: "HR",
  graphic_designer: "Graphic Designer",
  video_editor: "Video Editor",
};

export function roleLabel(role: AppRole) {
  return roleLabels[role];
}

export function departmentLabel(role: AppRole): EmployeeDepartment {
  if (role === "graphic_designer") return "Graphic Design";
  if (role === "video_editor") return "Video Editing";
  return "Management";
}

export const employeeProfiles: Record<
  "Graphic Design" | "Video Editing",
  EmployeeProfile
> = {
  "Graphic Design": {
    id: "employee-graphic-001",
    name: "Abdullah Naeem",
    firstName: "Abdullah",
    initials: "AN",
    role: "Graphic Designer",
    department: "Graphic Design",
  },
  "Video Editing": {
    id: "employee-video-001",
    name: "Hamza Khan",
    firstName: "Hamza",
    initials: "HK",
    role: "Video Editor",
    department: "Video Editing",
  },
};

export const defaultEmployee = employeeProfiles["Graphic Design"];
