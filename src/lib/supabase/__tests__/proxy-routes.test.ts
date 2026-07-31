import { describe, expect, it } from "vitest";

import { isProtectedApplicationRoute } from "@/lib/supabase/proxy";

describe("authentication proxy route boundaries", () => {
  it.each([
    "/login",
    "/auth/callback",
    "/auth/callback/exchange",
    "/auth/accept-invite",
    "/auth/set-password",
    "/forgot-password",
    "/reset-password",
  ])("allows the auth entry route %s to load without a session", (route) => {
    expect(isProtectedApplicationRoute(route)).toBe(false);
  });

  it.each([
    "/",
    "/dashboard",
    "/employees",
    "/employees/example",
    "/settings",
  ])("continues protecting the business route %s", (route) => {
    expect(isProtectedApplicationRoute(route)).toBe(true);
  });
});
