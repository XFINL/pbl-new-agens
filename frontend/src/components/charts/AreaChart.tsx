/**
 * 面积折线图（手写 SVG，单色）。
 * 主序列：实线 + 渐变面积；次序列：斜纹面积 + 虚线（亮度不足时以纹理区分）。
 */

import { useMemo, useState } from "react";

import { formatNumber } from "../../lib/format";
import { cn } from "../../lib/utils";
import { useElementWidth } from "./useElementWidth";

export interface Series {
  label: string;
  values: number[];
  dashed?: boolean;
}

interface AreaChartProps {
  labels: string[];
  series: Series[];
  height?: number;
  className?: string;
}

const PADDING = { top: 16, right: 12, bottom: 26, left: 44 };
const GRID_STEPS = 4;

export function AreaChart({ labels, series, height = 240, className }: AreaChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>(720);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const innerWidth = Math.max(80, width - PADDING.left - PADDING.right);
    const innerHeight = Math.max(60, height - PADDING.top - PADDING.bottom);
    const all = series.flatMap((item) => item.values);
    const rawMax = Math.max(1, ...all);
    // 取整到"好看"的上界
    const magnitude = Math.pow(10, Math.max(0, String(Math.floor(rawMax)).length - 2));
    const max = Math.ceil(rawMax / magnitude) * magnitude;
    const count = Math.max(labels.length, 1);
    const stepX = count > 1 ? innerWidth / (count - 1) : 0;
    const x = (index: number) => PADDING.left + (count > 1 ? index * stepX : innerWidth / 2);
    const y = (value: number) => PADDING.top + innerHeight - (value / max) * innerHeight;

    const paths = series.map((item) => {
      const points = item.values.map((value, index) => [x(index), y(value)] as const);
      const line = points
        .map(([px, py], index) => `${index === 0 ? "M" : "L"}${px.toFixed(2)},${py.toFixed(2)}`)
        .join(" ");
      const area =
        points.length > 0
          ? `${line} L${points[points.length - 1][0].toFixed(2)},${(
              PADDING.top + innerHeight
            ).toFixed(2)} L${points[0][0].toFixed(2)},${(PADDING.top + innerHeight).toFixed(2)} Z`
          : "";
      return { ...item, line, area, points };
    });

    return { innerWidth, innerHeight, max, x, y, paths, stepX, count };
  }, [width, height, labels.length, series]);

  // X 轴标签抽样（最多 7 个）
  const tickPositions = useMemo(() => {
    const count = labels.length;
    if (count === 0) return [];
    const maxTicks = Math.min(7, count);
    const stride = Math.max(1, Math.ceil(count / maxTicks));
    const positions: number[] = [];
    for (let index = 0; index < count; index += stride) positions.push(index);
    if (positions[positions.length - 1] !== count - 1) positions.push(count - 1);
    return positions;
  }, [labels.length]);

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = event.clientX - rect.left - PADDING.left;
    if (chart.stepX <= 0) {
      setHoverIndex(0);
      return;
    }
    const index = Math.round(relative / chart.stepX);
    setHoverIndex(Math.min(labels.length - 1, Math.max(0, index)));
  };

  const hoveredSafe = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < labels.length ? hoverIndex : null;

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${Math.max(width, 1)} ${height}`}
        role="img"
        aria-label={`趋势图，共 ${labels.length} 个数据点，${series
          .map((item) => `${item.label} 合计 ${formatNumber(item.values.reduce((a, b) => a + b, 0))}`)
          .join("；")}`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="gm-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
          <pattern
            id="gm-area-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart-3)" strokeWidth="2" />
          </pattern>
        </defs>

        {/* 水平网格 + Y 轴刻度 */}
        {Array.from({ length: GRID_STEPS + 1 }).map((_, index) => {
          const value = (chart.max / GRID_STEPS) * index;
          const y = chart.y(value);
          return (
            <g key={index}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + chart.innerWidth}
                y2={y}
                stroke="var(--chart-grid)"
                strokeWidth="1"
                strokeDasharray={index === 0 ? "0" : "3 4"}
              />
              <text
                x={PADDING.left - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="11"
                fill="var(--fg-faint)"
                className="num"
              >
                {formatNumber(Math.round(value))}
              </text>
            </g>
          );
        })}

        {/* 面积 + 折线 */}
        {chart.paths.map((item, index) => (
          <g key={item.label}>
            <path
              d={item.area}
              fill={index === 0 ? "url(#gm-area-fill)" : "url(#gm-area-hatch)"}
              opacity={index === 0 ? 1 : 0.5}
            />
            <path
              d={item.line}
              fill="none"
              stroke={index === 0 ? "var(--chart-1)" : "var(--chart-3)"}
              strokeWidth={index === 0 ? 1.5 : 1.2}
              strokeDasharray={item.dashed ? "4 4" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* 悬停指示线 + 数据点 */}
        {hoveredSafe !== null ? (
          <g>
            <line
              x1={chart.x(hoveredSafe)}
              y1={PADDING.top}
              x2={chart.x(hoveredSafe)}
              y2={PADDING.top + chart.innerHeight}
              stroke="var(--fg-faint)"
              strokeWidth="1"
            />
            {chart.paths.map((item, index) => (
              <circle
                key={item.label}
                cx={chart.x(hoveredSafe)}
                cy={chart.y(item.values[hoveredSafe] ?? 0)}
                r={index === 0 ? 3.5 : 2.5}
                fill="var(--bg)"
                stroke={index === 0 ? "var(--chart-1)" : "var(--chart-3)"}
                strokeWidth="1.5"
              />
            ))}
          </g>
        ) : null}

        {/* X 轴标签 */}
        {tickPositions.map((index) => (
          <text
            key={index}
            x={chart.x(index)}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="var(--fg-faint)"
            className="num"
          >
            {labels[index]}
          </text>
        ))}
      </svg>

      {/* 悬停提示（玻璃） */}
      {hoveredSafe !== null ? (
        <div
          className="glass glass-sm pointer-events-none absolute top-2 z-10 min-w-[7rem] px-3 py-2 text-2xs text-fg"
          style={{
            left: Math.min(
              Math.max(chart.x(hoveredSafe) - 56, 4),
              Math.max(4, width - 132)
            ),
          }}
        >
          <div className="mb-1 text-faint">{labels[hoveredSafe]}</div>
          {series.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <span className="text-muted">{item.label}</span>
              <span className="num font-medium">{formatNumber(item.values[hoveredSafe] ?? 0)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}