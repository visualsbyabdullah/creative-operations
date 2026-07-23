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
  type EmployeeRole,
} from "@/config/employee";

import { createClient } from "@/lib/supabase/client";

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
  value: unknown,
): value is EmployeeDepartment {
  return (
    value === "Graphic Design" ||
    value === "Video Editing"
  );
}

function createInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "EP";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${
    words[words.length - 1][0]
  }`.toUpperCase();
}

function resolveDepartment(
  role: unknown,
  profileDepartment: unknown,
): EmployeeDepartment {
  if (
    isEmployeeDepartment(
      profileDepartment,
    )
  ) {
    return profileDepartment;
  }

  return role === "video_editor"
    ? "Video Editing"
    : "Graphic Design";
}

function resolveRole(
  department: EmployeeDepartment,
): EmployeeRole {
  return department === "Video Editing"
    ? "Video Editor"
    : "Graphic Designer";
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

  const [
    employee,
    setEmployee,
  ] = useState<EmployeeProfile>(
    employeeProfiles["Graphic Design"],
  );

  const [isHydrated, setIsHydrated] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAuthenticatedEmployee() {
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

        setEmployee(
          employeeProfiles[
            savedDepartment
          ],
        );
      }

      const supabase = createClient();

      const {
        data: userData,
      } = await supabase.auth.getUser();

      const user = userData.user;

      if (!user || !isMounted) {
        setIsHydrated(true);
        return;
      }

      const {
        data: profile,
      } = await supabase
        .from("profiles")
        .select(
          "full_name, role, department",
        )
        .eq("id", user.id)
        .single();

      if (!profile || !isMounted) {
        setIsHydrated(true);
        return;
      }

      const resolvedDepartment =
        resolveDepartment(
          profile.role,
          profile.department,
        );

      const fallback =
        employeeProfiles[
          resolvedDepartment
        ];

      const fullName =
        typeof profile.full_name ===
          "string" &&
        profile.full_name.trim()
          ? profile.full_name.trim()
          : fallback.name;

      setDepartmentState(
        resolvedDepartment,
      );

      setEmployee({
        id: user.id,
        name: fullName,
        firstName:
          fullName
            .split(/\s+/)[0] ||
          fallback.firstName,
        initials:
          createInitials(fullName),
        role:
          resolveRole(
            resolvedDepartment,
          ),
        department:
          resolvedDepartment,
      });

      window.localStorage.setItem(
        storageKey,
        resolvedDepartment,
      );

      setIsHydrated(true);
    }

    void loadAuthenticatedEmployee();

    return () => {
      isMounted = false;
    };
  }, []);

  function setDepartment(
    nextDepartment: EmployeeDepartment,
  ) {
    setDepartmentState(nextDepartment);

    setEmployee(
      employeeProfiles[nextDepartment],
    );

    window.localStorage.setItem(
      storageKey,
      nextDepartment,
    );
  }

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