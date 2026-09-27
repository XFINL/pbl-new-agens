"""冒烟测试：注册 → 建站 → 上报 → 看板聚合 → 鉴权边界。

运行：cd backend && pytest
"""

from __future__ import annotations

import json
import os
import tempfile

# 必须在导入 app 之前指向独立的临时数据库，避免污染开发库
_TMP_DIR = tempfile.mkdtemp(prefix="glassmeter-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR}/test.db"
os.environ["JWT_SECRET"] = "test-secret-0123456789abcdef0123456789abcdef"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

CHROME_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def _register(client: TestClient, email: str) -> dict[str, str]:
    response = client.post("/api/auth/register", json={"email": email, "password": "test1234"})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def _collect(client: TestClient, payload: dict) -> int:
    response = client.post(
        "/api/collect",
        content=json.dumps(payload),
        headers={"Content-Type": "text/plain;charset=UTF-8", "User-Agent": CHROME_UA},
    )
    return response.status_code


def test_full_flow(client: TestClient) -> None:
    headers = _register(client, "owner@test.local")

    # 建站
    response = client.post(
        "/api/sites", json={"name": "冒烟站点", "domain": "test.example.com"}, headers=headers
    )
    assert response.status_code == 201, response.text
    site = response.json()
    assert site["public_key"].startswith("pk_live_")

    # 上报：一次带 UTM 的浏览 + 心跳
    base_payload = {
        "k": site["public_key"],
        "e": "pageview",
        "vid": "v_testvisitor",
        "sid": "s_testsession",
        "url": "https://test.example.com/post/1?utm_source=newsletter&utm_medium=email",
        "title": "冒烟页面",
        "ref": "https://www.google.com/",
        "sw": 1440,
        "sh": 900,
        "lang": "zh-CN",
        "tz": "Asia/Shanghai",
        "ts": 1758900000000,
    }
    assert _collect(client, base_payload) == 204
    assert _collect(client, {**base_payload, "e": "pulse"}) == 204

    # 非法公钥 / 非法事件：静默 204
    assert _collect(client, {**base_payload, "k": "pk_live_invalid"}) == 204
    assert _collect(client, {**base_payload, "e": "unknown"}) == 204

    # 概览
    overview = client.get(f"/api/stats/{site['id']}/overview?range=7d", headers=headers)
    assert overview.status_code == 200, overview.text
    current = overview.json()["current"]
    assert current["pv"] == 1
    assert current["uv"] == 1
    assert current["sessions"] == 1
    assert current["bounce_rate"] == 100.0

    # 趋势：7 天补零
    series = client.get(f"/api/stats/{site['id']}/timeseries?range=7d", headers=headers)
    assert series.status_code == 200
    points = series.json()
    assert len(points) == 7
    assert sum(point["pv"] for point in points) == 1

    # 来源：UTM 优先归为营销活动
    sources = client.get(f"/api/stats/{site['id']}/sources?range=7d", headers=headers)
    assert sources.status_code == 200
    channels = sources.json()["channels"]
    assert [channel["key"] for channel in channels] == ["campaign"]

    # 设备：UA 解析
    devices = client.get(f"/api/stats/{site['id']}/devices?range=7d", headers=headers)
    assert devices.status_code == 200
    device_data = devices.json()
    assert device_data["browser"][0]["key"] == "Chrome"
    assert device_data["device_type"][0]["key"] == "桌面"
    assert device_data["screen"][0]["key"] == "992 – 1440"

    # 页面排行
    pages = client.get(f"/api/stats/{site['id']}/pages?range=7d", headers=headers)
    assert pages.status_code == 200
    assert pages.json()[0]["path"] == "/post/1"

    # SDK 托管
    tracker = client.get("/tracker.js")
    assert tracker.status_code == 200
    assert "data-site" in tracker.text


def test_auth_boundaries(client: TestClient) -> None:
    owner_headers = _register(client, "owner2@test.local")
    response = client.post(
        "/api/sites", json={"name": "私有站点", "domain": "private.example.com"}, headers=owner_headers
    )
    site_id = response.json()["id"]

    # 未登录
    assert client.get(f"/api/stats/{site_id}/overview").status_code == 401

    # 他人站点：404，不暴露存在性
    other_headers = _register(client, "intruder@test.local")
    assert client.get(f"/api/stats/{site_id}/overview", headers=other_headers).status_code == 404
    assert client.delete(f"/api/sites/{site_id}", headers=other_headers).status_code == 404

    # 删除自己的站点
    assert client.delete(f"/api/sites/{site_id}", headers=owner_headers).status_code == 204
    assert client.get(f"/api/sites/{site_id}", headers=owner_headers).status_code == 404

    # 重复注册
    assert (
        client.post(
            "/api/auth/register", json={"email": "intruder@test.local", "password": "test1234"}
        ).status_code
        == 409
    )

    # 登录成功 / 失败
    assert (
        client.post(
            "/api/auth/login", json={"email": "intruder@test.local", "password": "test1234"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/login", json={"email": "intruder@test.local", "password": "wrong-pass"}
        ).status_code
        == 401
    )