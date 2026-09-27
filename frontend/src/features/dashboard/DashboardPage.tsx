import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Panel } from "../../components/layout/Panel";
import { SegmentControl } from "../../components/layout/SegmentControl";
import { TopBar } from "../../components/layout/TopBar";
import { useSites } from "../../hooks/useSites";
import { useStats } from "../../hooks/useStats";
import { useTheme } from "../../hooks/useTheme";
import { formatDateTime } from "../../lib/format";
import { RANGE_OPTIONS, rangeLabel, type RangeKey } from "../../lib/range";
import { useAuth } from "../auth/AuthContext";
import { DevicesPanel } from "./DevicesPanel";
import { MetricCards } from "./MetricCards";
import { PagesPanel } from "./PagesPanel";
import { SnippetPanel } from "./SnippetPanel";
import { SourcesPanel } from "./SourcesPanel";
import { TrendPanel } from "./TrendPanel";

/** 数据看板：顶栏（站点切换 + 时间范围）+ 五面板 + 埋点代码 */
export function DashboardPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = Number(params.siteId);
  const validId = Number.isInteger(siteId) && siteId > 0;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { sites, loading: sitesLoading } = useSites();
  const [range, setRange] = useState<RangeKey>("7d");
  const { data, loading, error, reload } = useStats(validId ? siteId : null, range);

  const activeSite = useMemo(
    () => sites.find((site) => site.id === siteId) ?? null,
    [sites, siteId]
  );
  const notFound = !sitesLoading && sites.length > 0 && !activeSite;

  return (
    <>
      {user ? (
        <TopBar
          user={user}
          theme={theme}
          onToggleTheme={toggle}
          sites={sites}
          activeSiteId={validId ? siteId : null}
          onSelectSite={(nextId) => navigate(`/sites/${nextId}`)}
          onLogout={logout}
          extra={
            <SegmentControl
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              ariaLabel="时间范围"
            />
          }
        />
      ) : null}

      {notFound ? (
        <Panel title="站点不可用" description="该站点不存在，或不属于当前账号">
          <Button variant="solid" size="sm" onClick={() => navigate("/")}>
            返回站点列表
          </Button>
        </Panel>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-fg">
                {activeSite ? activeSite.name : "正在载入站点"}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                {activeSite ? <span className="truncate">{activeSite.domain}</span> : null}
                <Badge>{rangeLabel(range)}</Badge>
                {activeSite ? (
                  <span className="text-2xs text-faint">
                    创建于 {formatDateTime(activeSite.created_at)}
                  </span>
                ) : null}
              </p>
            </div>
            <Button
              variant="glass"
              size="sm"
              disabled={loading}
              onClick={() => void reload()}
            >
              {loading ? "加载中" : "刷新数据"}
            </Button>
          </div>

          <p aria-live="polite" className="sr-only">
            {loading ? "正在加载看板数据" : "看板数据已更新"}
          </p>

          {error ? (
            <Panel title="数据加载失败" description={error}>
              <Button variant="solid" size="sm" onClick={() => void reload()}>
                重新加载
              </Button>
            </Panel>
          ) : (
            <>
              <MetricCards
                overview={data?.overview ?? null}
                timeseries={data?.timeseries ?? null}
                range={range}
                loading={loading}
              />
              <TrendPanel timeseries={data?.timeseries ?? null} loading={loading} />
              <div className="grid gap-4 lg:grid-cols-2">
                <SourcesPanel sources={data?.sources ?? null} loading={loading} />
                <DevicesPanel devices={data?.devices ?? null} loading={loading} />
              </div>
              <PagesPanel pages={data?.pages ?? null} loading={loading} />
              {activeSite ? <SnippetPanel site={activeSite} /> : null}
            </>
          )}
        </div>
      )}
    </>
  );
}