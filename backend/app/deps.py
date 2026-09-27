"""依赖注入：数据库会话、当前用户、站点归属校验。"""

from __future__ import annotations

from fastapi import Depends, HTTPException, Path, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Site, User
from .security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录或凭证缺失",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已失效，请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号不存在")
    return user


def get_owned_site(
    site_id: int = Path(ge=1),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Site:
    """站点必须属于当前用户，否则一律 404（不暴露存在性）。"""
    site = db.get(Site, site_id)
    if site is None or site.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="站点不存在")
    return site