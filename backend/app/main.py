"""FastAPI 应用入口：CORS、路由挂载、SDK 托管、可选前端静态托管。"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine
from .routers import auth, collect, sites, stats

# 采集相关路径：跨域始终放开 *（SDK 会被嵌入任意站点）
OPEN_PATHS = {"/api/collect", "/tracker.js"}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(
    title="流量台 Glassmeter API",
    version="1.0.0",
    description="网站流量监测平台后端：账号 / 站点 / 埋点采集 / 数据聚合",
    lifespan=lifespan,
)


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    """统一 CORS：

    - /api/collect 与 /tracker.js：允许任意来源（*），支持追踪脚本跨站嵌入
    - 其余接口：仅允许配置的前端来源（鉴权使用 Bearer，不依赖 Cookie）
    """
    origin = request.headers.get("origin", "")
    if request.url.path in OPEN_PATHS:
        allow_origin: str | None = "*"
    elif origin and origin in settings.cors_origins:
        allow_origin = origin
    else:
        allow_origin = None

    if request.method == "OPTIONS" and "access-control-request-method" in request.headers:
        headers: dict[str, str] = {
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": request.headers.get(
                "access-control-request-headers", "*"
            )
            or "*",
            "Access-Control-Max-Age": "86400",
            "Vary": "Origin",
        }
        if allow_origin:
            headers["Access-Control-Allow-Origin"] = allow_origin
        return Response(status_code=204, headers=headers)

    response = await call_next(request)
    if allow_origin:
        response.headers["Access-Control-Allow-Origin"] = allow_origin
        response.headers["Vary"] = "Origin"
    return response


app.include_router(auth.router, prefix="/api")
app.include_router(sites.router, prefix="/api")
app.include_router(collect.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/tracker.js", include_in_schema=False)
def serve_tracker() -> Response:
    """托管埋点 SDK（唯一副本：tracker/tracker.js）。"""
    path: Path = settings.tracker_path
    if not path.is_file():
        return PlainTextResponse(
            "// tracker.js 未找到，请确认 TRACKER_PATH 配置", status_code=404
        )
    return FileResponse(
        path,
        media_type="application/javascript; charset=utf-8",
        headers={"Cache-Control": "public, max-age=300"},
    )


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)


# 可选：单容器部署时由后端托管前端构建产物
if settings.serve_frontend and settings.frontend_dist.is_dir():
    assets_dir = settings.frontend_dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str) -> Response:
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        candidate = settings.frontend_dist / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(settings.frontend_dist / "index.html")