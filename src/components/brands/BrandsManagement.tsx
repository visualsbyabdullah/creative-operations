"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import PillSelect from "@/components/ui/PillSelect";

import {
  Bell,
  BriefcaseBusiness,
  Camera,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePause,
  Clock3,
  ExternalLink,
  FileImage,
  Film,
  Globe2,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  MoreHorizontal,
  Palette,
  PlaySquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type BrandStatus = "Active" | "Paused";

type DepartmentFilter =
  | "All Departments"
  | "Graphic Design"
  | "Video Editing";

type StatusFilter =
  | "All Statuses"
  | BrandStatus;

type WeekDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

type ContentDepartment =
  | "Graphic Design"
  | "Video Editing";

type Platform =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "TikTok"
  | "YouTube";

type WeeklyScheduleItem = {
  id: number;
  day: WeekDay;
  department: ContentDepartment;
  contentType: string;
  platforms: Platform[];
  publishingTime: string;
};

type Brand = {
  id: number;
  name: string;
  initials: string;
  industry: string;
  status: BrandStatus;
  accent: string;
  description: string;
  website?: string;
  graphicDesigners: string[];
  videoEditors: string[];
  platforms: Platform[];
  weeklySchedule: WeeklyScheduleItem[];
};

const navigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "My Tasks",
    href: "/tasks",
    icon: ListChecks,
  },
  {
    label: "Planner",
    href: "/planner",
    icon: CalendarDays,
  },
  {
    label: "Brands",
    href: "/brands",
    icon: Sparkles,
  },
  {
    label: "Team",
    href: "/team",
    icon: Users,
  },
];

const weekDays: WeekDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const statusFilterOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All Statuses",
    value: "All Statuses",
  },
  {
    label: "Active",
    value: "Active",
  },
  {
    label: "Paused",
    value: "Paused",
  },
];

const departmentFilterOptions: {
  label: string;
  value: DepartmentFilter;
}[] = [
  {
    label: "All Departments",
    value: "All Departments",
  },
  {
    label: "Graphic Design",
    value: "Graphic Design",
  },
  {
    label: "Video Editing",
    value: "Video Editing",
  },
];

const platformIcons: Record<
  Platform,
  typeof Camera
> = {
  Instagram: Camera,
  Facebook: MessageCircle,
  LinkedIn: BriefcaseBusiness,
  TikTok: Film,
  YouTube: PlaySquare,
};

