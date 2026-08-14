"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type CalendarDatePillProps = {
  value: string;
  onChange: (value: string) => void;
  today?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function calendarDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day, 12)).toISOString().slice(0, 10);
}

export default function CalendarDatePill({ value, onChange, today, disabled = false, ariaLabel = "Select date" }: CalendarDatePillProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => parseCalendarDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1)));

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  const year = visibleMonth.getUTCFullYear();
  const month = visibleMonth.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  }).format(selected);

  function moveMonth(offset: number) {
    setVisibleMonth(new Date(Date.UTC(year, month + offset, 1)));
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button type="button" disabled={disabled} aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open}
        onClick={() => {
          if (!open) setVisibleMonth(new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1)));
          setOpen((current) => !current);
        }}
        className={`inline-flex h-11 min-w-[220px] items-center justify-center gap-2 rounded-full border border-[#e7ebf0] bg-white px-5 text-xs font-bold text-[#39414c] shadow-sm transition hover:border-[#cfd8e5] focus:border-[#2f80ed] focus:outline-none focus:ring-4 focus:ring-blue-50 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
        <CalendarDays size={15} className="shrink-0 text-[#2f80ed]" />
        <span className="truncate">{today === value ? `Today · ${label}` : label}</span>
      </button>

      {open ? (
        <div role="dialog" aria-label="Choose a date" className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[310px] rounded-[24px] border border-[#e6ebf2] bg-white p-4 shadow-[0_24px_70px_rgba(31,45,70,0.18)]">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="grid size-9 place-items-center rounded-full text-[#607080] transition hover:bg-[#f2f6fb]"><ChevronLeft size={17} /></button>
            <p className="text-sm font-bold text-[#263441]">{visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
            <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="grid size-9 place-items-center rounded-full text-[#607080] transition hover:bg-[#f2f6fb]"><ChevronRight size={17} /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => <span key={day} className="py-2 text-[11px] font-semibold text-[#98a2ad]">{day}</span>)}
            {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const date = calendarDate(year, month, day);
              const isSelected = date === value;
              const isToday = date === today;
              return <button key={date} type="button" aria-label={`Select ${date}`} aria-pressed={isSelected}
                onClick={() => { onChange(date); setOpen(false); }}
                className={`mx-auto grid size-9 place-items-center rounded-xl text-xs font-semibold transition ${isSelected ? "bg-[#111820] text-white shadow-md" : isToday ? "bg-blue-50 text-[#2f80ed] ring-1 ring-blue-200" : "text-[#52616e] hover:bg-[#edf5ff] hover:text-[#2f80ed]"}`}>
                {day}
              </button>;
            })}
          </div>
          {today ? <button type="button" onClick={() => { onChange(today); setOpen(false); }} className="mt-4 w-full rounded-full bg-[#edf5ff] px-4 py-2.5 text-xs font-bold text-[#2f80ed] transition hover:bg-[#deecff]">Go to today</button> : null}
        </div>
      ) : null}
    </div>
  );
}
