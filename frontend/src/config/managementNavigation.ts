import { Building2, CalendarDays, Layers, LayoutDashboard, Send, Users } from "lucide-react";

export const managementNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Weekly Planner", href: "/planner", icon: CalendarDays },
  { label: "Submissions", href: "/submissions", icon: Send },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Departments", href: "/departments", icon: Layers },
  { label: "Brands", href: "/brands", icon: Building2 },
];