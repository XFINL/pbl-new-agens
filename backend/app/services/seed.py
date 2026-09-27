"""演示数据生成：demo 账号 + 演示站点 + 近 N 天模拟访问。

用法：
    python -m app.services.seed                # 默认 30 天，重建演示账号
    python -m app.services.seed --days 14
    python -m app.services.seed --keep         # 已存在则跳过
"""

from __future__ import annotations

import argparse
import random
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, insert, select

from ..config import settings
from ..database import Base, SessionLocal, engine
from ..models import Site, User, Visit
from ..security import hash_password

DEMO_EMAIL = "demo@glassmeter.local"
DEMO_PASSWORD = "demo1234"
DEMO_SITE_NAME = "演示站点 · 博客"
DEMO_DOMAIN = "blog.demo.local"

# (路径, 权重)
PAGES: list[tuple[str, int]] = [
    ("/", 30),
    ("/posts/glassmorphism-in-practice", 18),
    ("/posts/tracker-design-notes", 14),
    ("/posts/monochrome-dashboard", 12),
    ("/archive", 10),
    ("/about", 8),
    ("/tags/design", 8),
    ("/posts/hello-analytics", 6),
]

# (渠道, 权重)
CHANNELS: list[tuple[str, int]] = [
    ("direct", 40),
    ("search", 24),
    ("social", 15),
    ("referral", 12),
    ("internal", 5),
    ("campaign", 4),
]

SEARCH_HOSTS = ["www.google.com", "www.baidu.com", "cn.bing.com", "www.sogou.com"]
SOCIAL_HOSTS = ["www.zhihu.com", "weibo.com", "www.douyin.com", "x.com", "www.bilibili.com"]
REFERRAL_HOSTS = [
    "news.ycombinator.com",
    "www.ruanyifeng.com",
    "juejin.cn",
    "blog.csdn.net",
    "github.com",
]
CAMPAIGN_SOURCES = ["newsletter", "wechat_article", "producthunt"]

# (设备类型, 系统, 浏览器, 宽, 高, 权重)
DEVICE_PROFILES: list[tuple[str, str, str, int, int, int]] = [
    ("桌面", "Windows", "Chrome", 1920, 1080, 30),
    ("桌面", "Windows", "Edge", 1536, 864, 12),
    ("桌面", "macOS", "Chrome", 2560, 1440, 12),
    ("桌面", "macOS", "Safari", 1440, 900, 10),
    ("桌面", "Windows", "Firefox", 1366, 768, 6),
    ("桌面", "Linux", "Chrome", 1600, 900, 4),
    ("手机", "iOS", "Safari", 390, 844, 12),
    ("手机", "Android", "Chrome", 412, 915, 8),
    ("手机", "Android", "微信", 393, 852, 4),
    ("平板", "iOS", "Safari", 820, 1180, 2),
]

UA_TEMPLATES = {
    ("桌面", "Windows", "Chrome"): "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    ("桌面", "Windows", "Edge"): "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
    ("桌面", "macOS", "Chrome"): "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    ("桌面", "macOS", "Safari"): "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    ("桌面", "Windows", "Firefox"): "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    ("桌面", "Linux", "Chrome"): "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    ("手机", "iOS", "Safari"): "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    ("手机", "Android", "Chrome"): "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
    ("手机", "Android", "微信"): "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.49",
    ("平板", "iOS", "Safari"): "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
}


def _weighted(rng: random.Random, items: list[tuple], index: int = -1):
    weights = [item[-1] for item in items]
    return rng.choices(items, weights=weights, k=1)[0]


def _pick_referrer(rng: random.Random, channel: str) -> tuple[str, str, str | None, str | None]:
    """返回 (referrer 完整 URL, referrer_host, utm_source, utm_medium)。"""
    if channel == "direct":
        return "", "", None, None
    if channel == "search":
        host = rng.choice(SEARCH_HOSTS)
        keyword = rng.choice(["玻璃拟态", "网站统计", "前端埋点", "analytics"])
        return f"https://{host}/s?q={keyword}", host, None, None
    if channel == "social":
        host = rng.choice(SOCIAL_HOSTS)
        return f"https://{host}/p/123456", host, None, None
    if channel == "referral":
        host = rng.choice(REFERRAL_HOSTS)
        return f"https://{host}/item?id=42", host, None, None
    if channel == "internal":
        return f"https://{DEMO_DOMAIN}/archive", DEMO_DOMAIN, None, None
    source = rng.choice(CAMPAIGN_SOURCES)
    medium = {"newsletter": "email", "wechat_article": "social", "producthunt": "referral"}[source]
    return "", "", source, medium


