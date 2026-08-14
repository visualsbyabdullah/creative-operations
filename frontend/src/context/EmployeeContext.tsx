"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import {
  defaultEmployee,
  type EmployeeDepartment,
  type EmployeeProfile,
} from "@frontend/config/employee";

type EmployeeContextValue = {
  department: EmployeeDepartment;
  employee: EmployeeProfile;
  isHydrated: boolean;
};

const EmployeeContext =
  createContext<EmployeeContextValue | null>(
    null,
  );

export function EmployeeProvider({
  children,
  initialEmployee,
}: {
  children: ReactNode;
  initialEmployee?: EmployeeProfile | null;
}) {
  const employee = initialEmployee ?? defaultEmployee;
  const department: EmployeeDepartment = employee.department;

  const value = useMemo(
    () => ({
      department,
      employee,
      isHydrated: true,
    }),
    [
      department,
      employee,
    ],
  );

  return (
    <EmployeeContext.Provider
      value={value}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context =
    useContext(EmployeeContext);

  if (!context) {
    throw new Error(
      "useEmployee must be used inside EmployeeProvider.",
    );
  }

  return context;
}
