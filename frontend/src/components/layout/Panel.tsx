import { useMemo, type HTMLAttributes, type ReactNode } from "react";

import { supportsRefractionFilter } from "../../lib/capability";
import { cn } from "../../lib/utils";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  /** 标题右侧操作区（切换器 / 说明文字） */
  action?: ReactNode;
  /** 标题下方说明 */
  description?: string;
  children: ReactNode;
}

/** 看板面板：玻璃容器 + 统一标题结构（标题 14px 600 + 右侧操作） */
export function Panel({ title, action, description, className, children, ...rest }: PanelProps) {
  const refract = useMemo(() => supportsRefractionFilter(), []);
  return (
    <section
      className={cn("glass glass-lg p-5", refract && "glass-refract", className)}
      aria-label={title}
      {...rest}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description ? <p className="mt-1 text-2xs text-faint">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}