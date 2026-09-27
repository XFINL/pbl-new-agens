# 流量台 Glassmeter · 技术架构文档

## 1. 架构总览

```
┌──────────────┐   pageview / pulse    ┌───────────────────────────┐
│ 访客浏览器    │ ────────────────────► │ 后端 FastAPI              │
│ tracker.js   │  POST /api/collect    │  ├─ /api/collect  采集    │
└──────────────┘                       │  ├─ /api/auth/*   账号    │
                                       │  ├─ /api/sites/*  站点    │
┌──────────────┐   JWT + JSON          │  ├─ /api/stats/*  聚合    │
│ 站主浏览器    │ ◄───────────────────► │  └─ /tracker.js   SDK     │
│ React SPA    │        REST           └────────────┬──────────────┘
└──────────────┘                                    │ SQLAlchemy
                                                    ▼
                                       SQLite（默认，WAL 模式）
                                       MySQL（可选，仅换 DATABASE_URL）
```

- 前后分离：前端 SPA（Vite dev server / 静态托管）通过 REST 访问后端，开发态用 Vite 代理 `/api`
- SDK 与后端同源托管：`GET /tracker.js` 由后端直接读取 `tracker/tracker.js` 返回，避免多副本
- 无消息队列、无 Redis：采集同步落库（单机量级足够；后续扩展点见第 10 节）

## 2. 技术选型

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 前端 | React 18 + Vite + TypeScript | 已确认 |
| 样式 | Tailwind CSS v3 + CSS 变量主题 token | 玻璃材质全部自定义 CSS，见 DESIGN.md |
| 组件 | shadcn/ui 风格（Radix 无头组件 + CVA + tailwind-merge，源码内联） | 已确认；不使用任何图标库 |
| 路由 | react-router-dom v6 | |
| 图表 | 手写 SVG 组件（面积折线 / 条形 / 环形 / 迷你线） | 单色 + 纹理区分，完全可控，不引入图表库 |
| 后端 | Python 3.11+ / FastAPI + Uvicorn | 已确认 |
| ORM | SQLAlchemy 2.0（同步） | |
| 数据库 | SQLite（默认，WAL）；MySQL 可选 | 通过 `DATABASE_URL` 切换，代码零改动 |
| 鉴权 | JWT（PyJWT）+ bcrypt | 无 OAuth、无三方登录 |
| 采集 SDK | 原生 JS 单文件 | `tracker/tracker.js`，无构建步骤 |

## 3. 目录结构（前后分离）

