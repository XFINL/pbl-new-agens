"""统计路由：看板聚合查询（鉴权 + 站点归属校验）。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_owned_site
from ..models import Site
from ..schemas import (
    DevicesResponse,
    OverviewResponse,
    PageItem,
    SourcesResponse,
    TimeseriesPoint,
)
from ..services import aggregate

router = APIRouter(prefix="/stats", tags=["stats"])

RangeQuery = Query(
    "7d", alias="range", pattern="^(today|7d|30d)$", description="today | 7d | 30d"
)


@router.get("/{site_id}/overview", response_model=OverviewResponse)
def overview(
    range_key: str = RangeQuery,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
) -> OverviewResponse:
    return OverviewResponse.model_validate(
        aggregate.overview(db, site.id, aggregate.resolve_window(range_key))
    )


@router.get("/{site_id}/timeseries", response_model=list[TimeseriesPoint])
def timeseries(
    range_key: str = RangeQuery,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
) -> list[TimeseriesPoint]:
    return [
        TimeseriesPoint.model_validate(row)
        for row in aggregate.timeseries(db, site.id, aggregate.resolve_window(range_key))
    ]


@router.get("/{site_id}/sources", response_model=SourcesResponse)
def sources(
    range_key: str = RangeQuery,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
) -> SourcesResponse:
    return SourcesResponse.model_validate(
        aggregate.sources(db, site.id, aggregate.resolve_window(range_key))
    )


@router.get("/{site_id}/devices", response_model=DevicesResponse)
def devices(
    range_key: str = RangeQuery,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
) -> DevicesResponse:
    return DevicesResponse.model_validate(
        aggregate.devices(db, site.id, aggregate.resolve_window(range_key))
    )


@router.get("/{site_id}/pages", response_model=list[PageItem])
def pages(
    range_key: str = RangeQuery,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
) -> list[PageItem]:
    return [
        PageItem.model_validate(row)
        for row in aggregate.pages(db, site.id, aggregate.resolve_window(range_key))
    ]