import { BrowserRouter } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { ToastProvider } from "./components/ui/toast";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./features/auth/AuthContext";
import { AppRouter } from "./router";

/** 应用根：路由 + 鉴权 / 主题 / 提示 Provider + 全局环境底与折射滤镜 */
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <ToastProvider>
            <AppShell>
              <AppRouter />
            </AppShell>
          </ToastProvider>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}