```
/workspace
├── docs/
│   ├── PRD.md                      # 需求与验收
│   ├── ARCHITECTURE.md             # 本文档
│   └── DESIGN.md                   # 玻璃拟态设计规范
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI 实例 / CORS / 路由挂载 / GET /tracker.js
│   │   ├── config.py               # 环境变量：DATABASE_URL、JWT_SECRET、CORS_ORIGINS、TRACKER_PATH
│   │   ├── database.py             # engine / SessionLocal / Base（SQLite 开启 WAL + foreign_keys）
│   │   ├── models.py               # User / Site / Visit
│   │   ├── schemas.py              # Pydantic v2 请求与响应模型
│   │   ├── security.py             # bcrypt 哈希、JWT 签发与校验
│   │   ├── deps.py                 # get_db / get_current_user / get_owned_site
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # 注册 / 登录 / me
│   │   │   ├── sites.py            # 站点 CRUD
│   │   │   ├── collect.py          # 埋点上报（公开，CORS 放开）
│   │   │   └── stats.py            # 看板聚合查询（鉴权 + 归属校验）
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── ingest.py           # 采集校验、清洗、落库
│   │       ├── aggregate.py        # 指标/趋势/来源/设备/页面 聚合 SQL
│   │       ├── classify.py         # 来源渠道分类、UA 解析、屏幕分桶
│   │       └── seed.py             # 演示账号 + 站点 + 30 天模拟数据
│   ├── tests/
│   │   └── test_smoke.py           # 注册→建站→上报→看板 全链路冒烟
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts              # /api、/tracker.js 代理 → 127.0.0.1:8000
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                 # 路由出口 + 主题 Provider + Auth Provider
│       ├── router.tsx              # /login /register / /sites/:id
│       ├── api/
│       │   ├── client.ts           # fetch 封装：baseURL、Bearer、401 跳登录
│       │   ├── auth.ts
│       │   ├── sites.ts
│       │   └── stats.ts
│       ├── styles/
│       │   ├── index.css           # tailwind 三件套 + 深浅主题 CSS 变量
│       │   └── glass.css           # 玻璃六效果 + 按压态 + 动效
│       ├── lib/
│       │   ├── utils.ts            # cn()
│       │   ├── format.ts           # 数字 / 时长 / 百分比 / 千分位
│       │   └── range.ts            # 时间范围枚举与日期序列
│       ├── components/
│       │   ├── ui/                 # shadcn 风格基础组件（全部无图标）
│       │   │   ├── button.tsx  card.tsx  input.tsx  label.tsx
│       │   │   ├── dialog.tsx  dropdown-menu.tsx  tabs.tsx
│       │   │   ├── tooltip.tsx  table.tsx  badge.tsx  skeleton.tsx
│       │   │   └── toast.tsx
│       │   ├── glass/
│       │   │   ├── GlassPanel.tsx      # 玻璃容器：折射/反射/边缘/光晕
│       │   │   ├── GlassButton.tsx     # 玻璃按钮 + 按压交互
│       │   │   ├── usePress.ts         # 按压点 → --px/--py/--rx/--ry，释放回弹
│       │   │   ├── RefractionDefs.tsx  # SVG 滤镜定义：折射位移 / 按压微扭曲
│       │   │   └── AmbientBackdrop.tsx # 黑白环境底（供玻璃折射的“背景材质”）
│       │   ├── charts/
│       │   │   ├── AreaChart.tsx       # 折线/面积 + 网格 + 悬停提示
│       │   │   ├── BarList.tsx         # 横向条形排行
│       │   │   ├── Donut.tsx           # 环形占比
│       │   │   └── Sparkline.tsx       # 指标卡迷你趋势
│       │   └── layout/
│       │       ├── AppShell.tsx        # 顶栏 + 内容区布局
│       │       ├── TopBar.tsx          # 站点切换 / 范围切换 / 主题 / 账号
│       │       └── ThemeToggle.tsx
│       ├── features/
│       │   ├── auth/
│       │   │   ├── AuthContext.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   └── RegisterPage.tsx
│       │   ├── sites/
│       │   │   ├── SitesPage.tsx
│       │   │   ├── SiteCard.tsx
│       │   │   └── NewSiteDialog.tsx
│       │   └── dashboard/
│       │       ├── DashboardPage.tsx   # 组合：范围状态 + 数据拉取 + 面板编排
│       │       ├── MetricCards.tsx
│       │       ├── TrendPanel.tsx
│       │       ├── SourcesPanel.tsx
│       │       ├── DevicesPanel.tsx
│       │       ├── PagesPanel.tsx
│       │       └── SnippetPanel.tsx    # 埋点代码 + 复制
│       └── hooks/
│           ├── useTheme.ts
│           └── useStats.ts             # 统一拉取看板数据（含 loading/error）
├── tracker/
│   ├── tracker.js                  # 埋点 SDK（源码即发布物）
│   └── README.md
└── README.md                       # 一键启动总览
```

## 4. 数据模型

### users

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| email | str unique | 登录名，统一小写 |
| password_hash | str | bcrypt |
| created_at | datetime | UTC |

### sites

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| user_id | int FK→users.id (索引) | 归属，级联删除 |
| name | str | 站点名称 |
| domain | str | 展示用域名 |
| public_key | str unique | `pk_live_` + 32 位随机 hex |
| created_at | datetime | UTC |

### visits（埋点事件表，宽表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| site_id | int FK→sites.id (索引) | |
| event | str | `pageview` / `pulse` |
| visitor_id | str (索引) | 客户端持久 UUID |
| session_id | str (索引) | 会话 UUID |
| path | str | 服务端从 url 解析的路径 |
| url | str | 完整 URL（截断 2048） |
| title | str | 页面标题（截断 256） |
| referrer | str | 完整 referrer（截断 2048） |
| referrer_host | str | 解析出的 host |
| channel | str | 渠道分类：direct/search/social/referral/internal/campaign |
| utm_source / utm_medium / utm_campaign | str? | 可空 |
| browser / os / device_type | str | UA 解析结果 |
| screen_w / screen_h | int | 客户端上报 |
| lang / tz | str | 语言 / 时区 |
| ip_hash | str | `sha256(ip + 每日盐)`，不存原始 IP |
| client_ts | datetime? | 客户端时间（参考） |
| ts | datetime | **服务端落库时间（统计基准）** |

