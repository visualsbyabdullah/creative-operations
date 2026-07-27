"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CalendarDays,
  CirclePause,
  ExternalLink,
  FileImage,
  Film,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import EmployeeHeader from "@/components/layout/EmployeeHeader";
import PillSelect from "@/components/ui/PillSelect";
import {
  brandsStorageKey,
  initialBrands,
  type Brand,
  type BrandStatus,
} from "@/data/brands";

type DepartmentFilter =
  | "All Departments"
  | "Graphic Design"
  | "Video Editing";

type StatusFilter = "All Statuses" | BrandStatus;

const statusFilterOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Statuses", value: "All Statuses" },
  { label: "Active", value: "Active" },
  { label: "Paused", value: "Paused" },
];

const departmentFilterOptions: { label: string; value: DepartmentFilter }[] = [
  { label: "All Departments", value: "All Departments" },
  { label: "Graphic Design", value: "Graphic Design" },
  { label: "Video Editing", value: "Video Editing" },
];

function BrandStatusBadge({ status }: { status: BrandStatus }) {
  const className =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${className}`}>
      <span
        className={`size-1.5 rounded-full ${
          status === "Active" ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {status}
    </span>
  );
}

export default function BrandsManagement() {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All Statuses");
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilter>("All Departments");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: "",
    industry: "",
    description: "",
    website: "",
    accent: "#2f80ed",
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = window.localStorage.getItem(brandsStorageKey);

      if (stored) {
        try {
          setBrands(JSON.parse(stored) as Brand[]);
        } catch {
          setBrands(initialBrands);
        }
      }

      setHasHydrated(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      window.localStorage.setItem(brandsStorageKey, JSON.stringify(brands));
    }
  }, [brands, hasHydrated]);

  const filteredBrands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return brands.filter((brand) => {
      const searchMatches =
        query.length === 0 ||
        brand.name.toLowerCase().includes(query) ||
        brand.industry.toLowerCase().includes(query);

      const statusMatches =
        statusFilter === "All Statuses" || brand.status === statusFilter;

      const departmentMatches =
        departmentFilter === "All Departments" ||
        (departmentFilter === "Graphic Design" &&
          brand.graphicDesigners.length > 0) ||
        (departmentFilter === "Video Editing" &&
          brand.videoEditors.length > 0);

      return searchMatches && statusMatches && departmentMatches;
    });
  }, [brands, departmentFilter, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const active = brands.filter((brand) => brand.status === "Active").length;
    const weekly = brands.reduce(
      (total, brand) => total + brand.weeklySchedule.length,
      0,
    );
    const coverage = brands.reduce(
      (total, brand) =>
        total +
        Number(brand.graphicDesigners.length > 0) +
        Number(brand.videoEditors.length > 0),
      0,
    );

    return { total: brands.length, active, weekly, coverage };
  }, [brands]);

  function toggleBrandStatus(brandId: number) {
    setBrands((current) =>
      current.map((brand) =>
        brand.id === brandId
          ? {
              ...brand,
              status: brand.status === "Active" ? "Paused" : "Active",
            }
          : brand,
      ),
    );
  }

  function addBrand() {
    if (!newBrand.name.trim() || !newBrand.industry.trim()) {
      return;
    }

    const initials = newBrand.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    setBrands((current) => [
      ...current,
      {
        id: Date.now(),
        name: newBrand.name.trim(),
        initials,
        industry: newBrand.industry.trim(),
        status: "Active",
        accent: newBrand.accent,
        description:
          newBrand.description.trim() ||
          "Brand description has not been added yet.",
        website: newBrand.website.trim() || undefined,
        graphicDesigners: [],
        videoEditors: [],
        platforms: [],
        weeklySchedule: [],
      },
    ]);

    setNewBrand({
      name: "",
      industry: "",
      description: "",
      website: "",
      accent: "#2f80ed",
    });
    setIsAddModalOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#e7ebf2] p-3 sm:p-6 xl:p-10">
      <section className="mx-auto max-w-[1600px] overflow-hidden rounded-[26px] border border-white/80 bg-[#fbfcfe] shadow-[0_30px_80px_rgba(50,63,86,0.10)]">
        <EmployeeHeader
          variant="management"
          workspaceLabel="Management workspace"
        />

        <div className="px-4 py-7 sm:px-6 sm:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#2f80ed]">
                Content accounts
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Brands
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">
                Manage brand assignments, schedules, platforms and long-term
                content history from one workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-[#2f80ed] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1769d2]"
            >
              <Plus size={17} />
              Add Brand
            </button>
          </section>

          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Brands",
                value: stats.total,
                caption: "Managed brand accounts",
                icon: Sparkles,
                featured: true,
              },
              {
                label: "Active Brands",
                value: stats.active,
                caption: "Currently publishing",
                icon: Check,
                tone: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "Weekly Content",
                value: stats.weekly,
                caption: "Scheduled content slots",
                icon: CalendarDays,
                tone: "bg-blue-50 text-blue-600",
              },
              {
                label: "Department Coverage",
                value: stats.coverage,
                caption: "Graphic and video assignments",
                icon: Users,
                tone: "bg-violet-50 text-violet-600",
              },
            ].map(({ label, value, caption, icon: Icon, featured, tone }) => (
              <article
                key={label}
                className={`kpi-card-hover rounded-[22px] p-5 ${
                  featured
                    ? "bg-brand-blue-gradient text-white shadow-[0_18px_40px_rgba(47,128,237,0.20)]"
                    : "border border-[#edf0f5] bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm ${featured ? "text-white/75" : "text-[#7d8490]"}`}>
                      {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold">{value}</p>
                    <p className={`mt-3 text-xs ${featured ? "text-white/70" : "text-[#959ca7]"}`}>
                      {caption}
                    </p>
                  </div>
                  <div
                    className={`grid size-11 place-items-center rounded-full ${
                      featured ? "bg-white text-[#2f80ed]" : tone
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-5 rounded-[24px] border border-[#edf0f5] bg-white p-4 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold">Brand Directory</h2>
                <p className="mt-1 text-xs text-[#9299a4]">
                  {filteredBrands.length} brands matching current filters
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex h-11 min-w-[220px] items-center gap-2.5 rounded-full bg-[#f5f7fa] px-4">
                  <Search size={15} className="shrink-0 text-[#858c97]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search brands..."
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </label>

                <PillSelect
                  icon={Check}
                  ariaLabel="Filter brands by status"
                  value={statusFilter}
                  options={statusFilterOptions}
                  onValueChange={setStatusFilter}
                />

                <PillSelect
                  icon={Users}
                  ariaLabel="Filter brands by department"
                  value={departmentFilter}
                  options={departmentFilterOptions}
                  onValueChange={setDepartmentFilter}
                />
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBrands.map((brand) => (
              <article
                key={brand.id}
                className="group rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_12px_35px_rgba(24,39,75,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(24,39,75,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white"
                      style={{ backgroundColor: brand.accent }}
                    >
                      {brand.initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold">
                        {brand.name}
                      </h3>
                      <p className="mt-1 truncate text-[11px] text-[#9299a4]">
                        {brand.industry}
                      </p>
                    </div>
                  </div>
                  <BrandStatusBadge status={brand.status} />
                </div>

                <p className="mt-5 line-clamp-3 min-h-[60px] text-sm leading-5 text-[#747c87]">
                  {brand.description}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-[#f7f9fc] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-[#969da8]">
                      Posts
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {
                        brand.weeklySchedule.filter(
                          (item) => item.department === "Graphic Design",
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f9fc] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-[#969da8]">
                      Reels
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {
                        brand.weeklySchedule.filter(
                          (item) => item.department === "Video Editing",
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f9fc] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-[#969da8]">
                      Platforms
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {brand.platforms.length}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[#969da8]">
                    Assigned Team
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] text-[#626a75]">
                        <FileImage size={14} className="text-[#2f80ed]" />
                        Graphic
                      </div>
                      <span className="truncate text-[11px] font-bold">
                        {brand.graphicDesigners.length > 0
                          ? brand.graphicDesigners.join(", ")
                          : "Not assigned"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] text-[#626a75]">
                        <Film size={14} className="text-violet-600" />
                        Video
                      </div>
                      <span className="truncate text-[11px] font-bold">
                        {brand.videoEditors.length > 0
                          ? brand.videoEditors.join(", ")
                          : "Not assigned"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#f0f2f5] pt-4">
                  <button
                    type="button"
                    onClick={() => toggleBrandStatus(brand.id)}
                    className="flex items-center gap-2 text-[11px] font-bold text-[#6b7380]"
                  >
                    {brand.status === "Active" ? (
                      <CirclePause size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                    {brand.status === "Active"
                      ? "Pause Brand"
                      : "Activate Brand"}
                  </button>

                  <Link
                    href={`/brands/${brand.id}`}
                    className="flex items-center gap-2 rounded-full border border-[#e6eaf0] px-4 py-2 text-[10px] font-bold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                  >
                    Open Brand
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </section>

          {filteredBrands.length === 0 ? (
            <section className="mt-5 grid min-h-72 place-items-center rounded-[24px] border border-dashed border-[#dce2e9] bg-white p-8 text-center">
              <div>
                <Search size={28} className="mx-auto text-[#adb4bf]" />
                <p className="mt-3 text-sm font-bold">No matching brands</p>
                <p className="mt-1 text-xs text-[#9299a4]">
                  Adjust the search or filters and try again.
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="dashboard-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <header className="flex items-center justify-between border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">Add New Brand</h2>
                <p className="mt-1 text-xs text-[#8b929d]">
                  Create the profile now. Team and schedule can be assigned
                  later.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-[#f5f7fa]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Brand name
                </span>
                <input
                  value={newBrand.name}
                  onChange={(event) =>
                    setNewBrand((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[#e5e9ef] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">
                  Industry
                </span>
                <input
                  value={newBrand.industry}
                  onChange={(event) =>
                    setNewBrand((current) => ({
                      ...current,
                      industry: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[#e5e9ef] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  Website
                </span>
                <input
                  type="url"
                  value={newBrand.website}
                  onChange={(event) =>
                    setNewBrand((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[#e5e9ef] px-4 py-3 text-sm outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  Description
                </span>
                <textarea
                  rows={4}
                  value={newBrand.description}
                  onChange={(event) =>
                    setNewBrand((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 w-full resize-none rounded-2xl border border-[#e5e9ef] p-4 text-sm leading-6 outline-none focus:border-[#2f80ed]"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#4d5560]">
                  Brand accent colour
                </span>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5e9ef] p-3">
                  <input
                    type="color"
                    value={newBrand.accent}
                    onChange={(event) =>
                      setNewBrand((current) => ({
                        ...current,
                        accent: event.target.value,
                      }))
                    }
                    className="size-10 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                  />
                  <input
                    value={newBrand.accent}
                    onChange={(event) =>
                      setNewBrand((current) => ({
                        ...current,
                        accent: event.target.value,
                      }))
                    }
                    className="flex-1 bg-transparent text-sm font-semibold outline-none"
                  />
                </div>
              </label>
            </div>

            <footer className="flex justify-end gap-3 border-t border-[#edf0f5] p-5 sm:p-6">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full border border-[#e5e9ef] px-5 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addBrand}
                disabled={!newBrand.name.trim() || !newBrand.industry.trim()}
                className="rounded-full bg-[#2f80ed] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add Brand
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </main>
  );
}
