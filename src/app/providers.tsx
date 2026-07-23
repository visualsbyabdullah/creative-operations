"use client";

import type { ReactNode } from "react";

import { EmployeeProvider } from "@/context/EmployeeContext";

export default function AppProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <EmployeeProvider>
      {children}
    </EmployeeProvider>
  );
}