def _generate_rows(site_id: int, days: int, rng: random.Random) -> list[dict]:
    now_local = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
        hours=settings.tz_offset
    )
    today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    offset = timedelta(hours=settings.tz_offset)

    visitor_pool = [f"v_{uuid.uuid4().hex[:24]}" for _ in range(140)]
    rows: list[dict] = []

    for day_index in range(days - 1, -1, -1):
        day_start = today_start - timedelta(days=day_index)
        weekday = day_start.weekday()
        # 工作日高、周末低 + 轻微增长趋势 + 噪声
        day_factor = 1.0 if weekday < 5 else 0.62
        growth = 1.0 + (days - 1 - day_index) / max(days, 1) * 0.35
        noise = rng.uniform(0.82, 1.18)
        session_count = max(8, int(120 * day_factor * growth * noise))

        # 今日只生成到当前时间之前的会话
        day_cut = now_local - timedelta(minutes=10) if day_index == 0 else day_start + timedelta(days=1)

        for _ in range(session_count):
            device, os_name, browser, width, height, _w = _weighted(rng, DEVICE_PROFILES)
            channel, _cw = _weighted(rng, CHANNELS)
            referrer, ref_host, utm_source, utm_medium = _pick_referrer(rng, channel)

            if rng.random() < 0.55:
                visitor_id = rng.choice(visitor_pool)
            else:
                visitor_id = f"v_{uuid.uuid4().hex[:24]}"
                if len(visitor_pool) < 400:
                    visitor_pool.append(visitor_id)
            session_id = f"s_{uuid.uuid4().hex[:24]}"

            start_minute = rng.randint(7 * 60, 23 * 60)
            ts_local = day_start + timedelta(minutes=start_minute, seconds=rng.randint(0, 59))
            if ts_local >= day_cut:
                ts_local = day_cut - timedelta(minutes=rng.randint(2, 40))

            page_count = 1
            while page_count < 7 and rng.random() < 0.42:
                page_count += 1

            path = _weighted(rng, PAGES, index=0)[0]
            for page_index in range(page_count):
                url = f"https://{DEMO_DOMAIN}{path}"
                if utm_source and page_index == 0:
                    url += f"?utm_source={utm_source}&utm_medium={utm_medium}"
                rows.append(
                    {
                        "site_id": site_id,
                        "event": "pageview",
                        "visitor_id": visitor_id,
                        "session_id": session_id,
                        "path": path[:512],
                        "url": url[:2048],
                        "title": f"演示页面 {path}"[:256],
                        "referrer": referrer[:2048],
                        "referrer_host": ref_host[:255],
                        "channel": channel,
                        "utm_source": utm_source,
                        "utm_medium": utm_medium,
                        "utm_campaign": None,
                        "browser": browser,
                        "os": os_name,
                        "device_type": device,
                        "screen_w": width,
                        "screen_h": height,
                        "lang": rng.choice(["zh-CN", "zh-CN", "en-US"]),
                        "tz": "Asia/Shanghai",
                        "ip_hash": secrets.token_hex(16),
                        "client_ts": ts_local - offset,
                        "ts": ts_local - offset,
                    }
                )
                # 页面停留期间的心跳（每 ~30s 一条，最多 3 条）
                dwell = rng.randint(20, 210)
                for pulse_index in range(min(3, dwell // 30)):
                    pulse_local = ts_local + timedelta(seconds=(pulse_index + 1) * 30)
                    if pulse_local >= day_cut:
                        break
                    rows.append(
                        {
                            "site_id": site_id,
                            "event": "pulse",
                            "visitor_id": visitor_id,
                            "session_id": session_id,
                            "path": path[:512],
                            "url": url[:2048],
                            "title": "",
                            "referrer": "",
                            "referrer_host": "",
                            "channel": channel,
                            "utm_source": None,
                            "utm_medium": None,
                            "utm_campaign": None,
                            "browser": browser,
                            "os": os_name,
                            "device_type": device,
                            "screen_w": width,
                            "screen_h": height,
                            "lang": "zh-CN",
                            "tz": "Asia/Shanghai",
                            "ip_hash": secrets.token_hex(16),
                            "client_ts": pulse_local - offset,
                            "ts": pulse_local - offset,
                        }
                    )
                # 下一个页面：路径切换，间隔 20–180 秒
                path = _weighted(rng, PAGES, index=0)[0]
                ts_local = ts_local + timedelta(seconds=dwell)
                if ts_local >= day_cut:
                    break

    return rows


def seed(days: int = 30, keep: bool = False) -> None:
    Base.metadata.create_all(engine)
    rng = random.Random(20260927)

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
        if user is not None:
            if keep:
                print(f"演示账号已存在（{DEMO_EMAIL}），跳过。")
                return
            site_ids = select(Site.id).where(Site.user_id == user.id)
            db.execute(delete(Visit).where(Visit.site_id.in_(site_ids)))
            db.execute(delete(Site).where(Site.user_id == user.id))
            db.delete(user)
            db.commit()

        user = User(email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD))
        db.add(user)
        db.commit()

        site = Site(
            user_id=user.id,
            name=DEMO_SITE_NAME,
            domain=DEMO_DOMAIN,
            public_key="pk_live_" + secrets.token_hex(16),
        )
        db.add(site)
        db.commit()

        rows = _generate_rows(site.id, days, rng)
        chunk_size = 1000
        for index in range(0, len(rows), chunk_size):
            db.execute(insert(Visit), rows[index : index + chunk_size])
        db.commit()

        pageviews = sum(1 for row in rows if row["event"] == "pageview")

    print("演示数据已生成：")
    print(f"  账号：{DEMO_EMAIL}")
    print(f"  密码：{DEMO_PASSWORD}")
    print(f"  站点：{DEMO_SITE_NAME}（{DEMO_DOMAIN}）")
    print(f"  事件：{len(rows)} 条（其中 pageview {pageviews} 条，覆盖 {days} 天）")


def main() -> None:
    parser = argparse.ArgumentParser(description="生成演示数据")
    parser.add_argument("--days", type=int, default=30, help="生成天数（默认 30）")
    parser.add_argument("--keep", action="store_true", help="演示账号已存在时跳过重建")
    args = parser.parse_args()
    seed(days=max(1, min(args.days, 180)), keep=args.keep)


if __name__ == "__main__":
    main()