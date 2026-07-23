"use client";

import { useMemo, useState } from "react";

import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileImage,
  Film,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import PillSelect from "@/components/ui/PillSelect";

import type {
  EmployeeDepartment,
} from "@/config/employee";

import { useEmployee } from "@/context/EmployeeContext";

type NotificationType =
  | "Task Assignment"
  | "Deadline"
  | "Approval"
  | "Revision"
  | "Submission"
  | "Published";

type NotificationFilter =
  | "All Notifications"
  | NotificationType;

type ReadFilter =
  | "All Activity"
  | "Unread"
  | "Read";

type EmployeeNotification = {
  id: number;
  title: string;
  description: string;
  department: EmployeeDepartment;
  type: NotificationType;
  time: string;
  date: string;
  taskTitle: string;
  brand: string;
  isRead: boolean;
  actionHref?: string;
  feedback?: string;
};

const notificationTypeOptions: {
  label: string;
  value: NotificationFilter;
}[] = [
  {
    label: "All Notifications",
    value: "All Notifications",
  },
  {
    label: "Task Assignment",
    value: "Task Assignment",
  },
  {
    label: "Deadline",
    value: "Deadline",
  },
  {
    label: "Approval",
    value: "Approval",
  },
  {
    label: "Revision",
    value: "Revision",
  },
  {
    label: "Submission",
    value: "Submission",
  },
  {
    label: "Published",
    value: "Published",
  },
];

const readFilterOptions: {
  label: string;
  value: ReadFilter;
}[] = [
  {
    label: "All Activity",
    value: "All Activity",
  },
  {
    label: "Unread",
    value: "Unread",
  },
  {
    label: "Read",
    value: "Read",
  },
];

const initialNotifications: EmployeeNotification[] = [
  {
    id: 1,
    title: "New task assigned",
    description:
      "The MARK47 esports match announcement graphic has been assigned to you.",
    department: "Graphic Design",
    type: "Task Assignment",
    time: "10 minutes ago",
    date: "22 Jul 2026",
    taskTitle: "Esports Match Announcement",
    brand: "MARK47",
    isRead: false,
    actionHref: "/tasks?task=3",
  },
  {
    id: 2,
    title: "Revision requested",
    description:
      "The manager requested revisions for the E-Bazaar feature carousel.",
    department: "Graphic Design",
    type: "Revision",
    time: "45 minutes ago",
    date: "22 Jul 2026",
    taskTitle: "E-Bazaar Feature Carousel",
    brand: "E-Bazaar",
    isRead: false,
    actionHref: "/submissions",
    feedback:
      "Shorten the heading on slide two and make the CTA more prominent.",
  },
  {
    id: 3,
    title: "Submission approved",
    description:
      "The Softgenie AI Campaign Planner carousel has been approved.",
    department: "Graphic Design",
    type: "Approval",
    time: "2 hours ago",
    date: "22 Jul 2026",
    taskTitle: "AI Campaign Planner Carousel",
    brand: "Softgenie",
    isRead: true,
    actionHref: "/submissions",
  },
  {
    id: 4,
    title: "Deadline reminder",
    description:
      "The Softech Payroll Automation post is due today at 2:00 PM.",
    department: "Graphic Design",
    type: "Deadline",
    time: "3 hours ago",
    date: "22 Jul 2026",
    taskTitle: "Payroll Automation Post",
    brand: "Softech",
    isRead: false,
    actionHref: "/schedule",
  },
  {
    id: 5,
    title: "Content published",
    description:
      "The Solentrix product highlight was published on Instagram and Facebook.",
    department: "Graphic Design",
    type: "Published",
    time: "Yesterday",
    date: "21 Jul 2026",
    taskTitle: "Solar Product Highlight",
    brand: "Solentrix",
    isRead: true,
    actionHref: "/submissions",
  },
  {
    id: 6,
    title: "New reel assigned",
    description:
      "The MARK47 Broadcast Overlay Demo reel has been assigned to you.",
    department: "Video Editing",
    type: "Task Assignment",
    time: "15 minutes ago",
    date: "22 Jul 2026",
    taskTitle: "Broadcast Overlay Demo",
    brand: "MARK47",
    isRead: false,
    actionHref: "/tasks?task=7",
  },
  {
    id: 7,
    title: "Video revision requested",
    description:
      "The Softech Business Automation Reel requires revisions.",
    department: "Video Editing",
    type: "Revision",
    time: "1 hour ago",
    date: "22 Jul 2026",
    taskTitle: "Business Automation Reel",
    brand: "Softech",
    isRead: false,
    actionHref: "/submissions",
    feedback:
      "Make the opening three seconds faster and increase the caption size.",
  },
  {
    id: 8,
    title: "Video submission received",
    description:
      "The Solentrix Residential Solar Promo Reel was submitted successfully.",
    department: "Video Editing",
    type: "Submission",
    time: "2 hours ago",
    date: "22 Jul 2026",
    taskTitle: "Residential Solar Promo Reel",
    brand: "Solentrix",
    isRead: true,
    actionHref: "/submissions",
  },
  {
    id: 9,
    title: "Deadline approaching",
    description:
      "The Softgenie AI Platform Explainer is due tomorrow at 4:00 PM.",
    department: "Video Editing",
    type: "Deadline",
    time: "Yesterday",
    date: "21 Jul 2026",
    taskTitle: "AI Platform Explainer",
    brand: "Softgenie",
    isRead: true,
    actionHref: "/schedule",
  },
  {
    id: 10,
    title: "Reel published",
    description:
      "The Solentrix promo reel was published on Instagram and TikTok.",
    department: "Video Editing",
    type: "Published",
    time: "2 days ago",
    date: "20 Jul 2026",
    taskTitle: "Residential Solar Promo Reel",
    brand: "Solentrix",
    isRead: true,
    actionHref: "/submissions",
  },
];

