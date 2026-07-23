"use client";


type WeeklyProgressMeterProps = {
  percentage: number;
  completed: number;
  total: number;
  progress: number;
};

export default function WeeklyProgressMeter({
  percentage,
  completed,
  total,
  progress,
}: WeeklyProgressMeterProps) {
  const animatedPercentage = Math.round(
    percentage * progress,
  );

  const segmentCount = 18;

  const activeSegments = Math.round(
    (animatedPercentage / 100) *
      segmentCount,
  );

  const centerX = 180;
  const centerY = 165;
  const radius = 115;

  const segments = Array.from(
    { length: segmentCount },
    (_, index) => {
      const angle =
        180 +
        (index * 180) /
          (segmentCount - 1);

      const radians =
        (angle * Math.PI) / 180;

      const x =
        centerX +
        radius * Math.cos(radians);

      const y =
        centerY +
        radius * Math.sin(radians);

      const rotation = angle + 90;

      return {
        index,
        x,
        y,
        rotation,
        active:
          index < activeSegments,
      };
    },
  );

  return (
    <div className="flex min-h-[245px] flex-col items-center justify-center">
      <div className="relative h-[205px] w-full max-w-[390px]">
        <svg
          viewBox="0 0 360 205"
          className="h-full w-full overflow-visible"
          aria-label={`${animatedPercentage}% weekly progress`}
        >
          <defs>
            <linearGradient
              id="weekly-meter-gradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#1769e8"
              />

              <stop
                offset="55%"
                stopColor="#2f80ed"
              />

              <stop
                offset="100%"
                stopColor="#8fc0ff"
              />
            </linearGradient>

            <filter
              id="weekly-meter-shadow"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="5"
                floodColor="#2f80ed"
                floodOpacity="0.12"
              />
            </filter>
          </defs>

          {segments.map((segment) => (
            <rect
              key={segment.index}
              x={segment.x - 8}
              y={segment.y - 23}
              width="16"
              height="46"
              rx="7"
              transform={`rotate(${segment.rotation} ${segment.x} ${segment.y})`}
              fill={
                segment.active
                  ? "url(#weekly-meter-gradient)"
                  : "#eef1f5"
              }
              filter={
                segment.active
                  ? "url(#weekly-meter-shadow)"
                  : undefined
              }
              style={{
                transition:
                  "fill 160ms ease, opacity 160ms ease",
              }}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
          <p className="text-4xl font-semibold tracking-[-0.055em] text-[#15181d]">
            {animatedPercentage}%
          </p>

          <p className="mt-1 text-xs font-medium text-[#888f9a]">
            Week Completed
          </p>

          <p className="mt-2 text-xs font-semibold text-[#59616d]">
            {completed} / {total} Tasks
          </p>
        </div>
      </div>
    </div>
  );
}