const initialBrands: Brand[] = [
  {
    id: 1,
    name: "Softgenie",
    initials: "SG",
    industry: "AI Marketing Technology",
    status: "Active",
    accent: "#2f80ed",
    description:
      "AI-powered digital marketing campaign management platform for planning, personalisation and publishing.",
    website: "https://softgenie.example.com",
    graphicDesigners: [
      "Abdullah Naeem",
      "Ali Raza",
    ],
    videoEditors: [
      "Hamza Khan",
      "Usman Ali",
    ],
    platforms: [
      "Instagram",
      "Facebook",
      "LinkedIn",
    ],
    weeklySchedule: [
      {
        id: 1,
        day: "Monday",
        department: "Graphic Design",
        contentType: "Carousel",
        platforms: [
          "Instagram",
          "Facebook",
        ],
        publishingTime: "11:30 AM",
      },
      {
        id: 2,
        day: "Wednesday",
        department: "Video Editing",
        contentType: "Reel",
        platforms: ["Instagram"],
        publishingTime: "4:00 PM",
      },
      {
        id: 3,
        day: "Friday",
        department: "Graphic Design",
        contentType: "Static Post",
        platforms: ["LinkedIn"],
        publishingTime: "1:00 PM",
      },
    ],
  },
  {
    id: 2,
    name: "Softech",
    initials: "ST",
    industry: "Business Services",
    status: "Active",
    accent: "#b4161e",
    description:
      "Digital transformation, automation, software development and business support services.",
    website:
      "https://www.softechbusinessservices.com/",
    graphicDesigners: [
      "Abdullah Naeem",
      "Ali Raza",
    ],
    videoEditors: ["Hamza Khan"],
    platforms: [
      "LinkedIn",
      "Instagram",
      "Facebook",
    ],
    weeklySchedule: [
      {
        id: 4,
        day: "Monday",
        department: "Graphic Design",
        contentType: "Static Post",
        platforms: ["LinkedIn"],
        publishingTime: "2:00 PM",
      },
      {
        id: 5,
        day: "Wednesday",
        department: "Graphic Design",
        contentType: "Carousel",
        platforms: ["LinkedIn"],
        publishingTime: "12:00 PM",
      },
      {
        id: 6,
        day: "Thursday",
        department: "Video Editing",
        contentType: "Reel",
        platforms: [
          "Instagram",
          "LinkedIn",
        ],
        publishingTime: "5:00 PM",
      },
    ],
  },
  {
    id: 3,
    name: "MARK47",
    initials: "M7",
    industry: "Esports Technology",
    status: "Active",
    accent: "#ff7a00",
    description:
      "PUBG Mobile esports broadcasting overlay software and live match visual system.",
    graphicDesigners: ["Abdullah Naeem"],
    videoEditors: ["Usman Ali"],
    platforms: [
      "Instagram",
      "YouTube",
      "Facebook",
    ],
    weeklySchedule: [
      {
        id: 7,
        day: "Tuesday",
        department: "Graphic Design",
        contentType: "Match Graphic",
        platforms: ["Instagram"],
        publishingTime: "12:00 PM",
      },
      {
        id: 8,
        day: "Thursday",
        department: "Video Editing",
        contentType: "Product Reel",
        platforms: [
          "Instagram",
          "YouTube",
        ],
        publishingTime: "4:30 PM",
      },
    ],
  },
  {
    id: 4,
    name: "Solentrix",
    initials: "SX",
    industry: "Solar Energy",
    status: "Active",
    accent: "#1f9d63",
    description:
      "Residential and commercial solar energy products, installation and renewable energy solutions.",
    website:
      "https://www.solentrixtraders.com/",
    graphicDesigners: ["Ali Raza"],
    videoEditors: ["Hamza Khan"],
    platforms: [
      "Instagram",
      "Facebook",
      "LinkedIn",
    ],
    weeklySchedule: [
      {
        id: 9,
        day: "Tuesday",
        department: "Video Editing",
        contentType: "Product Reel",
        platforms: ["Instagram"],
        publishingTime: "3:00 PM",
      },
      {
        id: 10,
        day: "Friday",
        department: "Graphic Design",
        contentType: "Product Post",
        platforms: [
          "Instagram",
          "Facebook",
        ],
        publishingTime: "12:30 PM",
      },
    ],
  },
  {
    id: 5,
    name: "E-Bazaar",
    initials: "EB",
    industry: "Retail Technology",
    status: "Paused",
    accent: "#8b5cf6",
    description:
      "Point-of-sale and retail management platform for billing, inventory, customers and reporting.",
    graphicDesigners: ["Ali Raza"],
    videoEditors: ["Usman Ali"],
    platforms: [
      "LinkedIn",
      "Facebook",
    ],
    weeklySchedule: [
      {
        id: 11,
        day: "Wednesday",
        department: "Graphic Design",
        contentType: "Carousel",
        platforms: [
          "LinkedIn",
          "Facebook",
        ],
        publishingTime: "1:00 PM",
      },
    ],
  },
  {
    id: 6,
    name: "Audit Tracker",
    initials: "AT",
    industry: "Audit Software",
    status: "Active",
    accent: "#0f766e",
    description:
      "Audit planning, tracking, evidence collection and reporting workflow management platform.",
    graphicDesigners: ["Abdullah Naeem"],
    videoEditors: [],
    platforms: ["LinkedIn"],
    weeklySchedule: [
      {
        id: 12,
        day: "Thursday",
        department: "Graphic Design",
        contentType: "Banner",
        platforms: ["LinkedIn"],
        publishingTime: "11:00 AM",
      },
    ],
  },
];

