import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

/** 描边胶囊：仅黑白两态（单色体系，不用彩色语义色） */
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--glass-edge)] px-2 py-0.5 text-2xs text-muted",
        className
      )}
      {...props}
    />
  );
}