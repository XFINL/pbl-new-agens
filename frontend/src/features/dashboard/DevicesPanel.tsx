import { useState } from "react";

import type { DevicesResponse } from "../../api/stats";
import { BarList } from "../../components/charts/BarList";
import { Panel } from "../../components/layout/Panel";
import { SegmentControl } from "../../components/layout/SegmentControl";
import { Skeleton } from "../../components/ui/skeleton";
import { formatNumber } from "../../lib/format";

type DeviceView = "browser" | "os" | "device_type" | "screen";

const OPTIONS: { key: DeviceView; label: string }[] = [
  { key: "browser", label: "浏览器" },
  { key: "os", label: "系统" },
  { key: "device_type", label: "设备" },
  { key: "screen", label: "屏幕" },
];

const VIEW_LABELS: Record<DeviceView, string> = {
  browser: "浏览器",
  os: "操作系统",
  device_type: "设备类型",
  screen: "屏幕宽度",
};

/** 设备分析：浏览器 / 系统 / 设备类型 / 屏幕宽度四个维度排行 */
export function DevicesPanel({
  devices,
  loading,
}: {
  devices: DevicesResponse | null;
  loading: boolean;
}) {
  const [view, setView] = useState<DeviceView>("browser");
  const items = devices?.[view] ?? [];
  const total = items.reduce((sum, item) => sum + item.pv, 0);

  return (
    <Panel
      title="设备分析"
      description={`${VIEW_LABELS[view]} · 共 ${formatNumber(total)} 次浏览`}
      action={
        <SegmentControl
          options={OPTIONS}
          value={view}
          onChange={setView}
          ariaLabel="设备维度切换"
        />
      }
    >
      {loading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : (
        <BarList
          items={items.map((item) => ({
            label: item.key,
            value: item.pv,
            secondary: item.uv,
            hint: total ? `${((item.pv / total) * 100).toFixed(1)}%` : undefined,
            title: `${item.key} · 浏览量 ${formatNumber(item.pv)} · 访客数 ${formatNumber(
              item.uv
            )}`,
          }))}
          emptyText="该维度暂无数据"
        />
      )}
    </Panel>
  );
}