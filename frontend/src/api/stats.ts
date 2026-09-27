import { apiRequest } from "./client";
import type { RangeKey } from "../lib/range";

export interface Metrics {
  pv: number;
  uv: number;
  sessions: number;
  bounce_rate: number;
  avg_duration: number;
}

export interface OverviewResponse {
  current: Metrics;
  previous: Metrics;
}

export interface TimeseriesPoint {
  date: string;
  pv: number;
  uv: number;
  sessions: number;
}

export interface DimensionItem {
  key: string;
  pv: number;
  uv: number;
  label?: string;
}

export interface SourcesResponse {
  channels: DimensionItem[];
  referrers: DimensionItem[];
}

export interface DevicesResponse {
  browser: DimensionItem[];
  os: DimensionItem[];
  device_type: DimensionItem[];
  screen: DimensionItem[];
}

export interface PageItem {
  path: string;
  pv: number;
  uv: number;
  avg_duration: number;
}

export function fetchOverview(siteId: number, range: RangeKey): Promise<OverviewResponse> {
  return apiRequest<OverviewResponse>(`/api/stats/${siteId}/overview?range=${range}`);
}

export function fetchTimeseries(siteId: number, range: RangeKey): Promise<TimeseriesPoint[]> {
  return apiRequest<TimeseriesPoint[]>(`/api/stats/${siteId}/timeseries?range=${range}`);
}

export function fetchSources(siteId: number, range: RangeKey): Promise<SourcesResponse> {
  return apiRequest<SourcesResponse>(`/api/stats/${siteId}/sources?range=${range}`);
}

export function fetchDevices(siteId: number, range: RangeKey): Promise<DevicesResponse> {
  return apiRequest<DevicesResponse>(`/api/stats/${siteId}/devices?range=${range}`);
}

export function fetchPages(siteId: number, range: RangeKey): Promise<PageItem[]> {
  return apiRequest<PageItem[]>(`/api/stats/${siteId}/pages?range=${range}`);
}