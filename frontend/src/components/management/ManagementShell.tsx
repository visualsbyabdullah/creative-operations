"use client";

import type { ReactNode } from "react";
import EmployeeHeader from "@frontend/components/layout/EmployeeHeader";

export default function ManagementShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader variant="management" workspaceLabel="Management workspace" />
        <div className="px-4 py-7 sm:px-6 sm:py-8">{children}</div>
      </section>
    </main>
  );
}