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

export type PillSelectOption<
  T extends string,
> = {
  label: string;
  value: T;
};

type PillSelectProps<
  T extends string,
> = {
  value: T;
  options: PillSelectOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;

  icon?: ComponentType<{
    size?: number;
    className?: string;
  }>;

  variant?: "pill" | "field";
  fullWidth?: boolean;
  disabled?: boolean;
  menuAlign?: "left" | "right";
  extraAction?: { label: string; onSelect: () => void };
};

export default function PillSelect<
  T extends string,
>({
  value,
  options,
  onValueChange,
  ariaLabel,
  icon: Icon,
  variant = "pill",
  fullWidth = false,
  disabled = false,
  menuAlign = "right",
  extraAction,
}: PillSelectProps<T>) {
  const [isOpen, setIsOpen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement>(null);

  const menuId = useId();

  const selectedOption =
    options.find(
      (option) =>
        option.value === value,
    ) ?? options[0];

  const isField =
    variant === "field";

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

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

  const containerClassName = [
    "relative",
    fullWidth || isField
      ? "block w-full"
      : "inline-flex",
  ].join(" ");

  const buttonClassName = isField
    ? [
        "flex h-12 w-full",
        "items-center justify-between",
        "rounded-2xl border",
        "border-[#e2e7ed]",
        "bg-white px-4",
        "text-sm font-semibold",
        "text-[#303640]",
        "outline-none transition",
        "hover:border-[#d2d9e3]",
        "focus:border-[#2f80ed]",
        "focus:ring-4",
        "focus:ring-blue-50",
        "disabled:cursor-not-allowed",
        "disabled:opacity-60",
      ].join(" ")
    : [
        "inline-flex h-11",
        "items-center",
        "rounded-full border",
        "border-[#e7ebf0]",
        "bg-white px-4",
        "text-xs font-semibold",
        "text-[#303640]",
        "outline-none transition",
        "hover:border-[#d6dce5]",
        "focus:border-[#2f80ed]",
        "focus:ring-4",
        "focus:ring-blue-50",
        "disabled:cursor-not-allowed",
        "disabled:opacity-60",
      ].join(" ");

  const menuPositionClass =
    isField || fullWidth
      ? "left-0 right-0"
      : menuAlign === "left"
        ? "left-0"
        : "right-0";

  return (
    <div
      ref={containerRef}
      className={containerClassName}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() =>
          setIsOpen(
            (current) => !current,
          )
        }
        className={buttonClassName}
      >
        <span className="flex min-w-0 items-center">
          {Icon ? (
            <Icon
              size={15}
              className="shrink-0 text-[#858c97]"
            />
          ) : null}

          <span
            className={`truncate whitespace-nowrap ${
              Icon ? "ml-2.5" : ""
            }`}
          >
            {selectedOption?.label}
          </span>
        </span>

        <ChevronDown
          size={15}
          className={`ml-2.5 shrink-0 text-[#69717d] transition-transform duration-200 ${
            isOpen
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="listbox"
          className={`absolute ${menuPositionClass} top-[calc(100%+8px)] z-[80] max-h-72 min-w-full overflow-y-auto rounded-2xl border border-[#e4e9f0] bg-white p-1.5 shadow-[0_18px_50px_rgba(24,39,75,0.16)]`}
        >
          {options.map((option) => {
            const isSelected =
              option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={
                  isSelected
                }
                onClick={() => {
                  onValueChange(
                    option.value,
                  );

                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-4 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                  isSelected
                    ? "bg-[#edf5ff] text-[#2f80ed]"
                    : "text-[#4f5762] hover:bg-[#f5f7fa]"
                }`}
              >
                <span>
                  {option.label}
                </span>

                {isSelected ? (
                  <Check
                    size={14}
                    className="shrink-0"
                  />
                ) : null}
              </button>
            );
          })}
          {extraAction ? (
            <button type="button" onClick={() => { setIsOpen(false); extraAction.onSelect(); }}
              className="mt-1 flex w-full items-center rounded-xl border-t border-[#edf0f5] px-3 py-2.5 text-left text-xs font-bold text-[#2f80ed] transition hover:bg-[#edf5ff]">
              + {extraAction.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