function BrandStatusBadge({
  status,
}: {
  status: BrandStatus;
}) {
  const className =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${className}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "Active"
            ? "bg-emerald-500"
            : "bg-amber-500"
        }`}
      />

      {status}
    </span>
  );
}

function PlatformPill({
  platform,
}: {
  platform: Platform;
}) {
  const Icon = platformIcons[platform];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#e7ebf0] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#626a75]">
      <Icon size={13} />
      {platform}
    </span>
  );
}

export default function BrandsManagement() {
  const [brands, setBrands] =
    useState<Brand[]>(initialBrands);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All Statuses");

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState<DepartmentFilter>(
    "All Departments",
  );

  const [selectedBrandId, setSelectedBrandId] =
    useState<number | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] =
    useState(false);

  const [newBrand, setNewBrand] = useState({
    name: "",
    industry: "",
    description: "",
    website: "",
    accent: "#2f80ed",
  });

  const selectedBrand =
    brands.find(
      (brand) => brand.id === selectedBrandId,
    ) ?? null;

  const filteredBrands = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return brands.filter((brand) => {
      const searchMatches =
        query.length === 0 ||
        brand.name
          .toLowerCase()
          .includes(query) ||
        brand.industry
          .toLowerCase()
          .includes(query);

      const statusMatches =
        statusFilter === "All Statuses" ||
        brand.status === statusFilter;

      const departmentMatches =
        departmentFilter ===
          "All Departments" ||
        (departmentFilter ===
          "Graphic Design" &&
          brand.graphicDesigners.length > 0) ||
        (departmentFilter ===
          "Video Editing" &&
          brand.videoEditors.length > 0);

      return (
        searchMatches &&
        statusMatches &&
        departmentMatches
      );
    });
  }, [
    brands,
    searchQuery,
    statusFilter,
    departmentFilter,
  ]);

  const stats = useMemo(() => {
    const activeBrands = brands.filter(
      (brand) => brand.status === "Active",
    ).length;

    const totalScheduleItems = brands.reduce(
      (total, brand) =>
        total + brand.weeklySchedule.length,
      0,
    );

    const graphicBrands = brands.filter(
      (brand) =>
        brand.graphicDesigners.length > 0,
    ).length;

    const videoBrands = brands.filter(
      (brand) => brand.videoEditors.length > 0,
    ).length;

    return {
      total: brands.length,
      active: activeBrands,
      totalScheduleItems,
      graphicBrands,
      videoBrands,
    };
  }, [brands]);

  function toggleBrandStatus(brandId: number) {
    setBrands((currentBrands) =>
      currentBrands.map((brand) =>
        brand.id === brandId
          ? {
              ...brand,
              status:
                brand.status === "Active"
                  ? "Paused"
                  : "Active",
            }
          : brand,
      ),
    );
  }

  function addBrand() {
    if (
      !newBrand.name.trim() ||
      !newBrand.industry.trim()
    ) {
      return;
    }

    const initials = newBrand.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const brand: Brand = {
      id: Date.now(),
      name: newBrand.name.trim(),
      initials,
      industry: newBrand.industry.trim(),
      status: "Active",
      accent: newBrand.accent,
      description:
        newBrand.description.trim() ||
        "Brand description has not been added yet.",
      website:
        newBrand.website.trim() || undefined,
      graphicDesigners: [],
      videoEditors: [],
      platforms: [],
      weeklySchedule: [],
    };

    setBrands((currentBrands) => [
      ...currentBrands,
      brand,
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
        <header className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex min-h-20 items-center justify-between gap-4 rounded-[22px] border border-[#f0f2f6] bg-white px-4 shadow-[0_12px_34px_rgba(24,39,75,0.04)] sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="grid size-10 place-items-center rounded-full bg-brand-blue-gradient text-white shadow-lg shadow-blue-200">
                <Palette size={20} />
              </div>

              <div>
                <p className="text-lg font-bold tracking-[-0.04em]">
                  CreativeOps
                </p>

                <p className="hidden text-[11px] text-[#939aa5] sm:block">
                  Creative operations workspace
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
                    href === "/brands";

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
                aria-label="Notifications"
                className="relative grid size-10 place-items-center rounded-full border border-[#edf0f4] bg-white"
              >
                <Bell size={18} />

                <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              <button
                type="button"
                aria-label="Settings"
                className="hidden size-10 place-items-center rounded-full border border-[#edf0f4] bg-white sm:grid"
              >
                <Settings size={18} />
              </button>

              <div className="ml-1 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-[#1d2430] text-sm font-bold text-white">
                  AN
                </div>

                <div className="hidden xl:block">
                  <p className="text-sm font-bold">
                    Abdullah Naeem
                  </p>

                  <p className="text-[11px] text-[#9299a4]">
                    Graphic Designer
                  </p>
                </div>

                <ChevronDown
                  size={16}
                  className="hidden text-[#7b828d] xl:block"
                />
              </div>
            </div>
          </div>
        </header>

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
                Brand assignments, weekly posting
                schedules, platforms aur creative
                teams manage karo.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsAddModalOpen(true)
              }
              className="flex items-center gap-2 rounded-full bg-[#2f80ed] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1769d2]"
            >
              <Plus size={17} />
              Add Brand
            </button>
          </section>

          <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="kpi-card-hover rounded-[22px] bg-brand-blue-gradient p-5 text-white shadow-[0_18px_40px_rgba(47,128,237,0.20)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/75">
                    Total Brands
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.total}
                  </p>

                  <p className="mt-3 text-xs text-white/70">
                    Managed brand accounts
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-white text-[#2f80ed]">
                  <Sparkles size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">
                    Active Brands
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.active}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Currently publishing
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">
                    Weekly Content
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.totalScheduleItems}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Scheduled content slots
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <CalendarDays size={20} />
                </div>
              </div>
            </article>

            <article className="kpi-card-hover rounded-[22px] border border-[#edf0f5] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#7d8490]">
                    Department Coverage
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {stats.graphicBrands +
                      stats.videoBrands}
                  </p>

                  <p className="mt-3 text-xs text-[#959ca7]">
                    Graphic and video assignments
                  </p>
                </div>

                <div className="grid size-11 place-items-center rounded-full bg-violet-50 text-violet-600">
                  <Users size={20} />
                </div>
              </div>
            </article>
          </section>

          <section className="mt-5 rounded-[24px] border border-[#edf0f5] bg-white p-4 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold">
                  Brand Directory
                </h2>

                <p className="mt-1 text-xs text-[#9299a4]">
                  {filteredBrands.length} brands
                  matching current filters
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
                  options={
                    departmentFilterOptions
                  }
                  onValueChange={
                    setDepartmentFilter
                  }
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
                      style={{
                        backgroundColor:
                          brand.accent,
                      }}
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

                  <BrandStatusBadge
                    status={brand.status}
                  />
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
                          (item) =>
                            item.department ===
                            "Graphic Design",
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
                          (item) =>
                            item.department ===
                            "Video Editing",
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
                        <FileImage
                          size={14}
                          className="text-[#2f80ed]"
                        />
                        Graphic
                      </div>

                      <span className="truncate text-[11px] font-bold">
                        {brand.graphicDesigners
                          .length > 0
                          ? brand.graphicDesigners.join(
                              ", ",
                            )
                          : "Not assigned"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] text-[#626a75]">
                        <Film
                          size={14}
                          className="text-violet-600"
                        />
                        Video
                      </div>

                      <span className="truncate text-[11px] font-bold">
                        {brand.videoEditors.length >
                        0
                          ? brand.videoEditors.join(
                              ", ",
                            )
                          : "Not assigned"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#f0f2f5] pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      toggleBrandStatus(brand.id)
                    }
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

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedBrandId(brand.id)
                    }
                    className="flex items-center gap-2 rounded-full border border-[#e6eaf0] px-4 py-2 text-[10px] font-bold text-[#4f5762] transition hover:border-[#2f80ed] hover:text-[#2f80ed]"
                  >
                    Open Brand
                    <ExternalLink size={13} />
                  </button>
                </div>
              </article>
            ))}
          </section>

          {filteredBrands.length === 0 ? (
            <section className="mt-5 grid min-h-72 place-items-center rounded-[24px] border border-dashed border-[#dce2e9] bg-white p-8 text-center">
              <div>
                <Search
                  size={28}
                  className="mx-auto text-[#adb4bf]"
                />

                <p className="mt-3 text-sm font-bold">
                  No matching brands
                </p>

                <p className="mt-1 text-xs text-[#9299a4]">
                  Search ya filters change karke
                  dobara check karo.
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {selectedBrand ? (
        <>
          <button
            type="button"
            aria-label="Close brand drawer"
            onClick={() =>
              setSelectedBrandId(null)
            }
            className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]"
          />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[620px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="grid size-11 place-items-center rounded-2xl text-xs font-bold text-white"
                  style={{
                    backgroundColor:
                      selectedBrand.accent,
                  }}
                >
                  {selectedBrand.initials}
                </div>

                <div>
                  <p className="text-xs font-bold text-[#2f80ed]">
                    {selectedBrand.industry}
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">
                    {selectedBrand.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBrandId(null)
                }
                className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-6 p-5 sm:p-6">
              <section>
                <div className="flex items-center justify-between gap-3">
                  <BrandStatusBadge
                    status={selectedBrand.status}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      toggleBrandStatus(
                        selectedBrand.id,
                      )
                    }
                    className="flex items-center gap-2 rounded-full border border-[#e6eaf0] px-4 py-2 text-[10px] font-bold"
                  >
                    {selectedBrand.status ===
                    "Active" ? (
                      <CirclePause size={14} />
                    ) : (
                      <Check size={14} />
                    )}

                    {selectedBrand.status ===
                    "Active"
                      ? "Pause"
                      : "Activate"}
                  </button>
                </div>

                <p className="mt-4 text-sm leading-7 text-[#737b86]">
                  {selectedBrand.description}
                </p>

                {selectedBrand.website ? (
                  <a
                    href={selectedBrand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#2f80ed]"
                  >
                    <Globe2 size={15} />
                    Open Website
                    <ExternalLink size={13} />
                  </a>
                ) : null}
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Graphic Designers
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {
                      selectedBrand
                        .graphicDesigners.length
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#969da8]">
                    Video Editors
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {
                      selectedBrand
                        .videoEditors.length
                    }
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold">
                  Publishing Platforms
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedBrand.platforms.length >
                  0 ? (
                    selectedBrand.platforms.map(
                      (platform) => (
                        <PlatformPill
                          key={platform}
                          platform={platform}
                        />
                      ),
                    )
                  ) : (
                    <p className="text-xs text-[#9299a4]">
                      No platforms configured.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold">
                  Assigned Team
                </h3>

                <div className="mt-3 space-y-3">
                  <div className="rounded-[20px] border border-[#e7ebf0] p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <FileImage size={17} />
                      </div>

                      <div>
                        <p className="text-xs font-bold">
                          Graphic Design
                        </p>

                        <p className="mt-1 text-[10px] text-[#9299a4]">
                          Post, carousel, story and
                          banner team
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedBrand
                        .graphicDesigners.length >
                      0 ? (
                        selectedBrand.graphicDesigners.map(
                          (member) => (
                            <span
                              key={member}
                              className="rounded-full bg-[#edf5ff] px-3 py-2 text-[10px] font-bold text-[#2f80ed]"
                            >
                              {member}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-xs text-[#9299a4]">
                          Not assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#e7ebf0] p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                        <Film size={17} />
                      </div>

                      <div>
                        <p className="text-xs font-bold">
                          Video Editing
                        </p>

                        <p className="mt-1 text-[10px] text-[#9299a4]">
                          Reels, shorts and video
                          production team
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedBrand.videoEditors
                        .length > 0 ? (
                        selectedBrand.videoEditors.map(
                          (member) => (
                            <span
                              key={member}
                              className="rounded-full bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-700"
                            >
                              {member}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-xs text-[#9299a4]">
                          Not assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">
                      Weekly Posting Schedule
                    </h3>

                    <p className="mt-1 text-[10px] text-[#9299a4]">
                      Monday to Friday content plan
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-[#edf5ff] px-4 py-2 text-[10px] font-bold text-[#2f80ed]"
                  >
                    <Plus size={14} />
                    Add Slot
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {weekDays.map((day) => {
                    const dayItems =
                      selectedBrand.weeklySchedule.filter(
                        (item) =>
                          item.day === day,
                      );

                    return (
                      <div
                        key={day}
                        className="rounded-[20px] border border-[#e7ebf0] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold">
                              {day}
                            </p>

                            <p className="mt-1 text-[10px] text-[#9299a4]">
                              {dayItems.length} content
                              slots
                            </p>
                          </div>

                          <CalendarDays
                            size={16}
                            className="text-[#9299a4]"
                          />
                        </div>

                        {dayItems.length > 0 ? (
                          <div className="mt-4 space-y-2">
                            {dayItems.map(
                              (item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f9fc] p-3"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div
                                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                                        item.department ===
                                        "Graphic Design"
                                          ? "bg-blue-50 text-blue-600"
                                          : "bg-violet-50 text-violet-600"
                                      }`}
                                    >
                                      {item.department ===
                                      "Graphic Design" ? (
                                        <FileImage
                                          size={15}
                                        />
                                      ) : (
                                        <Film
                                          size={15}
                                        />
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-bold">
                                        {
                                          item.contentType
                                        }
                                      </p>

                                      <p className="mt-1 text-[9px] text-[#9299a4]">
                                        {item.platforms.join(
                                          " · ",
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#626a75]">
                                      <Clock3
                                        size={12}
                                      />
                                      {
                                        item.publishingTime
                                      }
                                    </div>

                                    <button
                                      type="button"
                                      className="grid size-8 place-items-center rounded-full border border-[#e7ebf0]"
                                    >
                                      <MoreHorizontal
                                        size={14}
                                      />
                                    </button>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="mt-4 text-xs text-[#adb4bf]">
                            No content scheduled.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </aside>
        </>
      ) : null}

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="dashboard-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <header className="flex items-center justify-between border-b border-[#edf0f5] p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">
                  Add New Brand
                </h2>

                <p className="mt-1 text-xs text-[#8b929d]">
                  Brand profile create karo. Team
                  aur schedule baad mein assign kiya
                  ja sakta hai.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsAddModalOpen(false)
                }
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
                  placeholder="Example: Softgenie"
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
                      industry:
                        event.target.value,
                    }))
                  }
                  placeholder="Example: SaaS"
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
                      website:
                        event.target.value,
                    }))
                  }
                  placeholder="https://example.com"
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
                      description:
                        event.target.value,
                    }))
                  }
                  placeholder="Brand aur uske services ka short overview"
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
                        accent:
                          event.target.value,
                      }))
                    }
                    className="size-10 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                  />

                  <input
                    value={newBrand.accent}
                    onChange={(event) =>
                      setNewBrand((current) => ({
                        ...current,
                        accent:
                          event.target.value,
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
                onClick={() =>
                  setIsAddModalOpen(false)
                }
                className="rounded-full border border-[#e5e9ef] px-5 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addBrand}
                disabled={
                  !newBrand.name.trim() ||
                  !newBrand.industry.trim()
                }
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

