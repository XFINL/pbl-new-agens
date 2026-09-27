"""归类逻辑：来源渠道分类、UA 解析、屏幕分桶、IP 哈希（纯函数，便于测试）。"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlsplit

# 渠道 key → 展示名（前端也按此顺序展示）
CHANNEL_LABELS: dict[str, str] = {
    "direct": "直接访问",
    "search": "搜索引擎",
    "social": "社交媒体",
    "referral": "外链引荐",
    "internal": "站内跳转",
    "campaign": "营销活动",
}

# 命中即归类（子串匹配，已做小写化）
_SEARCH_HOSTS = (
    "google.", "bing.", "baidu.", "sogou.", "so.com", "sm.cn", "yahoo.",
    "duckduckgo.", "ecosia.", "yandex.", "naver.", "quark.",
)
_SOCIAL_HOSTS = (
    "weibo.", "zhihu.", "douyin.", "tiktok.", "x.com", "twitter.", "t.co",
    "facebook.", "fb.com", "reddit.", "qq.com", "wechat.", "weixin.",
    "linkedin.", "bilibili.", "xiaohongshu.", "wechat.com",
)

DEVICE_LABELS = {"desktop": "桌面", "mobile": "手机", "tablet": "平板"}


def normalize_host(host: str) -> str:
    host = (host or "").strip().lower().rstrip(".")
    if host.startswith("www."):
        host = host[4:]
    return host


def parse_host(url: str) -> str:
    """从 URL 中解析归一化 host；失败返回空串。"""
    if not url:
        return ""
    try:
        return normalize_host(urlsplit(url).hostname or "")
    except ValueError:
        return ""


def parse_path(url: str) -> str:
    """从 URL 中解析路径；空路径归为 /。"""
    if not url:
        return "/"
    try:
        path = urlsplit(url).path or "/"
    except ValueError:
        return "/"
    return path[:512]


def parse_utm(url: str) -> dict[str, str | None]:
    """解析 URL query 中的 UTM 参数。"""
    result: dict[str, str | None] = {
        "utm_source": None,
        "utm_medium": None,
        "utm_campaign": None,
    }
    if not url or "?" not in url:
        return result
    try:
        query = parse_qs(urlsplit(url).query)
    except ValueError:
        return result
    for key in ("utm_source", "utm_medium", "utm_campaign"):
        values = query.get(key)
        if values and values[0].strip():
            result[key] = values[0].strip()[:120]
    return result


def classify_channel(
    referrer: str,
    referrer_host: str,
    site_domain: str,
    utm_source: str | None,
    utm_medium: str | None,
) -> str:
    """来源渠道分类，优先级：campaign > internal > search > social > direct > referral。"""
    if utm_source or utm_medium:
        return "campaign"
    if not referrer or not referrer_host:
        return "direct"
    domain = normalize_host(site_domain)
    if domain and (referrer_host == domain or referrer_host.endswith("." + domain)):
        return "internal"
    if any(marker in referrer_host for marker in _SEARCH_HOSTS):
        return "search"
    if any(marker in referrer_host for marker in _SOCIAL_HOSTS):
        return "social"
    return "referral"


def parse_browser(ua: str) -> str:
    ua = ua or ""
    if "MicroMessenger" in ua:
        return "微信"
    if "Edg" in ua or "Edge" in ua:
        return "Edge"
    if "OPR" in ua or "Opera" in ua:
        return "Opera"
    if "UCBrowser" in ua:
        return "UC"
    if "Firefox" in ua:
        return "Firefox"
    if "Chrome" in ua or "CriOS" in ua:
        return "Chrome"
    if "Safari" in ua:
        return "Safari"
    return "其他"


def parse_os(ua: str) -> str:
    ua = ua or ""
    if "iPhone" in ua or "iPad" in ua or "iPod" in ua:
        return "iOS"
    if "Android" in ua:
        return "Android"
    if "Windows" in ua:
        return "Windows"
    if "Mac OS X" in ua or "Macintosh" in ua:
        return "macOS"
    if "Linux" in ua:
        return "Linux"
    return "其他"


def parse_device_type(ua: str) -> str:
    ua = ua or ""
    if "iPad" in ua or "Tablet" in ua:
        return DEVICE_LABELS["tablet"]
    if "Mobile" in ua or "Android" in ua or "iPhone" in ua:
        return DEVICE_LABELS["mobile"]
    return DEVICE_LABELS["desktop"]


def screen_bucket(width: int) -> str:
    if width <= 0:
        return "未知"
    if width < 576:
        return "< 576"
    if width < 992:
        return "576 – 992"
    if width <= 1440:
        return "992 – 1440"
    return "> 1440"


def hash_ip(ip: str) -> str:
    """IP 隐私化：sha256(ip + 当日盐)，不可跨天关联。"""
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not ip:
        ip = "unknown"
    return hashlib.sha256(f"{ip}:{day}".encode()).hexdigest()[:32]