索引：`(site_id, ts)`、`(site_id, event, ts)`、`(site_id, visitor_id, ts)`、`(site_id, session_id)`。

## 5. API 契约

Base：`/api`；鉴权头：`Authorization: Bearer <token>`。

### 账号 `routers/auth.py`

| 方法 | 路径 | 鉴权 | 请求 | 响应 |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | 否 | `{email, password}` | `{token, user}` (201) |
| POST | `/auth/login` | 否 | `{email, password}` | `{token, user}` |
| GET | `/auth/me` | 是 | — | `{id, email, created_at}` |

约束：email 唯一（重复 409）；密码 ≥ 8 位；错误统一 `{detail}`。

### 站点 `routers/sites.py`

| 方法 | 路径 | 请求 | 响应 |
| --- | --- | --- | --- |
| GET | `/sites` | — | `[{id, name, domain, public_key, created_at}]` |
| POST | `/sites` | `{name, domain}` | 站点对象 (201) |
| GET | `/sites/{id}` | — | 站点对象 |
| DELETE | `/sites/{id}` | — | 204（级联删除 visits） |

非本人站点一律 404（不暴露存在性）。

### 采集 `routers/collect.py`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/collect` | 否（校验公钥） | CORS `*`，读取原始 body 解析 JSON，成功 204 |
| GET | `/tracker.js` | 否 | 返回 SDK 文件，`Cache-Control: public, max-age=300` |

- 非法公钥、未知事件类型 → 静默 204（防探测，不报错）
- 单请求上限 4KB；`pulse` 与 `pageview` 同管道处理

### 统计 `routers/stats.py`（均需鉴权 + 站点归属校验）

`range` 取值：`today | 7d | 30d`（默认 `7d`）。

| 方法 | 路径 | 响应 |
| --- | --- | --- |
| GET | `/stats/{site_id}/overview?range=` | `{current:{pv,uv,sessions,bounce_rate,avg_duration}, previous:{同结构}}` |
| GET | `/stats/{site_id}/timeseries?range=` | `[{date, pv, uv, sessions}]`（范围全量日期，缺数补 0） |
| GET | `/stats/{site_id}/sources?range=` | `{channels:[{key,label,pv,uv,share}], referrers:[{host,pv,uv}]}` |
| GET | `/stats/{site_id}/devices?range=` | `{browser:[{key,pv,uv,share}], os:[...], device_type:[...], screen:[...]}` |
| GET | `/stats/{site_id}/pages?range=` | `[{path,pv,uv,avg_duration}]`（Top 20） |

## 6. 聚合实现要点（services/aggregate.py）

统一先构造 `[start, end)` 窗口（服务端时区按配置 `TZ_OFFSET`，默认 UTC+8），再查 `event='pageview'` 子集：

- 会话维表（子查询）：`SELECT session_id, COUNT(*) pv_count, MIN(ts) s, MAX(ts) e, MAX(visitor_id) vid FROM visits WHERE site_id=? AND event='pageview' AND ts∈窗口 GROUP BY session_id`
- PV = pageview 行数；UV = `COUNT(DISTINCT visitor_id)`；会话数 = 会话维表行数
- 跳出率 = `SUM(pv_count=1)/COUNT(*)`
- 平均时长 = `AVG(e − s)`（对会话维表）
- 环比：同 SQL 移动窗口到上一等长周期
- 时长统计额外带上该 session 的 `pulse` 事件 `MAX(ts)` 作为 `e`：`e = max(pageview_max_ts, pulse_max_ts)`，心跳让长停留页面时长更准
- 趋势：按日 `GROUP BY date(ts)`，Python 侧补齐缺失日期
- 来源 / 设备 / 页面：`GROUP BY` 对应维度，share 在前端按 pv 归一（后端只回原始数）

## 7. 埋点协议（tracker/tracker.js ↔ /api/collect）

### 初始化

```html
<script defer src="https://<平台地址>/tracker.js" data-site="pk_live_xxxx"></script>
```

可选属性：`data-endpoint`（自定上报地址）、`data-disabled`（禁用自动采集）。

### 请求

`POST {endpoint}/api/collect`，Body 为 JSON 字符串，Content-Type 显式设为 `text/plain;charset=UTF-8`（sendBeacon 跨域下避免预检）；服务端按原始 body 做 `json.loads`。

