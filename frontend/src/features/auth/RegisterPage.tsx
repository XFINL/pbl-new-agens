import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { GlassPanel } from "../../components/glass/GlassPanel";
import { Brandmark } from "../../components/layout/Brandmark";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "./AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "注册失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-5 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Brandmark />
        <span className="text-2xs text-faint">网站流量监测</span>
      </div>

      <GlassPanel size="lg" className="p-7">
        <h1 className="text-lg font-semibold text-fg">注册</h1>
        <p className="mt-1 text-xs text-muted">创建账号后即可接入站点开始统计</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">密码（至少 8 位）</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm">确认密码</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="再次输入密码"
            />
          </div>

          {error ? (
            <p role="alert" className="text-xs text-fg">
              注册失败：{error}
            </p>
          ) : null}

          <Button type="submit" variant="solid" size="lg" disabled={submitting} className="mt-1 w-full">
            {submitting ? "正在创建" : "创建账号"}
          </Button>
        </form>

        <div className="gm-hairline my-5" />

        <p className="text-xs text-muted">
          已有账号？
          <Link to="/login" className="ml-1 text-fg underline underline-offset-2">
            返回登录
          </Link>
        </p>
      </GlassPanel>
    </main>
  );
}