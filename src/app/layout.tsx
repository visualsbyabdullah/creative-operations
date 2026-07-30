import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

import AppProviders from "./providers";
import { getActiveProfile } from "@/lib/auth/authorization";
import type { EmployeeProfile } from "@/config/employee";
export const metadata: Metadata = {
  title: "Creative Operations",
  description: "Creative team planning, tracking and reporting platform",
};

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
    const department = profile.role === "video_editor" ? "Video Editing" : "Graphic Design";
    initialEmployee = {
      id: profile.id,
      name,
      firstName: name.split(/\s+/u)[0] || "Employee",
      initials: name.split(/\s+/u).map((word) => word[0]).join("").slice(0,2).toUpperCase() || "EP",
      role: profile.role === "video_editor" ? "Video Editor" : "Graphic Designer",
      department,
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

