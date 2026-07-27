"use client";

import SystemTable from "@/components/ui/SystemTable";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CirclePause,
  ExternalLink,
  FileImage,
  Film,
  Globe2,
  Images,
  Layers3,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";

import ManagementShell from "@/components/management/ManagementShell";
import PillSelect from "@/components/ui/PillSelect";
import {
  brandsStorageKey,
  buildBrandHistory,
  initialBrands,
  weekDays,
  type Brand,
  type BrandHistoryItem,
  type BrandStatus,
  type ContentDepartment,
  type ContentType,
  type Platform,
  type WeekDay,
  type WeeklyScheduleItem,
} from "@/data/brands";

type RangeMode = "Lifetime" | "Month" | "Week" | "Day";

const rangeOptions: { label: string; value: RangeMode }[] = [
  { label: "Lifetime", value: "Lifetime" },
  { label: "Specific Month", value: "Month" },
  { label: "Specific Week", value: "Week" },
  { label: "Specific Day", value: "Day" },
];

const weekOptions = [1, 2, 3, 4].map((week) => ({
  label: `Week ${week}`,
  value: String(week),
}));

const contentStatusStyles: Record<BrandHistoryItem["status"], string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  "Pending Review": "bg-amber-50 text-amber-700",
  Revision: "bg-orange-50 text-orange-700",
  Delayed: "bg-red-50 text-red-700",
};

