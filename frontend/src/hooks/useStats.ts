import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchDevices,
  fetchOverview,
  fetchPages,
  fetchSources,
  fetchTimeseries,
  type DevicesResponse,
  type OverviewResponse,
  type PageItem,
  type SourcesResponse,
  type TimeseriesPoint,
} from "../api/stats";
import type { RangeKey } from "../lib/range";

export interface DashboardData {
  overview: OverviewResponse;
  timeseries: TimeseriesPoint[];
  sources: SourcesResponse;
  devices: DevicesResponse;
  pages: PageItem[];
}

interface State {
  loading: boolean;
  error: string | null;
  data: DashboardData | null;
}

/** 一次性并行拉取看板全部面板数据（站点 / 范围变化时重新拉取）。 */
export function useStats(siteId: number | null, range: RangeKey) {
  const [state, setState] = useState<State>({ loading: false, error: null, data: null });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!siteId) {
      setState({ loading: false, error: null, data: null });
      return;
    }
    const currentId = ++requestId.current;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const [overview, timeseries, sources, devices, pages] = await Promise.all([
        fetchOverview(siteId, range),
        fetchTimeseries(siteId, range),
        fetchSources(siteId, range),
        fetchDevices(siteId, range),
        fetchPages(siteId, range),
      ]);
      if (currentId !== requestId.current) return;
      setState({
        loading: false,
        error: null,
        data: { overview, timeseries, sources, devices, pages },
      });
    } catch (error) {
      if (currentId !== requestId.current) return;
      const message = error instanceof Error ? error.message : "加载失败";
      setState({ loading: false, error: message, data: null });
    }
  }, [siteId, range]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}