import { useMemo } from "react";

import { buildSnippet, type Site } from "../../api/sites";
import { Panel } from "../../components/layout/Panel";
import { Button } from "../../components/ui/button";
import { useToast } from "../../components/ui/toast";
import { copyText } from "../../lib/capability";

/** 埋点代码：展示可复制的 SDK 引入片段 + 三步接入说明 */
export function SnippetPanel({ site }: { site: Site }) {
  const { toast } = useToast();
  const snippet = useMemo(() => buildSnippet(site.public_key), [site.public_key]);

  const handleCopy = async () => {
    const ok = await copyText(snippet);
    toast(ok ? "埋点代码已复制" : "复制失败，请手动选中代码复制");
  };

  return (
    <Panel
      title="埋点代码"
      description="将代码粘贴到网站 <head> 内即可开始采集，通常几分钟内出数据"
    >
      <div className="flex flex-col gap-4">
        <pre className="glass-inset overflow-x-auto px-4 py-3">
          <code className="mono whitespace-pre text-2xs leading-relaxed text-fg">{snippet}</code>
        </pre>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="mono min-w-0 truncate text-2xs text-faint">
            站点公钥 {site.public_key}
          </span>
          <Button variant="solid" size="sm" onClick={handleCopy}>
            复制代码
          </Button>
        </div>

        <div className="gm-hairline" />

        <ol className="flex flex-col gap-2 text-2xs text-muted">
          <li>
            <span className="num mr-2 text-fg">1</span>
            复制上方代码，粘贴到被测网站每个页面都能加载的位置（一般是公共布局的 head）。
          </li>
          <li>
            <span className="num mr-2 text-fg">2</span>
            发布上线后打开页面浏览一次，SDK 会自动上报浏览与停留心跳。
          </li>
          <li>
            <span className="num mr-2 text-fg">3</span>
            回到本页选择时间范围查看数据；SPA 站点的前端路由切换同样会被记录。
          </li>
        </ol>
      </div>
    </Panel>
  );
}