import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 开发态：/api 与 /tracker.js 代理到本地后端（前后分离，生产各自部署）
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/tracker.js": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});