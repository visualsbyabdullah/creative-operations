"use client";

export type BrandStatus = "Active" | "Paused";
export type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export type ContentDepartment = "Graphic Design" | "Video Editing";
export type Platform = "Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "YouTube";

export type WeeklyScheduleItem = {
  id: number;
  day: WeekDay;
  department: ContentDepartment;
  contentType: string;
  platforms: Platform[];
  publishingTime: string;
};

export type Brand = {
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

export type ContentType = "Post" | "Reel" | "Story" | "Carousel" | "Banner";
export type ContentStatus = "Completed" | "Pending Review" | "Revision" | "Delayed";

export type BrandHistoryItem = {
  id: string;
  date: string;
  title: string;
  type: ContentType;
  platform: Platform;
  assignedTo: string;
  status: ContentStatus;
};

export const weekDays: WeekDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const initialBrands: Brand[] = [
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
    graphicDesigners: ["Abdullah Naeem", "Ali Raza"],
    videoEditors: ["Hamza Khan", "Usman Ali"],
    platforms: ["Instagram", "Facebook", "LinkedIn"],
    weeklySchedule: [
      {
        id: 1,
        day: "Monday",
        department: "Graphic Design",
        contentType: "Carousel",
        platforms: ["Instagram", "Facebook"],
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
    website: "https://www.softechbusinessservices.com/",
    graphicDesigners: ["Abdullah Naeem", "Ali Raza"],
    videoEditors: ["Hamza Khan"],
    platforms: ["LinkedIn", "Instagram", "Facebook"],
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
        platforms: ["Instagram", "LinkedIn"],
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
    platforms: ["Instagram", "YouTube", "Facebook"],
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
        platforms: ["Instagram", "YouTube"],
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
    website: "https://www.solentrixtraders.com/",
    graphicDesigners: ["Ali Raza"],
    videoEditors: ["Hamza Khan"],
    platforms: ["Instagram", "Facebook", "LinkedIn"],
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
        platforms: ["Instagram", "Facebook"],
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
    platforms: ["LinkedIn", "Facebook"],
    weeklySchedule: [
      {
        id: 11,
        day: "Wednesday",
        department: "Graphic Design",
        contentType: "Carousel",
        platforms: ["LinkedIn", "Facebook"],
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

const contentTypes: ContentType[] = ["Post", "Reel", "Story", "Carousel", "Banner"];
const contentStatuses: ContentStatus[] = ["Completed", "Completed", "Completed", "Pending Review", "Revision", "Delayed"];

export function buildBrandHistory(brand: Brand): BrandHistoryItem[] {
  const months = [
    { value: "2026-05", days: [2, 5, 8, 12, 16, 20, 23, 27] },
    { value: "2026-06", days: [3, 6, 10, 13, 17, 21, 24, 28] },
    { value: "2026-07", days: [1, 4, 8, 11, 15, 18, 22, 25, 27] },
  ];

  const assignees = [...brand.graphicDesigners, ...brand.videoEditors];
  const team = assignees.length > 0 ? assignees : ["Unassigned"];
  const platforms: Platform[] =
    brand.platforms.length > 0
      ? brand.platforms
      : ["Instagram"];

  return months.flatMap((month, monthIndex) =>
    month.days.map((day, index) => {
      const type = contentTypes[(index + monthIndex + brand.id) % contentTypes.length];
      const platform = platforms[(index + brand.id) % platforms.length];
      const assignedTo = team[(index + monthIndex) % team.length];
      const status = contentStatuses[(index + monthIndex + brand.id) % contentStatuses.length];

      return {
        id: `${brand.id}-${month.value}-${day}`,
        date: `${month.value}-${String(day).padStart(2, "0")}`,
        title: `${brand.name} ${type} ${index + 1}`,
        type,
        platform,
        assignedTo,
        status,
      };
    }),
  );
}

export const brandsStorageKey = "creativeops-brands";
