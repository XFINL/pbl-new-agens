"""看板聚合：时间窗口解析 + 指标 / 趋势 / 来源 / 设备 / 页面 查询。

实现取向：会话级计算放在 Python（会话数量小、口径统一且跨 SQLite/MySQL 一致），
仅分组与去重下推 SQL。
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import case, distinct, func, select, text
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Visit
from .classify import CHANNEL_LABELS

RANGE_KEYS = ("today", "7d", "30d")
RANGE_DAYS = {"today": 1, "7d": 7, "30d": 30}


@dataclass
class Window:
    range_key: str
    start: datetime  # naive UTC，含
    end: datetime  # naive UTC，不含
    prev_start: datetime
    prev_end: datetime
    days: int
    dates: list[str]  # 本地日期字符串（趋势补齐用）


def resolve_window(range_key: str) -> Window:
    """按固定时区偏移构造 [今日-（days-1）, 明日) 窗口，并给出上一等长周期。"""
    if range_key not in RANGE_KEYS:
        range_key = "7d"
    days = RANGE_DAYS[range_key]
    offset = timedelta(hours=settings.tz_offset)
    now_local = datetime.now(timezone.utc).replace(tzinfo=None) + offset
    today_start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    start_local = today_start_local - timedelta(days=days - 1)
    end_local = today_start_local + timedelta(days=1)

    start = start_local - offset
    end = end_local - offset
    return Window(
        range_key=range_key,
        start=start,
        end=end,
        prev_start=start - timedelta(days=days),
        prev_end=start,
        days=days,
        dates=[(start_local + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)],
    )


def _local_date_expr(db: Session):
    """按配置时区偏移生成本地日期表达式（SQLite / MySQL 两种方言）。"""
    offset = settings.tz_offset
    dialect = db.get_bind().dialect.name
    if dialect == "sqlite":
        return func.date(Visit.ts, f"{offset:+d} hours")
    return func.date(func.date_add(Visit.ts, text(f"INTERVAL {offset} HOUR")))


def _session_rows(db: Session, site_id: int, start: datetime, end: datetime) -> list:
    """会话维表：会话 id / 访客 / pageview 数 / 首末事件时刻（含 pulse，时长更准）。"""
    stmt = (
        select(
            Visit.session_id,
            func.max(Visit.visitor_id),
            func.sum(case((Visit.event == "pageview", 1), else_=0)),
            func.min(Visit.ts),
            func.max(Visit.ts),
        )
        .where(Visit.site_id == site_id, Visit.ts >= start, Visit.ts < end)
        .group_by(Visit.session_id)
    )
    return [row for row in db.execute(stmt).all() if (row[2] or 0) > 0]


def _metrics_from_sessions(rows: list) -> dict:
    sessions = len(rows)
    pv = int(sum(int(row[2] or 0) for row in rows))
    uv = len({row[1] for row in rows})
    if sessions == 0:
        return {"pv": 0, "uv": 0, "sessions": 0, "bounce_rate": 0.0, "avg_duration": 0.0}
    bounced = sum(1 for row in rows if int(row[2] or 0) == 1)
    durations = [
        max(0.0, (row[4] - row[3]).total_seconds()) for row in rows if row[4] and row[3]
    ]
    avg_duration = sum(durations) / len(durations) if durations else 0.0
    return {
        "pv": pv,
        "uv": uv,
        "sessions": sessions,
        "bounce_rate": round(bounced / sessions * 100, 1),
        "avg_duration": round(avg_duration, 1),
    }


def overview(db: Session, site_id: int, win: Window) -> dict:
    current = _metrics_from_sessions(_session_rows(db, site_id, win.start, win.end))
    previous = _metrics_from_sessions(
        _session_rows(db, site_id, win.prev_start, win.prev_end)
    )
    return {"current": current, "previous": previous}


def timeseries(db: Session, site_id: int, win: Window) -> list[dict]:
    date_expr = _local_date_expr(db)
    stmt = (
        select(
            date_expr.label("day"),
            func.count().label("pv"),
            func.count(distinct(Visit.visitor_id)).label("uv"),
            func.count(distinct(Visit.session_id)).label("sessions"),
        )
        .where(
            Visit.site_id == site_id,
            Visit.event == "pageview",
            Visit.ts >= win.start,
            Visit.ts < win.end,
        )
        .group_by("day")
    )
    bucket = {
        str(row[0]): {"pv": int(row[1]), "uv": int(row[2]), "sessions": int(row[3])}
        for row in db.execute(stmt).all()
        if row[0] is not None
    }
    return [
        {
            "date": day,
            "pv": bucket.get(day, {}).get("pv", 0),
            "uv": bucket.get(day, {}).get("uv", 0),
            "sessions": bucket.get(day, {}).get("sessions", 0),
        }
        for day in win.dates
    ]


def _dimension(db: Session, site_id: int, win: Window, column, order_by=None, limit: int | None = None):
    pv_count = func.count().label("pv")
    uv_count = func.count(distinct(Visit.visitor_id)).label("uv")
    stmt = (
        select(column.label("key"), pv_count, uv_count)
        .where(
            Visit.site_id == site_id,
            Visit.event == "pageview",
            Visit.ts >= win.start,
            Visit.ts < win.end,
        )
        .group_by(column)
        .order_by(order_by if order_by is not None else pv_count.desc())
    )
    if limit:
        stmt = stmt.limit(limit)
    return [
        {"key": str(row[0]) if row[0] is not None else "未知", "pv": int(row[1]), "uv": int(row[2])}
        for row in db.execute(stmt).all()
    ]


def sources(db: Session, site_id: int, win: Window) -> dict:
    channel_rows = _dimension(db, site_id, win, Visit.channel)
    # 按固定顺序输出，仅保留有数据的渠道
    channels = []
    for key, label in CHANNEL_LABELS.items():
        found = next((row for row in channel_rows if row["key"] == key), None)
        if found:
            channels.append({"key": key, "label": label, **{k: found[k] for k in ("pv", "uv")}})
    referrers = _dimension(
        db,
        site_id,
        win,
        Visit.referrer_host,
        limit=10,
    )
    referrers = [
        {"key": row["key"], "label": row["key"], "pv": row["pv"], "uv": row["uv"]}
        for row in referrers
        if row["key"]
    ]
    return {"channels": channels, "referrers": referrers}


def devices(db: Session, site_id: int, win: Window) -> dict:
    bucket_expr = case(
        (Visit.screen_w <= 0, "未知"),
        (Visit.screen_w < 576, "< 576"),
        (Visit.screen_w < 992, "576 – 992"),
        (Visit.screen_w <= 1440, "992 – 1440"),
        else_="> 1440",
    )
    bucket_order = case(
        (Visit.screen_w <= 0, 0),
        (Visit.screen_w < 576, 1),
        (Visit.screen_w < 992, 2),
        (Visit.screen_w <= 1440, 3),
        else_=4,
    )
    return {
        "browser": _dimension(db, site_id, win, Visit.browser),
        "os": _dimension(db, site_id, win, Visit.os),
        "device_type": _dimension(db, site_id, win, Visit.device_type),
        "screen": _dimension(
            db, site_id, win, bucket_expr, order_by=func.min(bucket_order)
        ),
    }


def pages(db: Session, site_id: int, win: Window, limit: int = 20) -> list[dict]:
    pv_count = func.count().label("pv")
    stmt = (
        select(Visit.path.label("path"), pv_count, func.count(distinct(Visit.visitor_id)).label("uv"))
        .where(
            Visit.site_id == site_id,
            Visit.event == "pageview",
            Visit.ts >= win.start,
            Visit.ts < win.end,
        )
        .group_by(Visit.path)
        .order_by(pv_count.desc())
        .limit(limit)
    )
    page_rows = [
        {"path": str(row[0] or "/"), "pv": int(row[1]), "uv": int(row[2])}
        for row in db.execute(stmt).all()
    ]

    # 平均停留：按会话时长近似（命中该路径的会话的平均时长）
    durations = {
        row[0]: max(0.0, (row[4] - row[3]).total_seconds())
        for row in _session_rows(db, site_id, win.start, win.end)
    }
    pair_stmt = select(Visit.session_id, Visit.path).where(
        Visit.site_id == site_id,
        Visit.event == "pageview",
        Visit.ts >= win.start,
        Visit.ts < win.end,
    ).distinct()
    sums: dict[str, list[float]] = {}
    for session_id, path in db.execute(pair_stmt).all():
        duration = durations.get(session_id)
        if duration is None:
            continue
        sums.setdefault(str(path or "/"), []).append(duration)

    for row in page_rows:
        values = sums.get(row["path"], [])
        row["avg_duration"] = round(sum(values) / len(values), 1) if values else 0.0
    return page_rows


__all__ = [
    "Window",
    "RANGE_KEYS",
    "resolve_window",
    "overview",
    "timeseries",
    "sources",
    "devices",
    "pages",
]