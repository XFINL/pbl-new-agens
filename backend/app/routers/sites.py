"""站点路由：列表 / 新建 / 详情 / 删除。"""

from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_owned_site
from ..models import Site, User
from ..schemas import SiteCreate, SiteOut

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("", response_model=list[SiteOut])
def list_sites(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[SiteOut]:
    sites = db.scalars(
        select(Site).where(Site.user_id == user.id).order_by(Site.created_at.desc(), Site.id.desc())
    ).all()
    return [SiteOut.model_validate(site) for site in sites]


@router.post("", response_model=SiteOut, status_code=status.HTTP_201_CREATED)
def create_site(
    payload: SiteCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SiteOut:
    site = Site(
        user_id=user.id,
        name=payload.name,
        domain=payload.domain,
        public_key="pk_live_" + secrets.token_hex(16),
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return SiteOut.model_validate(site)


@router.get("/{site_id}", response_model=SiteOut)
def get_site(site: Site = Depends(get_owned_site)) -> SiteOut:
    return SiteOut.model_validate(site)


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(site: Site = Depends(get_owned_site), db: Session = Depends(get_db)) -> Response:
    db.delete(site)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)