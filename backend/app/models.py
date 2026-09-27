"""数据模型：User / Site / Visit。"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    sites: Mapped[list["Site"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    public_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    owner: Mapped[User] = relationship(back_populates="sites")
    visits: Mapped[list["Visit"]] = relationship(
        back_populates="site", cascade="all, delete-orphan", passive_deletes=True
    )


class Visit(Base):
    """埋点事件宽表（pageview / pulse）。"""

    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    site_id: Mapped[int] = mapped_column(
        ForeignKey("sites.id", ondelete="CASCADE"), nullable=False
    )
    event: Mapped[str] = mapped_column(String(16), nullable=False)
    visitor_id: Mapped[str] = mapped_column(String(64), nullable=False)
    session_id: Mapped[str] = mapped_column(String(64), nullable=False)

    path: Mapped[str] = mapped_column(String(512), nullable=False, default="/")
    url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    title: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    referrer: Mapped[str] = mapped_column(Text, nullable=False, default="")
    referrer_host: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    channel: Mapped[str] = mapped_column(String(24), nullable=False, default="direct")
    utm_source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(120), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(120), nullable=True)

    browser: Mapped[str] = mapped_column(String(32), nullable=False, default="其他")
    os: Mapped[str] = mapped_column(String(32), nullable=False, default="其他")
    device_type: Mapped[str] = mapped_column(String(16), nullable=False, default="desktop")
    screen_w: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    screen_h: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lang: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    tz: Mapped[str] = mapped_column(String(64), nullable=False, default="")

    ip_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    client_ts: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    site: Mapped[Site] = relationship(back_populates="visits")

    __table_args__ = (
        Index("ix_visits_site_ts", "site_id", "ts"),
        Index("ix_visits_site_event_ts", "site_id", "event", "ts"),
        Index("ix_visits_site_visitor_ts", "site_id", "visitor_id", "ts"),
        Index("ix_visits_site_session", "site_id", "session_id"),
    )