"""Pydantic 请求 / 响应模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


# ---------- 账号 ----------


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def _lower_email(cls, value: str) -> str:
        return value.strip().lower()


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    token: str
    user: UserOut


# ---------- 站点 ----------


class SiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    domain: str = Field(min_length=1, max_length=255)

    @field_validator("name", "domain")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()


class SiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    domain: str
    public_key: str
    created_at: datetime


# ---------- 采集 ----------


class CollectPayload(BaseModel):
    """埋点上报载荷（短字段名，SDK 与后端契约见 docs/ARCHITECTURE.md 第 7 节）。"""

    k: str = ""
    e: str = "pageview"
    vid: str = ""
    sid: str = ""
    url: str = ""
    title: str = ""
    ref: str = ""
    sw: int = 0
    sh: int = 0
    lang: str = ""
    tz: str = ""
    ts: int = 0


# ---------- 统计 ----------


class Metrics(BaseModel):
    pv: int
    uv: int
    sessions: int
    bounce_rate: float
    avg_duration: float


class OverviewResponse(BaseModel):
    current: Metrics
    previous: Metrics


class TimeseriesPoint(BaseModel):
    date: str
    pv: int
    uv: int
    sessions: int


class DimensionItem(BaseModel):
    key: str
    pv: int
    uv: int
    label: str = ""


class SourcesResponse(BaseModel):
    channels: list[DimensionItem]
    referrers: list[DimensionItem]


class DevicesResponse(BaseModel):
    browser: list[DimensionItem]
    os: list[DimensionItem]
    device_type: list[DimensionItem]
    screen: list[DimensionItem]


class PageItem(BaseModel):
    path: str
    pv: int
    uv: int
    avg_duration: float