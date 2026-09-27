import type { PageItem } from "../../api/stats";
import { Panel } from "../../components/layout/Panel";
import { Skeleton } from "../../components/ui/skeleton";
import { formatDuration, formatNumber } from "../../lib/format";

/** 页面排行：路径 / 浏览量 / 访客数 / 平均停留（Top 20） */
export function PagesPanel({ pages, loading }: { pages: PageItem[] | null; loading: boolean }) {
  const rows = pages ?? [];

  return (
    <Panel title="页面排行" description="按浏览量排序，最多 20 条">
      {loading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-xs text-faint">所选时间范围内暂无页面数据</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-2xs text-faint">
                <th scope="col" className="pb-2 text-left font-normal">
                  路径
                </th>
                <th scope="col" className="pb-2 pl-3 text-right font-normal">
                  浏览量
                </th>
                <th scope="col" className="pb-2 pl-3 text-right font-normal">
                  访客数
                </th>
                <th scope="col" className="pb-2 pl-3 text-right font-normal">
                  平均停留
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((page) => (
                <tr
                  key={page.path}
                  className="border-t border-[var(--line)] transition-colors hover:bg-[var(--tint-weak)]"
                >
                  <td
                    className="max-w-[28rem] truncate py-2 pr-3 text-fg"
                    title={`${page.path} · 浏览量 ${formatNumber(page.pv)}`}
                  >
                    {page.path}
                  </td>
                  <td className="num py-2 pl-3 text-right text-fg">{formatNumber(page.pv)}</td>
                  <td className="num py-2 pl-3 text-right text-muted">{formatNumber(page.uv)}</td>
                  <td className="num py-2 pl-3 text-right text-muted">
                    {formatDuration(page.avg_duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}