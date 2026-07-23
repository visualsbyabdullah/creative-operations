"use client";

import {
  FileImage,
  Film,
} from "lucide-react";

import PillSelect from "@/components/ui/PillSelect";
import { useEmployee } from "@/context/EmployeeContext";
import type { EmployeeDepartment } from "@/config/employee";

const departmentOptions: {
  label: string;
  value: EmployeeDepartment;
}[] = [
  {
    label: "Graphic Designer",
    value: "Graphic Design",
  },
  {
    label: "Video Editor",
    value: "Video Editing",
  },
];

type EmployeeRolePreviewProps = {
  description?: string;
};

export default function EmployeeRolePreview({
  description =
    "Production mein logged-in employee ka department automatically load hoga.",
}: EmployeeRolePreviewProps) {
  const {
    department,
    setDepartment,
  } = useEmployee();

  return (
    <section className="rounded-[22px] border border-blue-100 bg-blue-50/60 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold text-[#2f80ed]">
            Prototype role preview
          </p>

          <p className="mt-1 text-xs leading-5 text-[#6f7682]">
            {description}
          </p>
        </div>

        <PillSelect
          icon={
            department ===
            "Graphic Design"
              ? FileImage
              : Film
          }
          ariaLabel="Preview employee role"
          value={department}
          options={departmentOptions}
          onValueChange={setDepartment}
        />
      </div>
    </section>
  );
}
