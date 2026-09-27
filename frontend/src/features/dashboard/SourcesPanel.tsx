import { useState } from "react";

import type { SourcesResponse } from "../../api/stats";
import { BarList } from "../../components/charts/BarList";
import { Donut } from "../../components/charts/Donut";
import { Panel } from "../../components/layout/Panel";
import { SegmentControl } from "../../components/layout/SegmentControl";
import { Skeleton } from "../../components/ui/skeleton";
import { formatNumber } from "../../lib/format";

type SourceView = "channel" | "referrer";

const OPTIONS: { key: SourceView; label: string }[] = [
  { key: "channel", label: "渠道" },
  { key: "referrer", label: "引荐" },
];

/** 来源分析：渠道占比环形图 + 引荐域名排行 */
export function SourcesPanel({
  sources,
  loading,
}: {
  sources: SourcesResponse | null;
  loading: boolean;
}) {
  const [view, setView] = useState<SourceView>("channel");
  const channels = sources?.channels ?? [];
  const referrers = sources?.referrers ?? [];
  const channelPv = channels.reduce((sum, item) => sum + item.pv, 0);
  const referrerPv = referrers.reduce((sum, item) => sum + item.pv, 0);

  return (
    <Panel
      title="来源分析"
      description={
        view === "channel"
          ? `渠道分类 · 共 ${formatNumber(channelPv)} 次浏览`
          : `引荐域名 Top ${referrers.length} · 共 ${formatNumber(referrerPv)} 次浏览`
      }
      action={
        <SegmentControl
          options={OPTIONS}
          value={view}
          onChange={setView}
          ariaLabel="来源视图切换"
        />
      }
    >
      {loading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : view === "channel" ? (
        <Donut
          items={channels.map((item) => ({ label: item.label || item.key, value: item.pv }))}
          centerLabel="总浏览量"
        />
      ) : (
        <BarList
          items={referrers.map((item) => ({
            label: item.label || item.key,
            value: item.pv,
            secondary: item.uv,
            hint: referrerPv ? `${((item.pv / referrerPv) * 100).toFixed(1)}%` : undefined,
            title: `${item.key} · 浏览量 ${formatNumber(item.pv)} · 访客数 ${formatNumber(item.uv)}`,
          }))}
          emptyText="暂无引荐来源，直接访问为主"
        />
      )}
    </Panel>
  );
}