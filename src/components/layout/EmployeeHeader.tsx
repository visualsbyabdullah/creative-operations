"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Palette,
  UserRound,
  X,
} from "lucide-react";

import { logout } from "@/app/auth/actions";
import { getUnreadNotificationCountAction } from "@/app/notifications/actions";
import { useEmployee } from "@/context/EmployeeContext";

import { employeeNavigation } from "@/config/employeeNavigation";
import { managementNavigation } from "@/config/managementNavigation";

type HeaderEmployee = {
  initials: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
};

type EmployeeHeaderProps = {
  employee?: HeaderEmployee;
  variant?: "employee" | "management";
  workspaceLabel?: string;
};

export default function EmployeeHeader({
  employee,
  variant = "employee",
  workspaceLabel = "Creative operations workspace",
}: EmployeeHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const contextEmployee = useEmployee().employee;
  const navigation = variant === "management" ? managementNavigation : employeeNavigation;
  const currentEmployee: HeaderEmployee = employee ?? contextEmployee;
  const [unreadCount, setUnreadCount] = useState(0);

  const [
    isSigningOut,
    setIsSigningOut,
  ] = useState(false);
  const [
    signOutError,
    setSignOutError,
  ] = useState(false);

  const profileMenuRef =
    useRef<HTMLDivElement | null>(null);

  const [
    isMobileNavigationOpen,
    setIsMobileNavigationOpen,
  ] = useState(false);

  const [
    isProfileMenuOpen,
    setIsProfileMenuOpen,
  ] = useState(false);

  function isNavigationActive(
    href: string,
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setSignOutError(false);

    const result = await logout();

    if (!result.success) {
      setSignOutError(true);
      setIsSigningOut(false);
      return;
    }

    setIsProfileMenuOpen(false);
    setIsMobileNavigationOpen(false);

    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    let active = true;
    void getUnreadNotificationCountAction().then((result) => {
      if (active && result.ok) setUnreadCount(result.data);
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <>
      <header className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex min-h-20 items-center justify-between gap-4 rounded-[22px] border border-[#f0f2f6] bg-white px-4 shadow-[0_12px_34px_rgba(24,39,75,0.04)] sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
          >
            <div className="grid size-10 place-items-center rounded-full bg-brand-blue-gradient text-white shadow-lg shadow-blue-200">
              <Palette size={20} />
            </div>

            <div>
              <p className="text-lg font-bold tracking-[-0.04em]">
                CreativeOps
              </p>

              <p className="hidden text-[11px] text-[#939aa5] sm:block">
                {workspaceLabel}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center rounded-full bg-[#f6f7f9] p-1.5 lg:flex">
            {navigation.map(
              ({
                label,
                href,
                icon: Icon,
              }) => {
                const isActive =
                  isNavigationActive(href);

                return (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#15181d] text-white shadow-md"
                        : "text-[#636a75] hover:bg-white hover:text-[#15181d]"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                );
              },
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Open mobile navigation"
              onClick={() =>
                setIsMobileNavigationOpen(true)
              }
              className="grid size-10 place-items-center rounded-full border border-[#edf0f4] bg-white text-[#3d444e] lg:hidden"
            >
              <Menu size={18} />
            </button>

            <Link
  href="/notifications"
  aria-label="Notifications"
  className={`relative grid size-10 place-items-center rounded-full border transition ${
    pathname.startsWith("/notifications")
      ? "border-[#2f80ed] bg-[#edf5ff] text-[#2f80ed]"
      : "border-[#edf0f4] bg-white text-[#3d444e] hover:bg-[#f7f9fc]"
  }`}
>
  <Bell size={18} />

  {unreadCount > 0 ? (
    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white ring-2 ring-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  ) : null}
</Link>



            <div
              ref={profileMenuRef}
              className="relative ml-1"
            >
              <button
                type="button"
                onClick={() =>
                  setIsProfileMenuOpen(
                    (current) => !current,
                  )
                }
                aria-expanded={
                  isProfileMenuOpen
                }
                aria-haspopup="menu"
                className="flex items-center gap-3 rounded-full"
              >
                <div
                  className="grid size-10 place-items-center rounded-full bg-cover bg-center bg-[#1d2430] text-sm font-bold text-white"
                  style={currentEmployee.avatarUrl ? { backgroundImage: `url("${currentEmployee.avatarUrl}")` } : undefined}
                >
                  {currentEmployee.avatarUrl ? null : currentEmployee.initials}
                </div>

                <div className="hidden text-left xl:block">
                  <p className="text-sm font-bold">
                    {currentEmployee.name}
                  </p>

                  <p className="text-[11px] text-[#9299a4]">
                    {currentEmployee.role}
                  </p>
                </div>

                <ChevronDown
                  size={16}
                  className={`hidden text-[#7b828d] transition-transform xl:block ${
                    isProfileMenuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {isProfileMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+12px)] z-50 w-56 rounded-[18px] border border-[#e8ecf2] bg-white p-2 shadow-[0_20px_55px_rgba(24,39,75,0.16)]"
                >
                  <div className="border-b border-[#edf0f5] px-3 py-3">
                    <p className="text-xs font-bold">
                      {currentEmployee.name}
                    </p>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      {currentEmployee.role}
                    </p>
                  </div>

                  <div className="mt-2 space-y-1">
                    {signOutError ? (
                      <p
                        role="alert"
                        className="px-3 py-2 text-[11px] font-semibold text-red-600"
                      >
                        Unable to sign out. Please try again.
                      </p>
                    ) : null}
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#555d68] transition hover:bg-[#f4f7fa] hover:text-[#15181d]"
                    >
                      <UserRound size={15} />
                      Profile & Settings
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={15} />
                      {isSigningOut ? "Signing Out..." : "Sign Out"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {isMobileNavigationOpen ? (
        <>
          <button
            type="button"
            aria-label="Close mobile navigation"
            onClick={() =>
              setIsMobileNavigationOpen(false)
            }
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px] lg:hidden"
          />

          <aside className="fixed inset-y-0 right-0 z-50 w-[88%] max-w-sm bg-white p-5 shadow-[-25px_0_70px_rgba(15,23,42,0.18)] lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-brand-blue-gradient text-white">
                  <Palette size={20} />
                </div>

                <div>
                  <p className="text-base font-bold">
                    CreativeOps
                  </p>

                  <p className="text-[10px] text-[#9299a4]">
                    {workspaceLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsMobileNavigationOpen(
                    false,
                  )
                }
                className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-8 space-y-2">
              {navigation.map(
                ({
                  label,
                  href,
                  icon: Icon,
                }) => {
                  const isActive =
                    isNavigationActive(href);

                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() =>
                        setIsMobileNavigationOpen(
                          false,
                        )
                      }
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                        isActive
                          ? "bg-[#15181d] text-white"
                          : "text-[#626a75] hover:bg-[#f5f7fa]"
                      }`}
                    >
                      <Icon size={17} />
                      {label}
                    </Link>
                  );
                },
              )}

              <div className="my-4 border-t border-[#edf0f5]" />

              <Link
                href="/notifications"
                onClick={() =>
                  setIsMobileNavigationOpen(
                    false,
                  )
                }
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#626a75] hover:bg-[#f5f7fa]"
              >
                <Bell size={17} />
                Notifications
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsMobileNavigationOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#626a75] hover:bg-[#f5f7fa]"
              >
                <UserRound size={17} />
                Profile & Settings
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut size={17} />
                {isSigningOut
                  ? "Signing Out..."
                  : "Sign Out"}
              </button>
            </nav>
          </aside>
        </>
      ) : null}
    </>
  );
}


