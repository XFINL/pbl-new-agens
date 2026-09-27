import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { GlassPanel } from "../../components/glass/GlassPanel";
import { Brandmark } from "../../components/layout/Brandmark";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "登录失败");
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
        <h1 className="text-lg font-semibold text-fg">登录</h1>
        <p className="mt-1 text-xs text-muted">登录后即可创建站点并查看访问数据</p>

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
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
            />
          </div>

          {error ? (
            <p role="alert" className="text-xs text-fg">
              登录失败：{error}
            </p>
          ) : null}

          <Button type="submit" variant="solid" size="lg" disabled={submitting} className="mt-1 w-full">
            {submitting ? "正在登录" : "登录"}
          </Button>
        </form>

        <div className="gm-hairline my-5" />

        <p className="text-xs text-muted">
          还没有账号？
          <Link to="/register" className="ml-1 text-fg underline underline-offset-2">
            注册新账号
          </Link>
        </p>
        <p className="mt-3 text-2xs text-faint">
          演示账号：demo@glassmeter.local / demo1234（需先在后端执行 seed）
        </p>
      </GlassPanel>
    </main>
  );
}