"""采集路由：POST /api/collect（公开，跨域放开，静默处理非法请求）。"""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Request, Response
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..schemas import CollectPayload
from ..services import ingest

router = APIRouter(tags=["collect"])


@router.post("/collect", status_code=204)
async def collect(request: Request, db: Session = Depends(get_db)) -> Response:
    """接收埋点事件。

    约定：无论成功与否一律 204（防探测），丢弃原因只落服务端日志。
    """
    body = await request.body()
    if not body or len(body) > settings.max_collect_bytes:
        return Response(status_code=204)
    try:
        data = json.loads(body)
        if not isinstance(data, dict):
            return Response(status_code=204)
        payload = CollectPayload.model_validate(data)
    except (json.JSONDecodeError, ValidationError, UnicodeDecodeError):
        return Response(status_code=204)

    ua = request.headers.get("user-agent", "")
    ip = request.client.host if request.client else ""
    ingest.record_event(db, payload, ua=ua, ip=ip)
    return Response(status_code=204)