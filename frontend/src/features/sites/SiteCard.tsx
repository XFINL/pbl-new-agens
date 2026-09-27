import { useNavigate } from "react-router-dom";

import type { Site } from "../../api/sites";
import { formatDateTime } from "../../lib/format";
import { GlassPanel } from "../../components/glass/GlassPanel";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

interface SiteCardProps {
  site: Site;
  onDelete: (site: Site) => void;
}

export function SiteCard({ site, onDelete }: SiteCardProps) {
  const navigate = useNavigate();

  return (
    <GlassPanel interactive className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">{site.name}</h3>
          <p className="mt-1 truncate text-xs text-muted">{site.domain}</p>
        </div>
        <Badge className="shrink-0">已接入</Badge>
      </div>

      <div className="rounded-[10px] bg-[var(--tint-weak)] px-3 py-2">
        <p className="text-2xs text-faint">站点公钥</p>
        <p className="mono mt-1 truncate text-2xs text-fg" title={site.public_key}>
          {site.public_key}
        </p>
      </div>

      <p className="text-2xs text-faint">创建于 {formatDateTime(site.created_at)}</p>

      <div className="mt-auto flex items-center gap-2">
        <Button variant="solid" size="sm" onClick={() => navigate(`/sites/${site.id}`)}>
          查看数据
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(site)}>
          删除
        </Button>
      </div>
    </GlassPanel>
  );
}