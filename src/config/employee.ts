export type EmployeeDepartment =
  | "Graphic Design"
  | "Video Editing";

export type EmployeeRole =
  | "Graphic Designer"
  | "Video Editor";

export type EmployeeProfile = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  role: EmployeeRole;
  department: EmployeeDepartment;
};

export const employeeProfiles: Record<
  EmployeeDepartment,
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

export const defaultEmployee =
  employeeProfiles["Graphic Design"];
