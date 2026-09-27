# 流量台 Glassmeter

网站流量监测平台：在平台上创建站点、拿到一段 JS 埋点代码，嵌入自己的网页后即可在平台看板查看访问数据。
前后分离（前端 SPA + 后端 API + 独立埋点 SDK），黑白单色双主题 + 玻璃拟态，全程不使用 emoji 与图标。

```
  ┌───────────────────────────┐
  │  流量台  G L A S S M E T E R│
  └───────────────────────────┘
```

## 目录结构

```
.
├── docs/         需求（PRD）· 技术架构（ARCHITECTURE）· 设计规范（DESIGN）
├── backend/      FastAPI + SQLAlchemy（默认 SQLite，可切 MySQL）
├── frontend/     React 18 + Vite + TypeScript + Tailwind（玻璃设计系统）
└── tracker/      埋点 SDK（原生 JS 单文件，源码即发布物）
```

## 快速启动

### 1. 后端（端口 8000）

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # 可选：修改 JWT_SECRET / DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

### 2. 演示数据（可选，零配置看完整看板）

```bash
cd backend && source .venv/bin/activate
python -m app.services.seed
```

生成演示账号 `demo@glassmeter.local` / `demo1234`，含 1 个演示站点与近 30 天模拟访问数据。

### 3. 前端（端口 5173）

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173，/api 与 /tracker.js 自动代理到 8000
```

### 4. 接入自己的网站

登录后新建站点 → 复制页面给出的代码 → 粘贴到被测网站公共布局的 `<head>` 内：

```html
<script defer src="https://<平台地址>/tracker.js" data-site="pk_live_xxxxxxxx"></script>
```

## 常用命令

| 位置 | 命令 | 说明 |
| --- | --- | --- |
| `backend/` | `uvicorn app.main:app --reload` | 启动后端（OpenAPI 文档在 `/docs`） |
| `backend/` | `python -m pytest tests` | 全链路冒烟测试（注册 → 建站 → 上报 → 看板） |
| `backend/` | `python -m app.services.seed` | 生成演示账号与 30 天演示数据 |
| `frontend/` | `npm run dev` | 开发服务器 |
| `frontend/` | `npm run build` | 类型检查 + 生产构建（产物 `frontend/dist`） |

## 环境变量（backend/.env）

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./glassmeter.db` | MySQL 示例：`mysql+pymysql://user:pwd@127.0.0.1:3306/glassmeter?charset=utf8mb4`（需 `pip install pymysql`） |
| `JWT_SECRET` | dev 默认值 | 生产环境必须修改 |
| `CORS_ORIGINS` | `http://localhost:5173` | 逗号分隔；`/api/collect` 始终放开 `*` |
| `TRACKER_PATH` | `../tracker/tracker.js` | SDK 文件位置，由 `GET /tracker.js` 托管 |
| `TZ_OFFSET` | `8` | 统计口径使用的固定时区偏移（小时） |
| `SERVE_FRONTEND` | `false` | 为 `true` 且 `frontend/dist` 存在时，由后端直接托管前端构建产物（单容器部署） |

## 文档

- [docs/PRD.md](docs/PRD.md) — 产品需求、功能范围、指标口径、验收标准
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 架构、目录规划、数据模型、API 契约、埋点协议
- [docs/DESIGN.md](docs/DESIGN.md) — 玻璃拟态六效果实现规范、主题 token、组件与图表规范
- [tracker/README.md](tracker/README.md) — 埋点 SDK 使用说明与上报协议
- [backend/README.md](backend/README.md) — 后端结构与接口说明

## 设计约束（实现与评审逐条核对）

- 仅黑白灰阶，禁止任何彩色与彩色渐变；图表用亮度 / 虚实 / 纹理区分序列
- 禁止 emoji、图标字体、图标 SVG、图片素材；品牌标记为纯 CSS 几何 + 文字字标
- 玻璃六效果完整落地：折射、反射、边缘、边缘泛光（hover / focus）、光晕、按压（按压点涟漪 + 压缩 + 微扭曲 + 释放回弹）
- `prefers-reduced-motion` 下全部动效关闭