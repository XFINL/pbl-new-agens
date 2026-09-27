import type { OverviewResponse, TimeseriesPoint } from "../../api/stats";
import { Sparkline } from "../../components/charts/Sparkline";
import { GlassPanel } from "../../components/glass/GlassPanel";
import { Skeleton } from "../../components/ui/skeleton";
import { formatDelta, formatDuration, formatNumber, formatPercent } from "../../lib/format";
import { compareLabel, type RangeKey } from "../../lib/range";

interface MetricCardsProps {
  overview: OverviewResponse | null;
  timeseries: TimeseriesPoint[] | null;
  range: RangeKey;
  loading: boolean;
}

/** 指标卡组：PV / UV / 会话数 / 跳出率 / 平均会话时长，均带环比与迷你趋势 */
export function MetricCards({ overview, timeseries, range, loading }: MetricCardsProps) {
  if (loading || !overview) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <GlassPanel key={index} className="p-4">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-3 h-3 w-20" />
          </GlassPanel>
        ))}
      </div>
    );
  }

  const { current, previous } = overview;
  const points = timeseries ?? [];
  const cards: { label: string; value: string; delta: string | null; spark?: number[] }[] = [
    {
      label: "浏览量 PV",
      value: formatNumber(current.pv),
      delta: formatDelta(current.pv, previous.pv),
      spark: points.map((point) => point.pv),
    },
    {
      label: "访客数 UV",
      value: formatNumber(current.uv),
      delta: formatDelta(current.uv, previous.uv),
      spark: points.map((point) => point.uv),
    },
    {
      label: "会话数",
      value: formatNumber(current.sessions),
      delta: formatDelta(current.sessions, previous.sessions),
      spark: points.map((point) => point.sessions),
    },
    {
      label: "跳出率",
      value: formatPercent(current.bounce_rate),
      delta: formatDelta(current.bounce_rate, previous.bounce_rate),
    },
    {
      label: "平均会话时长",
      value: formatDuration(current.avg_duration),
      delta: formatDelta(current.avg_duration, previous.avg_duration),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <GlassPanel key={card.label} className="flex flex-col justify-between gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-2xs text-faint">{card.label}</p>
            {card.spark ? <Sparkline values={card.spark} /> : null}
          </div>
          <p className="num text-metric font-semibold leading-none text-fg">{card.value}</p>
          <p className="text-2xs text-muted">
            {compareLabel(range)} <span className="num text-fg">{card.delta ?? "—"}</span>
          </p>
        </GlassPanel>
      ))}
    </div>
  );
}