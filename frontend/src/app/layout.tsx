import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

import AppProviders from "./providers";
import { getActiveProfile } from "@backend/modules/auth/authorization";
import {
  departmentLabel,
  roleLabel,
  type EmployeeProfile,
} from "@frontend/config/employee";
import { signAvatarPath } from "@backend/modules/storage/storage-service";
export const metadata: Metadata = {
  title: "Creative Operations",
  description: "Creative team planning, tracking and reporting platform",
};

// Keep server-rendered data requests close to the Supabase ap-northeast-1 project.
export const preferredRegion = "hnd1";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const result = await getActiveProfile();
  let initialEmployee: EmployeeProfile | null = null;
  if (result.status === "active") {
    const profile = result.profile;
    const name = profile.full_name.trim();
    const avatarUrl = await signAvatarPath(profile.avatar_path);
    initialEmployee = {
      id: profile.id,
      name,
      firstName: name.split(/\s+/u)[0] || "Employee",
      initials: name.split(/\s+/u).map((word) => word[0]).join("").slice(0,2).toUpperCase() || "EP",
      role: roleLabel(profile.role),
      department: departmentLabel(profile.role),
      avatarUrl,
    };
  }
  return (
    <html lang="en">
      <body><AppProviders initialEmployee={initialEmployee}>
          {children}
        </AppProviders></body>
    </html>
  );
}

