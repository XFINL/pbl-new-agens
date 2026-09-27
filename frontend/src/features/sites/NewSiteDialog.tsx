import { useState, type FormEvent } from "react";

import { createSite, type Site } from "../../api/sites";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/toast";

interface NewSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (site: Site) => void;
}

export function NewSiteDialog({ open, onOpenChange, onCreated }: NewSiteDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const site = await createSite(name.trim(), domain.trim());
      setName("");
      setDomain("");
      onOpenChange(false);
      toast("站点已创建，安装代码已生成");
      onCreated(site);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <div>
            <DialogTitle>新建站点</DialogTitle>
            <DialogDescription>填写站点名称与域名，创建后即可获取埋点代码</DialogDescription>
          </div>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="site-name">站点名称</Label>
            <Input
              id="site-name"
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：我的博客"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="site-domain">域名</Label>
            <Input
              id="site-domain"
              required
              maxLength={255}
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              placeholder="例如：blog.example.com"
            />
          </div>

          {error ? (
            <p role="alert" className="text-xs text-fg">
              创建失败：{error}
            </p>
          ) : null}

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" variant="solid" size="md" disabled={submitting}>
              {submitting ? "正在创建" : "创建站点"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}