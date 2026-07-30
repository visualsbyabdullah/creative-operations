"use client";

import type { ReactNode } from "react";

import { EmployeeProvider } from "@/context/EmployeeContext";
import type { EmployeeProfile } from "@/config/employee";

export default function AppProviders({
  children,
  initialEmployee,
}: {
  children: ReactNode;
  initialEmployee?: EmployeeProfile | null;
}) {
  return (
    <EmployeeProvider initialEmployee={initialEmployee}>
      {children}
    </EmployeeProvider>
  );
}
