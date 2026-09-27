/** 数字 / 时长 / 百分比格式化。 */

export function formatNumber(value: number): string {
  return (value ?? 0).toLocaleString("zh-CN");
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value ?? 0).toFixed(digits)}%`;
}

/** 秒 → 「45 秒」「3 分 20 秒」「1 小时 5 分」 */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds ?? 0));
  if (total < 60) return `${total} 秒`;
  const minutes = Math.floor(total / 60);
  const restSeconds = total % 60;
  if (minutes < 60) {
    return restSeconds ? `${minutes} 分 ${restSeconds} 秒` : `${minutes} 分`;
  }
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours} 小时 ${restMinutes} 分` : `${hours} 小时`;
}

/** 环比：上一周期为 0 时返回 null（前端显示 —） */
export function formatDelta(current: number, previous: number): string | null {
  if (!previous) return null;
  const delta = ((current - previous) / previous) * 100;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

export function formatShortDate(iso: string): string {
  return iso.slice(5, 10).replace("-", "-");
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16).replace("T", " ");
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}