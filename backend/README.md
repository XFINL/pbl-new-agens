# 后端（FastAPI）

流量台后端：账号鉴权、站点管理、埋点采集、看板聚合，并托管埋点 SDK。

## 启动

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- OpenAPI 文档：<http://127.0.0.1:8000/docs>
- 演示数据：`python -m app.services.seed`（账号 `demo@glassmeter.local` / `demo1234`）
- 冒烟测试：`python -m pytest tests`

## 目录

```
app/
├── main.py          FastAPI 实例、CORS、路由挂载、GET /tracker.js
├── config.py        环境变量（DATABASE_URL / JWT_SECRET / CORS_ORIGINS / TRACKER_PATH / TZ_OFFSET / SERVE_FRONTEND）
├── database.py      engine / SessionLocal / Base（SQLite 开启 WAL 与 foreign_keys）
├── models.py        User / Site / Visit
├── schemas.py       Pydantic v2 请求与响应模型
├── security.py      bcrypt 哈希、JWT 签发与校验
├── deps.py          get_db / get_current_user / get_owned_site
├── routers/
│   ├── auth.py      POST /api/auth/register · POST /api/auth/login · GET /api/auth/me
│   ├── sites.py     GET|POST /api/sites · GET|DELETE /api/sites/{id}
│   ├── collect.py   POST /api/collect（公开，CORS 放开，校验站点公钥）
│   └── stats.py     GET /api/stats/{site_id}/{overview|timeseries|sources|devices|pages}?range=
└── services/
    ├── ingest.py    采集校验、清洗、落库
    ├── aggregate.py 指标 / 趋势 / 来源 / 设备 / 页面聚合
    ├── classify.py  渠道分类、UA 解析、屏幕分桶、IP 每日加盐哈希
    └── seed.py      演示账号 + 站点 + 30 天模拟数据
tests/test_smoke.py 注册 → 建站 → 上报 → 看板 全链路冒烟
```

## 口径要点

- 时间归属一律使用**服务端落库时间**（`visits.ts`），客户端时间仅作参考字段
- 窗口按 `TZ_OFFSET`（默认 UTC+8）对齐到自然日；`range` 取 `today | 7d | 30d`
- PV = `pageview` 行数；UV = 去重 `visitor_id`；跳出率 = 仅 1 次 pageview 的会话占比
- 会话时长以「该会话内 pageview 与 pulse 的最晚时刻 − 最早时刻」估算
- 隐私：不存原始 IP，落库 `sha256(ip + 每日盐)`；`/api/collect` 对非法公钥静默丢弃（204）