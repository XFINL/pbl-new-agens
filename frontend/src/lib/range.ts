/** 时间范围：与后端 `range` 参数一一对应。 */

export type RangeKey = "today" | "7d" | "30d";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "今天" },
  { key: "7d", label: "近 7 天" },
  { key: "30d", label: "近 30 天" },
];

export function rangeLabel(key: RangeKey): string {
  return RANGE_OPTIONS.find((option) => option.key === key)?.label ?? key;
}

/** 环比文案的周期描述 */
export function compareLabel(key: RangeKey): string {
  return key === "today" ? "较昨日" : key === "7d" ? "较上一个 7 天" : "较上一个 30 天";
}