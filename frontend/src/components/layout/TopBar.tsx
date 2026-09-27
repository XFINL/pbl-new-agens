import type { ReactNode } from "react";

import type { Site } from "../../api/sites";
import type { User } from "../../api/auth";
import { formatDateTime } from "../../lib/format";
import { cn } from "../../lib/utils";
import { GlassPanel } from "../glass/GlassPanel";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Brandmark } from "./Brandmark";
import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
  user: User;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  sites: Site[];
  activeSiteId?: number | null;
  onSelectSite?: (siteId: number) => void;
  onLogout: () => void;
  /** 站点列表页等场景下的额外操作 */
  extra?: ReactNode;
}

export function TopBar({
  user,
  theme,
  onToggleTheme,
  sites,
  activeSiteId,
  onSelectSite,
  onLogout,
  extra,
}: TopBarProps) {
  const activeSite = sites.find((site) => site.id === activeSiteId) ?? null;

  return (
    <GlassPanel size="md" className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-4">
        <Brandmark />

        {sites.length > 0 && onSelectSite ? (
          <>
            <span aria-hidden="true" className="h-4 w-px bg-[var(--line)]" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="max-w-[16rem] gap-2 px-2">
                  <span className="truncate text-sm text-fg">
                    {activeSite ? activeSite.name : "选择站点"}
                  </span>
                  <span aria-hidden="true" className="text-2xs text-faint">
                    {activeSite ? "切换" : "展开"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[60vh] w-[18rem] overflow-y-auto">
                <DropdownMenuLabel>我的站点（{sites.length}）</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sites.map((site) => (
                  <DropdownMenuItem
                    key={site.id}
                    onSelect={() => onSelectSite(site.id)}
                    className={cn(site.id === activeSiteId && "bg-[var(--tint-weak)]")}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{site.name}</span>
                      <span className="truncate text-2xs text-faint">{site.domain}</span>
                    </span>
                    {site.id === activeSiteId ? (
                      <span className="shrink-0 text-2xs text-faint">当前</span>
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {extra}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="glass" size="sm" className="px-3">
              <span className="max-w-[9rem] truncate">{user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[16rem]">
            <DropdownMenuLabel>已登录账号</DropdownMenuLabel>
            <DropdownMenuItem disabled className="cursor-default">
              <span className="truncate text-xs">{user.email}</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-default">
              <span className="text-xs text-faint">注册于 {formatDateTime(user.created_at)}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout}>
              <span className="text-sm">退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </GlassPanel>
  );
}