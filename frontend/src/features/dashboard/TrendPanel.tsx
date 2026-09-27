import { useMemo, useState } from "react";

import type { TimeseriesPoint } from "../../api/stats";
import { AreaChart, type Series } from "../../components/charts/AreaChart";
import { Panel } from "../../components/layout/Panel";
import { SegmentControl } from "../../components/layout/SegmentControl";
import { Skeleton } from "../../components/ui/skeleton";
import { formatShortDate } from "../../lib/format";

type TrendMetric = "all" | "pv" | "uv" | "sessions";

const OPTIONS: { key: TrendMetric; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pv", label: "浏览量" },
  { key: "uv", label: "访客数" },
  { key: "sessions", label: "会话数" },
];

/** 访问趋势：按天面积折线，可切换 PV / UV / 会话三条序列 */
export function TrendPanel({
  timeseries,
  loading,
}: {
  timeseries: TimeseriesPoint[] | null;
  loading: boolean;
}) {
  const [metric, setMetric] = useState<TrendMetric>("all");

  const { labels, series } = useMemo(() => {
    const points = timeseries ?? [];
    const valuesOf = (key: "pv" | "uv" | "sessions") => points.map((point) => point[key]);
    let next: Series[];
    if (metric === "pv") next = [{ label: "浏览量", values: valuesOf("pv") }];
    else if (metric === "uv") next = [{ label: "访客数", values: valuesOf("uv") }];
    else if (metric === "sessions") next = [{ label: "会话数", values: valuesOf("sessions") }];
    else
      next = [
        { label: "浏览量", values: valuesOf("pv") },
        { label: "访客数", values: valuesOf("uv"), dashed: true },
      ];
    return { labels: points.map((point) => formatShortDate(point.date)), series: next };
  }, [timeseries, metric]);

  return (
    <Panel
      title="访问趋势"
      description="按天汇总，悬停查看当日数值"
      action={
        <SegmentControl
          options={OPTIONS}
          value={metric}
          onChange={setMetric}
          ariaLabel="趋势序列切换"
        />
      }
    >
      {loading ? (
        <Skeleton className="h-[260px] w-full" />
      ) : (
        <AreaChart labels={labels} series={series} height={260} />
      )}
    </Panel>
  );
}