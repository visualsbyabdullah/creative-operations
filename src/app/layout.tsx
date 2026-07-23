import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

import AppProviders from "./providers";
export const metadata: Metadata = {
  title: "Creative Operations",
  description: "Creative team planning, tracking and reporting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><AppProviders>
          {children}
        </AppProviders></body>
    </html>
  );
}

