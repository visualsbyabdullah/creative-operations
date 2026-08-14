export type DepartmentStatus = "active" | "archived";

export type DepartmentView = {
  id: string;
  key: string;
  name: string;
  status: DepartmentStatus;
  accentColor: string | null;
  description: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentMutation = {
  departmentId?: string;
  name: string;
  description: string | null;
  accentColor: string | null;
  expectedUpdatedAt?: string;
};
