"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import type { ComponentType } from "react";

import {
  Check,
  ChevronDown,
} from "lucide-react";

export type PillSelectOption<T extends string> = {
  label: string;
  value: T;
};

type PillSelectProps<T extends string> = {
  value: T;
  options: PillSelectOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  icon?: ComponentType<{
    size?: number;
    className?: string;
  }>;
};

export default function PillSelect<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  icon: Icon,
}: PillSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const selectedOption =
    options.find((option) => option.value === value) ??
    options[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-11 items-center rounded-full border border-[#e7ebf0] bg-white px-4 text-xs font-semibold text-[#303640] transition hover:border-[#d6dce5]"
      >
        {Icon ? (
          <Icon
            size={15}
            className="shrink-0 text-[#858c97]"
          />
        ) : null}

        <span className={Icon ? "ml-2.5 whitespace-nowrap" : "whitespace-nowrap"}>
          {selectedOption.label}
        </span>

        <ChevronDown
          size={15}
          className={`ml-2.5 shrink-0 text-[#69717d] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-full overflow-hidden rounded-2xl border border-[#e7ebf0] bg-white p-1.5 shadow-[0_16px_40px_rgba(24,39,75,0.10)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-4 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                  isSelected
                    ? "bg-[#edf5ff] text-[#2f80ed]"
                    : "text-[#4f5762] hover:bg-[#f5f7fa]"
                }`}
              >
                <span>{option.label}</span>

                {isSelected ? (
                  <Check
                    size={14}
                    className="shrink-0"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