function getNotificationAppearance(
  type: NotificationType,
) {
  switch (type) {
    case "Task Assignment":
      return {
        icon: Sparkles,
        iconClass:
          "bg-blue-50 text-blue-600",
      };

    case "Deadline":
      return {
        icon: Clock3,
        iconClass:
          "bg-amber-50 text-amber-600",
      };

    case "Approval":
      return {
        icon: Check,
        iconClass:
          "bg-emerald-50 text-emerald-600",
      };

    case "Revision":
      return {
        icon: CircleAlert,
        iconClass:
          "bg-orange-50 text-orange-600",
      };

    case "Submission":
      return {
        icon: Send,
        iconClass:
          "bg-violet-50 text-violet-600",
      };

    case "Published":
      return {
        icon: ExternalLink,
        iconClass:
          "bg-green-50 text-green-600",
      };
  }
}

export default function NotificationsCenter() {
  const {
    department: selectedDepartment,
    employee,
  } = useEmployee();

  const [
    notifications,
    setNotifications,
  ] = useState<EmployeeNotification[]>(
    initialNotifications,
  );

  const [
    notificationFilter,
    setNotificationFilter,
  ] = useState<NotificationFilter>(
    "All Notifications",
  );

  const [readFilter, setReadFilter] =
    useState<ReadFilter>("All Activity");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    selectedNotificationId,
    setSelectedNotificationId,
  ] = useState<number | null>(null);


  const departmentNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            notification.department ===
            selectedDepartment,
        ),
      [notifications, selectedDepartment],
    );

  const filteredNotifications =
    useMemo(() => {
      const query = searchQuery
        .trim()
        .toLowerCase();

      return departmentNotifications.filter(
        (notification) => {
          const searchMatches =
            query.length === 0 ||
            notification.title
              .toLowerCase()
              .includes(query) ||
            notification.description
              .toLowerCase()
              .includes(query) ||
            notification.taskTitle
              .toLowerCase()
              .includes(query) ||
            notification.brand
              .toLowerCase()
              .includes(query);

          const typeMatches =
            notificationFilter ===
              "All Notifications" ||
            notification.type ===
              notificationFilter;

          const readMatches =
            readFilter === "All Activity" ||
            (readFilter === "Unread" &&
              !notification.isRead) ||
            (readFilter === "Read" &&
              notification.isRead);

          return (
            searchMatches &&
            typeMatches &&
            readMatches
          );
        },
      );
    }, [
      departmentNotifications,
      searchQuery,
      notificationFilter,
      readFilter,
    ]);

  const selectedNotification =
    notifications.find(
      (notification) =>
        notification.id ===
        selectedNotificationId,
    ) ?? null;

  const stats = useMemo(() => {
    const unread =
      departmentNotifications.filter(
        (notification) =>
          !notification.isRead,
      ).length;

    const revisions =
      departmentNotifications.filter(
        (notification) =>
          notification.type === "Revision",
      ).length;

    const approvals =
      departmentNotifications.filter(
        (notification) =>
          notification.type === "Approval" ||
          notification.type === "Published",
      ).length;

    return {
      total: departmentNotifications.length,
      unread,
      revisions,
      approvals,
    };
  }, [departmentNotifications]);

  function markAsRead(
    notificationId: number,
  ) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    );
  }

  function openNotification(
    notificationId: number,
  ) {
    markAsRead(notificationId);
    setSelectedNotificationId(
      notificationId,
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) =>
        notification.department ===
        selectedDepartment
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader employee={employee} />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">
                Employee activity
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Notifications
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                View task assignments, approvals, revisions and deadline reminders in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
              className="flex items-center gap-2 rounded-full border border-[#e3e8ef] bg-white px-5 py-2.5 text-sm font-semibold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={17} />
              Mark All Read
            </button>
          </section>


          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="kpi-card-hover rounded-[22px] bg-brand-blue-gradient p-5 text-white shadow-[0_18px_40px_rgba(47,128,237,0.20)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/75">
                    Total Updates
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.total}
                  </p>

                  <p className="mt-3 text-xs text-white/70">
                    Employee activity
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-white text-[#2f80ed]">
                  <Bell size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">
                    Unread
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.unread}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Require attention
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <Bell size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">
                    Revisions
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.revisions}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Feedback received
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-orange-50 text-orange-600">
                  <MessageSquareText
                    size={20}
                  />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">
                    Completed Updates
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.approvals}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Approved or published
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={20} />
                </div>
              </div>
            </article>
          </section>

          <section className="mt-5 rounded-[24px] border border-[#edf0f5] bg-white p-4 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold">
                  Activity Feed
                </h2>

                <p className="mt-1 text-xs text-[#9299a4]">
                  {filteredNotifications.length}{" "}
                  notifications matching filters
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex h-11 min-w-[220px] items-center gap-2.5 rounded-full bg-[#f5f7fa] px-4">
                  <Search
                    size={15}
                    className="shrink-0 text-[#858c97]"
                  />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value,
                      )
                    }
                    placeholder="Search notifications..."
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </label>

                <PillSelect
                  icon={Bell}
                  ariaLabel="Filter notification type"
                  value={notificationFilter}
                  options={
                    notificationTypeOptions
                  }
                  onValueChange={
                    setNotificationFilter
                  }
                />

                <PillSelect
                  icon={Check}
                  ariaLabel="Filter notification read status"
                  value={readFilter}
                  options={readFilterOptions}
                  onValueChange={setReadFilter}
                />
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
            {filteredNotifications.map(
              (notification) => {
                const appearance =
                  getNotificationAppearance(
                    notification.type,
                  );

                const Icon = appearance.icon;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      openNotification(
                        notification.id,
                      )
                    }
                    className={`flex w-full gap-4 border-b border-[#f0f2f5] p-5 text-left transition last:border-b-0 hover:bg-[#f9fbfd] ${
                      !notification.isRead
                        ? "bg-blue-50/35"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className={`grid size-11 shrink-0 place-items-center rounded-full ${appearance.iconClass}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold">
                              {
                                notification.title
                              }
                            </p>

                            {!notification.isRead ? (
                              <span className="size-2 rounded-full bg-[#2f80ed]" />
                            ) : null}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-[#737b86]">
                            {
                              notification.description
                            }
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px] font-semibold text-[#9ba2ad]">
                          {notification.time}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f4f6f9] px-3 py-1.5 text-[10px] font-bold text-[#606874]">
                          {notification.brand}
                        </span>

                        <span className="rounded-full bg-[#f4f6f9] px-3 py-1.5 text-[10px] font-semibold text-[#747c87]">
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              },
            )}

            {filteredNotifications.length ===
            0 ? (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <Bell
                    size={28}
                    className="mx-auto text-[#adb4bf]"
                  />

                  <p className="mt-3 text-sm font-bold">
                    No notifications found
                  </p>

                  <p className="mt-1 text-xs text-[#9299a4]">
                    Adjust the search or filters.
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </section>

      {selectedNotification ? (
        <>
          <button
            type="button"
            aria-label="Close notification details"
            onClick={() =>
              setSelectedNotificationId(null)
            }
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
          />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">
                  {
                    selectedNotification.type
                  }
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">
                  {
                    selectedNotification.title
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotificationId(
                    null,
                  )
                }
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-6 p-5 sm:p-6">
              <section className="rounded-[20px] bg-[#f7f9fc] p-4">
                <p className="text-sm leading-7 text-[#69717d]">
                  {
                    selectedNotification.description
                  }
                </p>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#e7ebf0] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Brand
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {
                      selectedNotification.brand
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-[#e7ebf0] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Date
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {
                      selectedNotification.date
                    }
                  </p>
                </div>
              </section>

              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                  Related task
                </p>

                <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-[#e7ebf0] p-4">
                  <div
                    className={`grid size-10 place-items-center rounded-xl ${
                      selectedDepartment ===
                      "Graphic Design"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-violet-50 text-violet-600"
                    }`}
                  >
                    {selectedDepartment ===
                    "Graphic Design" ? (
                      <FileImage size={17} />
                    ) : (
                      <Film size={17} />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold">
                      {
                        selectedNotification.taskTitle
                      }
                    </p>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      {
                        selectedNotification.brand
                      }
                    </p>
                  </div>
                </div>
              </section>

              {selectedNotification.feedback ? (
                <section className="rounded-[20px] bg-orange-50 p-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <MessageSquareText
                      size={16}
                    />

                    <p className="text-xs font-bold">
                      Feedback
                    </p>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-orange-800">
                    {
                      selectedNotification.feedback
                    }
                  </p>
                </section>
              ) : null}

              {selectedNotification.actionHref ? (
                <a
                  href={
                    selectedNotification.actionHref
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-sm font-bold text-white"
                >
                  Open Related Item
                  <ExternalLink size={16} />
                </a>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </main>
  );
}

