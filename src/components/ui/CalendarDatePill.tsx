"use client";

import { CalendarDays } from "lucide-react";
import { useRef } from "react";

type CalendarDatePillProps = {
  value: string;
  onChange: (value: string) => void;
  today?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

export default function CalendarDatePill({ value, onChange, today, disabled = false, ariaLabel = "Select date" }: CalendarDatePillProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  }

  return (
    <div className="relative inline-flex">
      <button type="button" disabled={disabled} aria-label={ariaLabel} onClick={openPicker}
        className={`inline-flex h-11 min-w-[220px] items-center justify-center gap-2 rounded-full border border-[#e7ebf0] bg-white px-5 text-xs font-bold text-[#39414c] shadow-sm transition hover:border-[#cfd8e5] focus:border-[#2f80ed] focus:outline-none focus:ring-4 focus:ring-blue-50 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
        <CalendarDays size={15} className="shrink-0 text-[#2f80ed]" />
        <span className="truncate">{today === value ? `Today · ${label}` : label}</span>
      </button>
      <input ref={inputRef} type="date" value={value} aria-hidden="true" tabIndex={-1} disabled={disabled}
        onChange={(event) => { if (event.target.value) onChange(event.target.value); }}
        className="pointer-events-none absolute size-px opacity-0" />
    </div>
  );
}
