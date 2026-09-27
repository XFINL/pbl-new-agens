"""采集落库：校验公钥、清洗字段、补全来源渠道 / UA / IP 哈希。"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Site, Visit, utcnow
from ..schemas import CollectPayload
from . import classify

ALLOWED_EVENTS = {"pageview", "pulse"}


def _client_ts_to_dt(raw_ms: int) -> datetime | None:
    """客户端毫秒时间戳 → naive UTC datetime（仅作参考字段）。"""
    if not raw_ms or raw_ms <= 0:
        return None
    try:
        return datetime.fromtimestamp(raw_ms / 1000, tz=timezone.utc).replace(tzinfo=None)
    except (OverflowError, OSError, ValueError):
        return None


def record_event(db: Session, payload: CollectPayload, ua: str, ip: str) -> bool:
    """写入一条埋点事件；公钥无效或事件非法时返回 False（调用方静默 204）。"""
    if payload.e not in ALLOWED_EVENTS:
        return False
    if not payload.k or not payload.vid or not payload.sid:
        return False

    site = db.scalar(select(Site).where(Site.public_key == payload.k))
    if site is None:
        return False

    url = (payload.url or "")[:2048]
    referrer = (payload.ref or "")[:2048]
    referrer_host = classify.parse_host(referrer)
    utm = classify.parse_utm(url)

    visit = Visit(
        site_id=site.id,
        event=payload.e,
        visitor_id=payload.vid[:64],
        session_id=payload.sid[:64],
        path=classify.parse_path(url),
        url=url,
        title=(payload.title or "")[:256],
        referrer=referrer,
        referrer_host=referrer_host,
        channel=classify.classify_channel(
            referrer,
            referrer_host,
            site.domain,
            utm["utm_source"],
            utm["utm_medium"],
        ),
        utm_source=utm["utm_source"],
        utm_medium=utm["utm_medium"],
        utm_campaign=utm["utm_campaign"],
        browser=classify.parse_browser(ua),
        os=classify.parse_os(ua),
        device_type=classify.parse_device_type(ua),
        screen_w=max(0, min(payload.sw, 100000)),
        screen_h=max(0, min(payload.sh, 100000)),
        lang=(payload.lang or "")[:32],
        tz=(payload.tz or "")[:64],
        ip_hash=classify.hash_ip(ip),
        client_ts=_client_ts_to_dt(payload.ts),
        ts=utcnow(),
    )
    db.add(visit)
    db.commit()
    return True