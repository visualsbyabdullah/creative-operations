import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Send,
} from "lucide-react";

export const employeeNavigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "My Tasks",
    href: "/tasks",
    icon: ListChecks,
  },
  {
    label: "My Schedule",
    href: "/schedule",
    icon: CalendarDays,
  },
  {
    label: "Submissions",
    href: "/submissions",
    icon: Send,
  },
];
