import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./features/auth/AuthContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { SitesPage } from "./features/sites/SitesPage";

/** 路由表：/ 站点列表；/sites/:siteId 看板；登录注册公开 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <SitesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/sites/:siteId"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}