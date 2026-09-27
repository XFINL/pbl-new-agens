"""应用配置：环境变量读取（无需额外依赖，自动加载 backend/.env）。"""

from __future__ import annotations

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = BACKEND_DIR.parent


def _load_dotenv() -> None:
    """"极简 .env 加载：KEY=VALUE，忽略注释与空行；已存在的环境变量优先。"""
    env_file = BACKEND_DIR / ".env"
    if not env_file.exists():
        return
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()


def _env(name: str, default: str) -> str:
    return os.environ.get(name, default)


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)))
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_csv(name: str, default: str) -> list[str]:
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    """运行期配置（进程启动时读取一次）。"""

    def __init__(self) -> None:
        self.database_url: str = _env("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'glassmeter.db'}")
        self.jwt_secret: str = _env("JWT_SECRET", "glassmeter-dev-secret")
        self.jwt_algorithm: str = "HS256"
        self.jwt_expire_days: int = _env_int("JWT_EXPIRE_DAYS", 14)
        self.cors_origins: list[str] = _env_csv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        )
        tracker_path = Path(_env("TRACKER_PATH", str(REPO_DIR / "tracker" / "tracker.js")))
        if not tracker_path.is_absolute():
            tracker_path = (BACKEND_DIR / tracker_path).resolve()
        self.tracker_path: Path = tracker_path
        self.tz_offset: int = _env_int("TZ_OFFSET", 8)
        self.serve_frontend: bool = _env_bool("SERVE_FRONTEND", False)
        self.frontend_dist: Path = REPO_DIR / "frontend" / "dist"
        self.max_collect_bytes: int = _env_int("MAX_COLLECT_BYTES", 4096)


settings = Settings()