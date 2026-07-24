"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { MoreHorizontal } from "lucide-react";

type AnimatedWeeklyProgressProps = {
  percentage?: number;
  completed?: number;
  remaining?: number;
};

export default function AnimatedWeeklyProgress({
  percentage = 74,
  completed = 20,
  remaining = 7,
}: AnimatedWeeklyProgressProps) {
  const [animatedPercentage, setAnimatedPercentage] =
    useState(0);

  const segmentCount = 25;

  const activeSegments = useMemo(
    () =>
      Math.round(
        (animatedPercentage / 100) *
          segmentCount,
      ),
    [animatedPercentage],
  );

  useEffect(() => {
    let animationFrame = 0;

    const duration = 1250;
    const delay = 180;
    const startTime =
      performance.now() + delay;

    function animate(currentTime: number) {
      if (currentTime < startTime) {
        animationFrame =
          requestAnimationFrame(animate);
        return;
      }

      const elapsed =
        currentTime - startTime;

      const rawProgress = Math.min(
        elapsed / duration,
        1,
      );

      const easedProgress =
        1 -
        Math.pow(1 - rawProgress, 3);

      setAnimatedPercentage(
        Math.round(
          percentage * easedProgress,
        ),
      );

      if (rawProgress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(() => setAnimatedPercentage(0));

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(
        animationFrame,
      );
    };
  }, [percentage]);

  return (
    <section className="h-full rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_12px_35px_rgba(24,39,75,0.035)]">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.025em]">
            Weekly Progress
          </h2>

          <p className="mt-1 text-xs text-[#9299a4]">
            Overall task completion
          </p>
        </div>

        <button
          type="button"
          aria-label="Weekly progress options"
          className="grid size-9 place-items-center rounded-full border border-[#edf0f5] text-[#7b838f]"
        >
          <MoreHorizontal size={16} />
        </button>
      </header>

      <div className="relative mx-auto mt-10 h-[190px] w-full max-w-[310px]">
        <div className="absolute inset-x-0 top-0 h-[150px]">
          {Array.from({
            length: segmentCount,
          }).map((_, index) => {
            const angle =
              -90 +
              (index /
                (segmentCount - 1)) *
                180;

            const isActive =
              index < activeSegments;

            return (
              <span
                key={index}
                className={`absolute bottom-0 left-1/2 h-[52px] w-[15px] origin-bottom rounded-full transition-colors duration-150 ${
                  isActive
                    ? "bg-[#2f80ed]"
                    : "bg-[#edf1f6]"
                }`}
                style={{
                  transform: `
                    translateX(-50%)
                    rotate(${angle}deg)
                    translateY(-84px)
                  `,
                }}
              />
            );
          })}
        </div>

        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-[34px] font-semibold leading-none tracking-[-0.055em] text-[#15181d]">
            {animatedPercentage}%
          </p>

          <p className="mt-2 text-xs text-[#9299a4]">
            Week Completed
          </p>

          <p className="mt-2 text-xs font-bold text-[#5f6772]">
            {completed} /{" "}
            {completed + remaining} Tasks
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-[#f5f7fa] p-4">
          <p className="text-xs text-[#9299a4]">
            Completed
          </p>

          <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
            {completed}
            <span className="ml-1 text-xs font-medium text-[#9299a4]">
              tasks
            </span>
          </p>
        </div>

        <div className="rounded-[18px] bg-[#f5f7fa] p-4">
          <p className="text-xs text-[#9299a4]">
            Remaining
          </p>

          <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
            {remaining}
            <span className="ml-1 text-xs font-medium text-[#9299a4]">
              tasks
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