function getWeekOfMonth(date: string) {
  return Math.ceil(Number(date.slice(8, 10)) / 7);
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00`));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function BrandStatusBadge({ status }: { status: BrandStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
        status === "Active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "Active" ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {status}
    </span>
  );
}

export default function BrandDetailsPage({ brandId }: { brandId: string }) {
  const numericId = Number(brandId);
  const initialBrand =
    initialBrands.find((item) => item.id === numericId) ?? null;

  const [brand, setBrand] = useState<Brand | null>(initialBrand);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [rangeMode, setRangeMode] = useState<RangeMode>("Lifetime");
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedDay, setSelectedDay] = useState("2026-07-01");
  const [historySearch, setHistorySearch] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({
    name: initialBrand?.name ?? "",
    industry: initialBrand?.industry ?? "",
    description: initialBrand?.description ?? "",
    website: initialBrand?.website ?? "",
  });
  const [scheduleDraft, setScheduleDraft] =
    useState<WeeklyScheduleItem | null>(null);
  const [barAnimationProgress, setBarAnimationProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 1250;

    const timer = window.setTimeout(() => {
      const startedAt = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        setBarAnimationProgress(1 - Math.pow(1 - progress, 3));

        if (progress < 1) {
          frame = requestAnimationFrame(animate);
        }
      };

      frame = requestAnimationFrame(animate);
    }, 180);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = window.localStorage.getItem(brandsStorageKey);

      if (stored) {
        try {
          const brands = JSON.parse(stored) as Brand[];
          const storedBrand = brands.find((item) => item.id === numericId);

          if (storedBrand) {
            setBrand(storedBrand);
            setEditDraft({
              name: storedBrand.name,
              industry: storedBrand.industry,
              description: storedBrand.description,
              website: storedBrand.website ?? "",
            });
          }
        } catch {
          setBrand(initialBrand);
        }
      }

      setHasHydrated(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [initialBrand, numericId]);

  useEffect(() => {
    if (!hasHydrated || !brand) {
      return;
    }

    const stored = window.localStorage.getItem(brandsStorageKey);
    let brands = initialBrands;

    if (stored) {
      try {
        brands = JSON.parse(stored) as Brand[];
      } catch {
        brands = initialBrands;
      }
    }

    const nextBrands = brands.some((item) => item.id === brand.id)
      ? brands.map((item) => (item.id === brand.id ? brand : item))
      : [...brands, brand];

    window.localStorage.setItem(brandsStorageKey, JSON.stringify(nextBrands));
  }, [brand, hasHydrated]);

  const history = useMemo(
    () => (brand ? buildBrandHistory(brand) : []),
    [brand],
  );

  const monthValues = useMemo(
    () => [...new Set(history.map((item) => item.date.slice(0, 7)))],
    [history],
  );

  const monthOptions = monthValues.map((value) => ({
    label: formatMonth(value),
    value,
  }));

  const dayOptions = useMemo(() => {
    const values = history
      .filter((item) => item.date.startsWith(selectedMonth))
      .map((item) => item.date);

    return [...new Set(values)].map((value) => ({
      label: formatDay(value),
      value,
    }));
  }, [history, selectedMonth]);

  const effectiveDay = dayOptions.some((option) => option.value === selectedDay)
    ? selectedDay
    : dayOptions[0]?.value ?? selectedDay;

  const periodHistory = useMemo(() => {
    return history.filter((item) => {
      if (rangeMode === "Month") {
        return item.date.startsWith(selectedMonth);
      }

      if (rangeMode === "Week") {
        return (
          item.date.startsWith(selectedMonth) &&
          getWeekOfMonth(item.date) === Number(selectedWeek)
        );
      }

      if (rangeMode === "Day") {
        return item.date === effectiveDay;
      }

      return true;
    });
  }, [effectiveDay, history, rangeMode, selectedMonth, selectedWeek]);

  const visibleHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return periodHistory.filter(
      (item) =>
        query.length === 0 ||
        `${item.title} ${item.type} ${item.platform} ${item.assignedTo} ${item.status}`
          .toLowerCase()
          .includes(query),
    );
  }, [historySearch, periodHistory]);

  const totals = useMemo(() => {
    const count = (type: ContentType) =>
      periodHistory.filter((item) => item.type === type).length;

    return {
      total: periodHistory.length,
      posts: count("Post"),
      reels: count("Reel"),
      stories: count("Story"),
      carousels: count("Carousel"),
      completed: periodHistory.filter((item) => item.status === "Completed")
        .length,
    };
  }, [periodHistory]);

  const monthlyBreakdown = useMemo(
    () =>
      monthValues.map((month) => {
        const items = history.filter((item) => item.date.startsWith(month));

        return {
          month,
          total: items.length,
          posts: items.filter((item) => item.type === "Post").length,
          reels: items.filter((item) => item.type === "Reel").length,
          stories: items.filter((item) => item.type === "Story").length,
          carousels: items.filter((item) => item.type === "Carousel").length,
        };
      }),
    [history, monthValues],
  );

  const weeklyBreakdown = useMemo(
    () =>
      [1, 2, 3, 4].map((week) => {
        const items = history.filter(
          (item) =>
            item.date.startsWith(selectedMonth) &&
            getWeekOfMonth(item.date) === week,
        );

        return {
          week,
          total: items.length,
          posts: items.filter((item) => item.type === "Post").length,
          reels: items.filter((item) => item.type === "Reel").length,
          completed: items.filter((item) => item.status === "Completed").length,
        };
      }),
    [history, selectedMonth],
  );

  const maxMonthlyTotal = Math.max(
    ...monthlyBreakdown.map((item) => item.total),
    1,
  );

  function toggleStatus() {
    setBrand((current) =>
      current
        ? {
            ...current,
            status: current.status === "Active" ? "Paused" : "Active",
          }
        : current,
    );
  }

  function saveBrand() {
    setBrand((current) =>
      current
        ? {
            ...current,
            name: editDraft.name.trim() || current.name,
            industry: editDraft.industry.trim() || current.industry,
            description: editDraft.description.trim() || current.description,
            website: editDraft.website.trim() || undefined,
          }
        : current,
    );
    setIsEditOpen(false);
  }

  function openNewSlot() {
    setScheduleDraft({
      id: Date.now(),
      day: "Monday",
      department: "Graphic Design",
      contentType: "Static Post",
      platforms: ["Instagram"],
      publishingTime: "10:00 AM",
    });
  }

  function saveSlot() {
    if (!brand || !scheduleDraft?.contentType.trim()) {
      return;
    }

    setBrand({
      ...brand,
      weeklySchedule: [...brand.weeklySchedule, scheduleDraft],
    });
    setScheduleDraft(null);
  }

  if (!brand) {
    return (
      <ManagementShell>
        <section className="grid min-h-[520px] place-items-center rounded-[24px] border border-dashed border-[#dce2e9] bg-white p-8 text-center">
          <div>
            <p className="text-lg font-bold">Brand not found</p>
            <Link
              href="/brands"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-sm font-bold text-white"
            >
              <ArrowLeft size={16} />
              Back to Brands
            </Link>
          </div>
        </section>
      </ManagementShell>
    );
  }

  return (
    <ManagementShell>
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div className="flex items-start gap-4">
          <Link
            href="/brands"
            aria-label="Back to brands"
            className="mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-[#e5e9ef] bg-white"
          >
            <ArrowLeft size={17} />
          </Link>

          <div
            className="grid size-14 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: brand.accent }}
          >
            {brand.initials}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#2f80ed]">
                {brand.industry}
              </p>
              <BrandStatusBadge status={brand.status} />
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {brand.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#777e89]">
              {brand.description}
            </p>

            {brand.website ? (
              <a
                href={brand.website}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#2f80ed]"
              >
                <Globe2 size={15} />
                Open Website
                <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/planner"
            className="flex items-center gap-2 rounded-full bg-brand-blue-gradient px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Create Task
          </Link>
          <button
            type="button"
            onClick={openNewSlot}
            className="flex items-center gap-2 rounded-full border border-[#e5e9ef] bg-white px-5 py-2.5 text-sm font-semibold"
          >
            <CalendarDays size={16} />
            Add Slot
          </button>
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[#e5e9ef] bg-white px-5 py-2.5 text-sm font-semibold"
          >
            <Pencil size={16} />
            Edit Brand
          </button>
          <button
            type="button"
            onClick={toggleStatus}
            className="flex items-center gap-2 rounded-full border border-[#e5e9ef] bg-white px-5 py-2.5 text-sm font-semibold"
          >
            {brand.status === "Active" ? (
              <CirclePause size={16} />
            ) : (
              <Check size={16} />
            )}
            {brand.status === "Active" ? "Pause Brand" : "Resume Brand"}
          </button>
        </div>
      </section>

      <section className="page-section-gap rounded-[24px] border border-[#edf0f5] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <PillSelect
            value={rangeMode}
            options={rangeOptions}
            onValueChange={setRangeMode}
            ariaLabel="Select brand history range"
            menuAlign="left"
          />

          {rangeMode !== "Lifetime" ? (
            <PillSelect
              value={selectedMonth}
              options={monthOptions}
              onValueChange={setSelectedMonth}
              ariaLabel="Select month"
              menuAlign="left"
            />
          ) : null}

          {rangeMode === "Week" ? (
            <PillSelect
              value={selectedWeek}
              options={weekOptions}
              onValueChange={setSelectedWeek}
              ariaLabel="Select week"
              menuAlign="left"
            />
          ) : null}

          {rangeMode === "Day" && dayOptions.length > 0 ? (
            <PillSelect
              value={effectiveDay}
              options={dayOptions}
              onValueChange={setSelectedDay}
              ariaLabel="Select day"
              menuAlign="left"
            />
          ) : null}
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total Content",
            value: totals.total,
            icon: Layers3,
            featured: true,
          },
          {
            label: "Posts",
            value: totals.posts,
            icon: FileImage,
            tone: "bg-blue-50 text-blue-600",
          },
          {
            label: "Reels",
            value: totals.reels,
            icon: Film,
            tone: "bg-violet-50 text-violet-600",
          },
          {
            label: "Stories",
            value: totals.stories,
            icon: Images,
            tone: "bg-amber-50 text-amber-600",
          },
          {
            label: "Completed",
            value: totals.completed,
            icon: Check,
            tone: "bg-emerald-50 text-emerald-600",
          },
        ].map(({ label, value, icon: Icon, featured, tone }) => (
          <article
            key={label}
            className={`rounded-[22px] p-5 ${
              featured
                ? "bg-brand-blue-gradient text-white shadow-[0_18px_40px_rgba(47,128,237,0.18)]"
                : "border border-[#edf0f5] bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`text-sm ${
                    featured ? "text-white/75" : "text-[#7d8490]"
                  }`}
                >
                  {label}
                </p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
              </div>

              <div
                className={`grid size-11 place-items-center rounded-full ${
                  featured ? "bg-white text-[#2f80ed]" : tone
                }`}
              >
                <Icon size={19} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold">Monthly Output</h2>
            <p className="mt-1 text-xs text-[#9299a4]">
              Month-wise content production since work started
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {monthlyBreakdown.map((item) => (
              <button
                key={item.month}
                type="button"
                onClick={() => {
                  setSelectedMonth(item.month);
                  setRangeMode("Month");
                }}
                className="block w-full text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold">{formatMonth(item.month)}</p>
                  <p className="text-xs font-bold text-[#2f80ed]">
                    {item.total} items
                  </p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edf1f6]">
                  <div
                    className="h-full rounded-full bg-brand-blue-gradient"
                    style={{
                      width: `${
                        (item.total / maxMonthlyTotal) *
                        100 *
                        barAnimationProgress
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-[#9299a4]">
                  {item.posts} posts, {item.reels} reels, {item.stories} stories,{" "}
                  {item.carousels} carousels
                </p>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold">Assigned Team</h2>
            <p className="mt-1 text-xs text-[#9299a4]">
              Current brand contributors
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[20px] border border-[#e7ebf0] p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <FileImage size={17} />
                </div>
                <div>
                  <p className="text-xs font-bold">Graphic Design</p>
                  <p className="mt-1 text-[10px] text-[#9299a4]">
                    {brand.graphicDesigners.length} assigned
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {brand.graphicDesigners.map((member) => (
                  <span
                    key={member}
                    className="rounded-full bg-[#edf5ff] px-3 py-2 text-[10px] font-bold text-[#2f80ed]"
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[#e7ebf0] p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <Film size={17} />
                </div>
                <div>
                  <p className="text-xs font-bold">Video Editing</p>
                  <p className="mt-1 text-[10px] text-[#9299a4]">
                    {brand.videoEditors.length} assigned
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {brand.videoEditors.map((member) => (
                  <span
                    key={member}
                    className="rounded-full bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-700"
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white">
        <div className="border-b border-[#f0f2f5] p-5 sm:p-6">
          <h2 className="text-lg font-bold">Weekly Breakdown</h2>
          <p className="mt-1 text-xs text-[#9299a4]">
            {formatMonth(selectedMonth)} output by week
          </p>
        </div>
        <div className="dashboard-scrollbar overflow-x-auto">
          <SystemTable columns={5} minWidth={1040} cellWidth={160}>

            <thead className="bg-[#fafbfc] text-[10px] uppercase tracking-[0.08em] text-[#949ba6]">
              <tr>
                <th className="px-6 py-4">Week</th>
                <th className="px-6 py-4">Posts</th>
                <th className="px-6 py-4">Reels</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-left">Completed</th>
              </tr>
            </thead>
            <tbody>
              {weeklyBreakdown.map((item) => (
                <tr
                  key={item.week}
                  onClick={() => {
                    setSelectedWeek(String(item.week));
                    setRangeMode("Week");
                  }}
                  className="cursor-pointer border-t border-[#f0f2f5] transition hover:bg-[#fafcff]"
                >
                  <td className="px-6 py-4 text-sm font-bold">
                    Week {item.week}
                  </td>
                  <td className="px-6 py-4 text-sm">{item.posts}</td>
                  <td className="px-6 py-4 text-sm">{item.reels}</td>
                  <td className="px-6 py-4 text-sm font-bold">{item.total}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-[#edf1f6]">
                        <div
                          className="h-full rounded-full bg-brand-blue-gradient"
                          style={{
                            width: `${
                              (item.total === 0
                                ? 0
                                : (item.completed / item.total) * 100) *
                              barAnimationProgress
                            }%`,
                          }}
                        />
                      </div>

                      <span className="min-w-9 text-xs font-bold text-[#2f80ed]">
                        {item.total === 0
                          ? "0%"
                          : `${Math.round(
                              (item.completed / item.total) * 100,
                            )}%`}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </SystemTable>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f5] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-bold">Complete Content History</h2>
            <p className="mt-1 text-xs text-[#9299a4]">
              Drill down from lifetime to an exact day
            </p>
          </div>

          <label className="flex h-11 min-w-[240px] items-center gap-2 rounded-full bg-[#f5f7fa] px-4">
            <Search size={15} className="text-[#858c97]" />
            <input
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search content history..."
              className="w-full bg-transparent text-xs outline-none"
            />
          </label>
        </div>

        <div className="dashboard-scrollbar overflow-x-auto">
          <SystemTable columns={6} minWidth={1180} cellWidth={160}>

            <thead className="bg-[#fafbfc] text-[10px] uppercase tracking-[0.08em] text-[#949ba6]">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleHistory.map((item) => (
                <tr key={item.id} className="border-t border-[#f0f2f5]">
                  <td className="px-6 py-4 text-xs font-semibold">
                    {formatDay(item.date)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">{item.title}</td>
                  <td className="px-6 py-4 text-xs">{item.type}</td>
                  <td className="px-6 py-4 text-xs">{item.platform}</td>
                  <td className="px-6 py-4 text-xs font-semibold">
                    {item.assignedTo}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${
                        contentStatusStyles[item.status]
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </SystemTable>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <article className="rounded-[24px] border border-[#edf0f5] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Publishing Schedule</h2>
              <p className="mt-1 text-xs text-[#9299a4]">
                Current Monday to Friday plan
              </p>
            </div>
            <button
              type="button"
              onClick={openNewSlot}
              className="flex items-center gap-2 rounded-full bg-[#edf5ff] px-4 py-2 text-xs font-bold text-[#2f80ed]"
            >
              <Plus size={14} />
              Add Slot
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {weekDays.map((day) => {
              const items = brand.weeklySchedule.filter(
                (item) => item.day === day,
              );

              return (
                <div
                  key={day}
                  className="rounded-[18px] border border-[#e7ebf0] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">{day}</p>
                    <p className="text-[10px] text-[#9299a4]">
                      {items.length} slots
                    </p>
                  </div>

                  {items.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-[#f7f9fc] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold">
                                {item.contentType}
                              </p>
                              <p className="mt-1 text-[9px] text-[#9299a4]">
                                {item.department} - {item.platforms.join(", ")}
                              </p>
                            </div>
                            <p className="text-[10px] font-bold">
                              {item.publishingTime}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[#adb4bf]">
                      No content scheduled.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </article>

        <article className="flex h-full flex-col rounded-[24px] border border-[#edf0f5] bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold">Brand Activity Log</h2>
            <p className="mt-1 text-xs text-[#9299a4]">
              Dated brand, team and workflow events
            </p>
          </div>

          <div className="mt-5 flex-1">
            <div className="relative before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-[#dfe6ef]">
              {[
                {
                  event: "Brand profile created",
                  date: "2026-04-15",
                  detail: "Brand account added to CreativeOps.",
                },
                {
                  event: "Graphic Design team assigned",
                  date: "2026-04-16",
                  detail:
                    brand.graphicDesigners.length > 0
                      ? `${brand.graphicDesigners.join(", ")} assigned.`
                      : "No Graphic Designers assigned.",
                },
                {
                  event: "Video Editing team assigned",
                  date: "2026-04-18",
                  detail:
                    brand.videoEditors.length > 0
                      ? `${brand.videoEditors.join(", ")} assigned.`
                      : "No Video Editors assigned.",
                },
                {
                  event: "Weekly schedule updated",
                  date: "2026-07-20",
                  detail: `${brand.weeklySchedule.length} active content slots configured.`,
                },
                {
                  event: "Latest submission approved",
                  date: "2026-07-25",
                  detail: "Most recent content submission marked completed.",
                },
                {
                  event:
                    brand.status === "Active"
                      ? "Brand is active"
                      : "Brand was paused",
                  date: "2026-07-27",
                  detail:
                    brand.status === "Active"
                      ? "New tasks and schedule updates are currently allowed."
                      : "New production activity is currently paused.",
                },
              ].map((item) => (
                <div
                  key={`${item.event}-${item.date}`}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  <div className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full border-2 border-white bg-[#2f80ed] shadow-[0_0_0_2px_#dbeafe]" />

                  <div className="min-w-0">
                    <p className="text-xs font-bold">{item.event}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#2f80ed]">
                      {formatDay(item.date)}
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-[#9299a4]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[#edf0f5] pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
              Activity Summary
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#f7f9fc] p-3">
                <p className="text-[9px] font-bold uppercase text-[#969da8]">
                  Events
                </p>
                <p className="mt-2 text-lg font-bold">6</p>
              </div>

              <div className="rounded-2xl bg-[#f7f9fc] p-3">
                <p className="text-[9px] font-bold uppercase text-[#969da8]">
                  Slots
                </p>
                <p className="mt-2 text-lg font-bold">
                  {brand.weeklySchedule.length}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f9fc] p-3">
                <p className="text-[9px] font-bold uppercase text-[#969da8]">
                  Status
                </p>
                <p
                  className={`mt-2 text-xs font-bold ${
                    brand.status === "Active"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {brand.status}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      {isEditOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#111827]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[26px] bg-white">
            <header className="flex items-center justify-between border-b border-[#edf0f5] p-5">
              <h2 className="text-xl font-bold">Edit Brand</h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-4 p-5">
              {[
                ["Brand name", "name"],
                ["Industry", "industry"],
                ["Website", "website"],
              ].map(([label, field]) => (
                <label key={field} className="block">
                  <span className="text-xs font-bold text-[#4d5560]">
                    {label}
                  </span>
                  <input
                    value={editDraft[field as keyof typeof editDraft]}
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none focus:border-[#2f80ed]"
                  />
                </label>
              ))}

              <label className="block">
                <span className="text-xs font-bold text-[#4d5560]">
                  Description
                </span>
                <textarea
                  rows={4}
                  value={editDraft.description}
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 w-full resize-none rounded-2xl border border-[#e5e9ef] p-4 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <button
                type="button"
                onClick={saveBrand}
                className="w-full rounded-full bg-[#2f80ed] px-5 py-3 text-sm font-bold text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {scheduleDraft ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#111827]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[26px] bg-white">
            <header className="flex items-center justify-between border-b border-[#edf0f5] p-5">
              <h2 className="text-xl font-bold">Add Schedule Slot</h2>
              <button
                type="button"
                onClick={() => setScheduleDraft(null)}
                className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label>
                <span className="text-xs font-bold text-[#4d5560]">Day</span>
                <PillSelect<WeekDay>
                  value={scheduleDraft.day}
                  options={weekDays.map((value) => ({ label: value, value }))}
                  onValueChange={(day) =>
                    setScheduleDraft({ ...scheduleDraft, day })
                  }
                  ariaLabel="Select schedule day"
                  variant="field"
                  fullWidth
                />
              </label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Department
                </span>
                <PillSelect<ContentDepartment>
                  value={scheduleDraft.department}
                  options={[
                    { label: "Graphic Design", value: "Graphic Design" },
                    { label: "Video Editing", value: "Video Editing" },
                  ]}
                  onValueChange={(department) =>
                    setScheduleDraft({ ...scheduleDraft, department })
                  }
                  ariaLabel="Select schedule department"
                  variant="field"
                  fullWidth
                />
              </label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Content type
                </span>
                <input
                  value={scheduleDraft.contentType}
                  onChange={(event) =>
                    setScheduleDraft({
                      ...scheduleDraft,
                      contentType: event.target.value,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Publishing time
                </span>
                <input
                  value={scheduleDraft.publishingTime}
                  onChange={(event) =>
                    setScheduleDraft({
                      ...scheduleDraft,
                      publishingTime: event.target.value,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  Platforms
                </span>
                <input
                  value={scheduleDraft.platforms.join(", ")}
                  onChange={(event) =>
                    setScheduleDraft({
                      ...scheduleDraft,
                      platforms: event.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean) as Platform[],
                    })
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-[#e5e9ef] px-4 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <button
                type="button"
                onClick={saveSlot}
                className="sm:col-span-2 rounded-full bg-[#2f80ed] px-5 py-3 text-sm font-bold text-white"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ManagementShell>
  );
}
