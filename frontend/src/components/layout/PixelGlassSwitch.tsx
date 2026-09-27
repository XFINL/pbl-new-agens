import { cn } from "../../lib/utils";
import { usePress } from "../glass/usePress";

interface PixelGlassSwitchProps {
  checked: boolean;
  onToggle: () => void;
  labels: { on: string; off: string };
  ariaLabel: string;
}

/**
 * 玻璃开关：轨道为内陷玻璃，滑块为反色实心块；
 * 两侧以文字标注状态（不使用图标），整体接入按压缩放与回弹。
 */
export function PixelGlassSwitch({ checked, onToggle, labels, ariaLabel }: PixelGlassSwitchProps) {
  const press = usePress();

  return (
    <button
      ref={press.setNode}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onToggle}
      {...press.pressProps}
      className={cn(
        "gm-pressable glass-inset inline-flex h-8 items-center gap-2 px-2 text-2xs text-muted",
        press.pressed && "is-pressed",
        press.releasing && "is-releasing"
      )}
    >
      <span className={cn("transition-colors", !checked && "text-fg")}>{labels.off}</span>
      <span
        aria-hidden="true"
        className="relative inline-flex h-4 w-8 items-center rounded-full border border-[var(--glass-edge)] bg-[var(--tint-strong)]"
      >
        <span
          className={cn(
            "absolute h-[10px] w-[10px] rounded-full bg-fg transition-transform duration-[var(--dur-base)] ease-soft",
            checked ? "translate-x-[17px]" : "translate-x-[3px]"
          )}
        />
      </span>
      <span className={cn("transition-colors", checked && "text-fg")}>{labels.on}</span>
    </button>
  );
}