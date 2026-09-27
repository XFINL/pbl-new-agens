import { cn } from "../../lib/utils";

interface SegmentOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/** 分段控件：玻璃槽 + 反色实心滑块（用于时间范围与序列切换） */
export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentControlProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("glass-segment", className)}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active}
            onClick={() => onChange(option.key)}
            className="glass-segment-item"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}