"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  employeeProfiles,
  type EmployeeDepartment,
  type EmployeeProfile,
} from "@/config/employee";

type EmployeeContextValue = {
  department: EmployeeDepartment;
  employee: EmployeeProfile;
  setDepartment: (
    department: EmployeeDepartment,
  ) => void;
  isHydrated: boolean;
};

const EmployeeContext =
  createContext<EmployeeContextValue | null>(
    null,
  );

const storageKey =
  "creativeops-employee-department";

function isEmployeeDepartment(
  value: string | null,
): value is EmployeeDepartment {
  return (
    value === "Graphic Design" ||
    value === "Video Editing"
  );
}

export function EmployeeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    department,
    setDepartmentState,
  ] = useState<EmployeeDepartment>(
    "Graphic Design",
  );

  const [isHydrated, setIsHydrated] =
    useState(false);

  useEffect(() => {
    const savedDepartment =
      window.localStorage.getItem(
        storageKey,
      );

    if (
      isEmployeeDepartment(
        savedDepartment,
      )
    ) {
      setDepartmentState(
        savedDepartment,
      );
    }

    setIsHydrated(true);
  }, []);

  function setDepartment(
    nextDepartment: EmployeeDepartment,
  ) {
    setDepartmentState(nextDepartment);

    window.localStorage.setItem(
      storageKey,
      nextDepartment,
    );
  }

  const employee =
    employeeProfiles[department];

  const value = useMemo(
    () => ({
      department,
      employee,
      setDepartment,
      isHydrated,
    }),
    [
      department,
      employee,
      isHydrated,
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
