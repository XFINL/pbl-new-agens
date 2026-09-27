import { useMemo, type HTMLAttributes, type ReactNode } from "react";

import { supportsRefractionFilter } from "../../lib/capability";
import { cn } from "../../lib/utils";
import { usePress } from "./usePress";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** 尺寸档位：sm 控件级 / md 卡片级 / lg 大面板级（折射增强仅 lg 启用） */
  size?: "sm" | "md" | "lg";
  /** 是否接入按压交互（涟漪 + 微倾斜 + 微扭曲） */
  interactive?: boolean;
  /** 大面板默认关闭折射增强时，可显式打开 */
  refraction?: boolean;
  children: ReactNode;
}

/**
 * 玻璃容器：折射 / 反射 / 边缘 / 边缘泛光 / 光晕 / 按压 六效果的基础承载。
 * 材质样式见 src/styles/glass.css。
 */
export function GlassPanel({
  size = "md",
  interactive = false,
  refraction,
  className,
  children,
  ...rest
}: GlassPanelProps) {
  const refract = useMemo(() => supportsRefractionFilter(), []);
  const press = usePress({ disabled: !interactive });
  const enableRefraction = refract && (refraction ?? size === "lg");

  return (
    <div
      ref={press.setNode}
      {...(interactive ? press.pressProps : {})}
      className={cn(
        "glass",
        size === "sm" && "glass-sm",
        size === "lg" && "glass-lg",
        enableRefraction && "glass-refract",
        enableRefraction && interactive && "glass-warp",
        interactive && "glass-interactive",
        press.pressed && "is-pressed",
        press.releasing && "is-releasing",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}