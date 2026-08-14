"use client";

import type { ReactNode } from "react";

import { EmployeeProvider } from "@frontend/context/EmployeeContext";
import type { EmployeeProfile } from "@frontend/config/employee";

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
