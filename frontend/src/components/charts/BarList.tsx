/**
 * 横向条形排行（手写，单色）。
 * 主值：实心条（按排名取亮度档）；次值（如 UV）：叠放斜纹条。
 */

import { formatNumber } from "../../lib/format";
import { cn } from "../../lib/utils";

export interface BarListItem {
  label: string;
  value: number;
  /** 次要值（可选，以斜纹叠加表示） */
  secondary?: number;
  /** 行尾附加说明（如占比） */
  hint?: string;
  title?: string;
}

interface BarListProps {
  items: BarListItem[];
  className?: string;
  emptyText?: string;
}

const OPACITIES = [1, 0.78, 0.6, 0.46, 0.36, 0.28];

export function BarList({ items, className, emptyText = "暂无数据" }: BarListProps) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-xs text-faint">{emptyText}</p>;
  }
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {items.map((item, index) => {
        const ratio = Math.max(2, (item.value / max) * 100);
        const secondaryRatio = item.secondary ? Math.max(2, (item.secondary / max) * 100) : 0;
        return (
          <li
            key={`${item.label}-${index}`}
            className="group relative overflow-hidden rounded-[10px] px-3 py-2 transition-colors hover:bg-[var(--tint-weak)]"
            title={item.title ?? item.label}
          >
            {/* 条形背景层 */}
            <div className="absolute inset-y-0 left-0 flex w-full items-center" aria-hidden="true">
              <div
                className="h-full rounded-[10px]"
                style={{
                  width: `${ratio}%`,
                  background: `color-mix(in srgb, var(--fg) ${Math.round(
                    OPACITIES[index % OPACITIES.length] * 100
                  )}%, transparent)`,
                }}
              />
            </div>
            {secondaryRatio > 0 ? (
              <div className="absolute inset-y-0 left-0 flex w-full items-center" aria-hidden="true">
                <div
                  className="gm-swatch-hatch h-[6px] rounded-full opacity-70"
                  style={{ width: `${secondaryRatio}%` }}
                />
              </div>
            ) : null}

            {/* 内容层 */}
            <div className="relative flex items-baseline justify-between gap-4">
              <span className="truncate text-xs text-fg">{item.label}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="num text-xs font-medium text-fg">{formatNumber(item.value)}</span>
                {item.hint ? <span className="num text-2xs text-faint">{item.hint}</span> : null}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}