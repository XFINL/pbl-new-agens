/**
 * 环形占比图（手写 stroke-dasharray，单色）。
 * 扇区以 5 档亮度区分，末档改用斜纹，保证不用彩色也能分辨。
 */

import { useState } from "react";

import { formatNumber } from "../../lib/format";
import { cn } from "../../lib/utils";

export interface DonutItem {
  label: string;
  value: number;
}

interface DonutProps {
  items: DonutItem[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  className?: string;
}

const FILLS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function Donut({
  items,
  size = 156,
  thickness = 16,
  centerLabel = "合计",
  className,
}: DonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (items.length === 0 || total === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-xs text-faint", className)}
        style={{ height: size }}
      >
        暂无数据
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 1.5; // 扇区间留白（px）

  let offset = 0;
  const arcs = items.map((item, index) => {
    const length = (item.value / total) * circumference;
    const arc = {
      ...item,
      index,
      dash: `${Math.max(0, length - gap)} ${circumference - Math.max(0, length - gap)}`,
      offset: -offset,
      ratio: item.value / total,
      fill: FILLS[index % FILLS.length],
      hatch: index >= FILLS.length,
    };
    offset += length;
    return arc;
  });

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={`占比环形图：${items
            .map((item) => `${item.label} ${formatNumber(item.value)}`)
            .join("，")}`}
        >
          <defs>
            <pattern
              id="gm-donut-hatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill="transparent" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart-2)" strokeWidth="2.5" />
            </pattern>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--chart-grid)"
            strokeWidth={thickness}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.hatch ? "url(#gm-donut-hatch)" : arc.fill}
              strokeWidth={activeIndex === arc.index ? thickness + 3 : thickness}
              strokeDasharray={arc.dash}
              strokeDashoffset={arc.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              onMouseEnter={() => setActiveIndex(arc.index)}
              onMouseLeave={() => setActiveIndex(null)}
              style={{ transition: "stroke-width var(--dur-base) var(--ease-out-soft)" }}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-lg font-semibold text-fg">
            {activeIndex !== null ? `${(arcs[activeIndex].ratio * 100).toFixed(1)}%` : formatNumber(total)}
          </span>
          <span className="text-2xs text-faint">
            {activeIndex !== null ? arcs[activeIndex].label : centerLabel}
          </span>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-col gap-1.5">
        {arcs.map((arc) => (
          <li
            key={arc.label}
            className="flex items-center justify-between gap-3 rounded-[8px] px-1 py-0.5 text-xs transition-colors hover:bg-[var(--tint-weak)]"
            onMouseEnter={() => setActiveIndex(arc.index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className={cn("gm-swatch", arc.hatch && "gm-swatch-hatch")}
                style={arc.hatch ? undefined : { background: arc.fill }}
              />
              <span className="truncate text-fg">{arc.label}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              <span className="num text-fg">{formatNumber(arc.value)}</span>
              <span className="num text-2xs text-faint">{(arc.ratio * 100).toFixed(1)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}