```json
{
  "k": "pk_live_xxx",
  "e": "pageview",
  "vid": "v_<uuid>",
  "sid": "s_<uuid>",
  "url": "https://a.com/post/1?utm_source=x",
  "title": "文章标题",
  "ref": "https://www.google.com/",
  "sw": 1440, "sh": 900,
  "lang": "zh-CN", "tz": "Asia/Shanghai",
  "ts": 1758900000000
}
```

### 客户端规则

| 项 | 规则 |
| --- | --- |
| VID | localStorage `gm_vid`；首次访问生成 `v_UUID` |
| SID | sessionStorage `gm_sid` + localStorage `gm_last_act`；距上次活动 > 30min 则新会话 |
| pageview 触发 | 脚本加载时 + `pushState/replaceState/popstate` 后（同 URL 去重） |
| pulse 触发 | 每 15s，仅 `document.visibilityState === 'visible'` 时发送 |
| 发送 | 单事件立即发；失败静默丢弃（SDK 绝不抛错，包裹 try/catch） |
| 隐私 | 无 Cookie、无指纹、不上报表单内容；IP 在服务端哈希后即弃 |

### 服务端处理（services/ingest.py + classify.py）

1. 校验 `k` → 站点；未知则 204 丢弃
2. 解析 `url` 得 `path`、query 中的 UTM
3. `referrer_host` 解析 + 渠道分类：

| 渠道 | 规则（优先级从高到低） |
| --- | --- |
| campaign | 存在 `utm_source/medium` |
| internal | referrer_host == 站点 domain |
| search | host 命中：google / bing / baidu / sogou / so.com / yahoo / duckduckgo / ecosia |
| social | host 命中：weibo / zhihu / douyin / x.com / twitter / facebook / reddit / qq / wechat / linkedin |
| direct | referrer 为空 |
| referral | 其余非空 referred |

4. UA → browser：WeChat / Edge / Opera / Chrome / Firefox / Safari / 其他（正则优先级匹配）
5. UA → os：Windows / iOS / Android / macOS / Linux / 其他
6. UA → device_type：tablet（iPad/Tablet）> mobile（Mobile/Android/iPhone）> desktop
7. `ip_hash = sha256(ip + ":" + YYYY-MM-DD)`（每日轮换盐，不可跨天关联）

## 8. 运行与部署

### 后端

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # 可选：改 JWT_SECRET / DATABASE_URL
uvicorn app.main:app --reload --port 8000
python -m app.services.seed        # 可选：灌入演示数据
```

环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./glassmeter.db` | MySQL 示例：`mysql+pymysql://user:pwd@127.0.0.1:3306/glassmeter?charset=utf8mb4`（需 `pip install pymysql`） |
| `JWT_SECRET` | dev 默认值 | 生产必须修改 |
| `CORS_ORIGINS` | `http://localhost:5173` | 逗号分隔；`/api/collect` 始终放开 `*` |
| `TRACKER_PATH` | `../tracker/tracker.js` | SDK 文件位置 |
| `TZ_OFFSET` | `8` | 统计用固定时区偏移 |
| `SERVE_FRONTEND` | `false` | 为 true 且 `frontend/dist` 存在时，后端托管前端构建产物（单容器部署） |

### 前端

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173，/api 与 /tracker.js 代理到 8000
npm run build
```

### 演示账号（seed 后）

`demo@glassmeter.local` / `demo1234`，含演示站点 + 近 30 天数据。

## 9. 里程碑与任务拆解

| 里程碑 | 内容 | 产出目录 |
| --- | --- | --- |
| M0 文档评审 | PRD / 架构 / 设计三份文档 | `docs/` |
| M1 后端 | 模型、鉴权、站点、采集、聚合、seed、冒烟测试 | `backend/`、`tracker/` |
| M2 前端基建 | Vite+Tailwind+主题 token、玻璃设计系统、ui 基础组件、图表组件、布局 | `frontend/src/{styles,components,lib,api}` |
| M3 页面 | 登录/注册、站点列表、看板五面板 + 代码片段、主题切换 | `frontend/src/features/` |
| M4 联调验收 | seed 渲染、真实埋点自测（本地测试页）、响应式与降级核对、README | 全仓 |

## 10. 扩展点（不在本期实现，仅预留）

- 写入量大时：`visits` 按月分区（MySQL）/ 引入 Rollup 日聚合表；采集侧改异步队列
- 统计口径扩展：`stats.py` 单文件加维度；前端 `charts/` 组件可复用
- 实时能力：SSE 推送最近事件（后端加 `/api/stats/{id}/stream`）