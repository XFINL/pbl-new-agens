import { useState } from "react";

import { deleteSite, type Site } from "../../api/sites";
import { Panel } from "../../components/layout/Panel";
import { TopBar } from "../../components/layout/TopBar";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Skeleton } from "../../components/ui/skeleton";
import { useToast } from "../../components/ui/toast";
import { useSites } from "../../hooks/useSites";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../auth/AuthContext";
import { NewSiteDialog } from "./NewSiteDialog";
import { SiteCard } from "./SiteCard";

const STEPS = [
  { title: "新建站点", detail: "填写站点名称与域名，系统生成专属公钥。" },
  { title: "嵌入代码", detail: "复制埋点代码，粘贴到网站公共布局的 head 中。" },
  { title: "查看数据", detail: "回到看板选择时间范围，查看浏览、来源与设备数据。" },
];

/** 站点列表页：站点卡片 + 新建 / 删除 + 接入流程说明 */
export function SitesPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { sites, loading, error, reload } = useSites();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteSite(pendingDelete.id);
      toast(`站点「${pendingDelete.name}」及其访问数据已删除`);
      setPendingDelete(null);
      await reload();
    } catch (deleteError) {
      toast(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {user ? (
        <TopBar
          user={user}
          theme={theme}
          onToggleTheme={toggle}
          sites={sites}
          onLogout={logout}
          extra={
            <Button variant="solid" size="sm" onClick={() => setDialogOpen(true)}>
              新建站点
            </Button>
          }
        />
      ) : null}

      <Panel title="接入流程" description="三步开始采集访问数据">
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[var(--radius-control)] bg-[var(--tint-weak)] px-4 py-3"
            >
              <p className="num text-2xs text-faint">步骤 {index + 1}</p>
              <p className="mt-1 text-sm font-medium text-fg">{step.title}</p>
              <p className="mt-1 text-2xs text-muted">{step.detail}</p>
            </div>
          ))}
        </div>
      </Panel>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <h1 className="text-lg font-semibold text-fg">我的站点</h1>
          <span className="num text-2xs text-faint">共 {sites.length} 个</span>
        </div>

        {error ? (
          <Panel title="站点加载失败" description={error}>
            <Button variant="solid" size="sm" onClick={() => void reload()}>
              重新加载
            </Button>
          </Panel>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[196px] w-full rounded-[var(--radius-panel)]" />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <Panel
            title="还没有站点"
            description="新建一个站点并嵌入埋点代码，几分钟后即可看到访问数据"
          >
            <Button variant="solid" size="sm" onClick={() => setDialogOpen(true)}>
              新建站点
            </Button>
          </Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} onDelete={setPendingDelete} />
            ))}
          </div>
        )}
      </section>

      <NewSiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          void reload();
        }}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <div>
              <DialogTitle>删除站点</DialogTitle>
              <DialogDescription>
                将删除站点「{pendingDelete?.name}」及其全部访问数据，操作不可恢复。
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setPendingDelete(null)}>
              取消
            </Button>
            <Button
              variant="solid"
              size="md"
              disabled={deleting}
              onClick={() => void handleConfirmDelete()}
            >
              {deleting ? "正在删除" : "确认删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}