"use client";

import { CalendarDays } from "lucide-react";

type CalendarDatePillProps = {
  value: string;
  onChange: (value: string) => void;
  today?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

export default function CalendarDatePill({ value, onChange, today, disabled = false, ariaLabel = "Select date" }: CalendarDatePillProps) {
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));

  return (
    <label className={`relative inline-flex h-11 min-w-[220px] items-center justify-center gap-2 overflow-hidden rounded-full border border-[#e7ebf0] bg-white px-5 text-xs font-bold text-[#39414c] shadow-sm transition hover:border-[#cfd8e5] focus-within:border-[#2f80ed] focus-within:ring-4 focus-within:ring-blue-50 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
      <CalendarDays size={15} className="shrink-0 text-[#2f80ed]" />
      <span className="truncate">{today === value ? `Today · ${label}` : label}</span>
      <input type="date" value={value} aria-label={ariaLabel} disabled={disabled}
        onChange={(event) => { if (event.target.value) onChange(event.target.value); }}
        className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
    </label>
  );
}
