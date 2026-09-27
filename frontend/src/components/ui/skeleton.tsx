import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

/** 灰阶脉冲占位（prefers-reduced-motion 下自动静止） */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("gm-skeleton rounded-[var(--radius-control)] bg-[var(--tint-strong)]", className)}
      {...props}
    />
  );
}