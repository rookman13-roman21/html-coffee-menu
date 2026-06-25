#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "scripts" / "smoke_workspace_security.local.json"


class SmokeError(RuntimeError):
    pass


def load_config(path: Path) -> dict[str, Any]:
    config: dict[str, Any] = {}
    if path.exists():
        config.update(json.loads(path.read_text(encoding="utf-8")))

    env_map = {
        "base_url": "COFFEE_WS_SMOKE_BASE_URL",
        "workspace_id": "COFFEE_WS_SMOKE_WORKSPACE_ID",
        "owner_token": "COFFEE_WS_SMOKE_OWNER_TOKEN",
        "editor_token": "COFFEE_WS_SMOKE_EDITOR_TOKEN",
        "guest_token": "COFFEE_WS_SMOKE_GUEST_TOKEN",
        "outside_workspace_id": "COFFEE_WS_SMOKE_OUTSIDE_WORKSPACE_ID",
    }
    for key, env_name in env_map.items():
        if os.getenv(env_name):
            config[key] = os.getenv(env_name)

    config.setdefault("base_url", "https://barista-school.online")
    config.setdefault(
        "owner_only_actions",
        ["workspace_deleted", "member_removed", "location_deleted", "snapshot_restored"],
    )
    return config


def api_url(base_url: str, path: str) -> str:
    return urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))


def request_json(
    base_url: str,
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    timeout: int = 20,
) -> tuple[int, Any]:
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {"Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = Request(api_url(base_url, path), data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else None
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        try:
            payload: Any = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            payload = raw
        return exc.code, payload
    except URLError as exc:
        raise SmokeError(f"{method} {path} -> network error: {exc}") from exc


def ok(message: str) -> None:
    print(f"OK  {message}")


def fail(message: str) -> None:
    raise SmokeError(message)


def require_token(config: dict[str, Any], key: str) -> str:
    token = str(config.get(key) or "").strip()
    if not token:
        fail(f"Не задан {key}. Заполните local config или env-переменную.")
    return token


def require_workspace_id(config: dict[str, Any]) -> int:
    raw = str(config.get("workspace_id") or "").strip()
    if not raw:
        fail("Не задан workspace_id.")
    try:
        return int(raw)
    except ValueError as exc:
        raise SmokeError("workspace_id должен быть числом") from exc


def user_label(payload: Any) -> str:
    if not isinstance(payload, dict):
        return "<unknown>"
    return str(payload.get("email") or payload.get("name") or payload.get("id") or "<unknown>")


def assert_member_workspace(base_url: str, token: str, workspace_id: int, label: str) -> None:
    status, payload = request_json(base_url, "GET", f"/api/state?workspace_id={workspace_id}", token=token)
    if status != 200:
        fail(f"{label}: GET /api/state?workspace_id={workspace_id} -> HTTP {status}: {payload}")
    if not isinstance(payload, dict) or not payload.get("workspace"):
        fail(f"{label}: /api/state не вернул workspace")
    ok(f"{label}: has workspace access")


def assert_activity_forbidden(base_url: str, token: str, workspace_id: int, action: str, label: str) -> None:
    status, payload = request_json(
        base_url,
        "POST",
        f"/api/workspaces/{workspace_id}/activity",
        {"action": action, "target_type": "workspace", "target_id": str(workspace_id), "summary": "workspace smoke"},
        token=token,
    )
    if status != 403:
        fail(f"{label}: action {action} должен вернуть 403, получил HTTP {status}: {payload}")
    ok(f"{label}: owner-only activity {action} blocked")


def assert_outside_workspace_forbidden(base_url: str, token: str, outside_id: int, label: str) -> None:
    status, payload = request_json(base_url, "GET", f"/api/state?workspace_id={outside_id}", token=token)
    if status != 403:
        fail(f"{label}: outside workspace должен вернуть 403, получил HTTP {status}: {payload}")
    ok(f"{label}: outside workspace blocked")


def run(config: dict[str, Any]) -> None:
    base_url = str(config["base_url"]).rstrip("/")
    workspace_id = require_workspace_id(config)
    owner_token = require_token(config, "owner_token")
    editor_token = str(config.get("editor_token") or "").strip()
    guest_token = str(config.get("guest_token") or "").strip()
    if not editor_token and not guest_token:
        fail("Нужно задать хотя бы editor_token или guest_token.")

    print(f"== Workspace security smoke: {base_url} ==")
    print(f"Workspace: {workspace_id}")

    status, health = request_json(base_url, "GET", "/api/health")
    if status != 200 or not isinstance(health, dict) or health.get("ok") is not True:
        fail(f"/api/health вернул неожиданный ответ: HTTP {status}: {health}")
    ok("health")

    for token_key, token in (("owner", owner_token), ("editor", editor_token), ("guest", guest_token)):
        if not token:
            continue
        status, me = request_json(base_url, "GET", "/api/auth/me", token=token)
        if status != 200:
            fail(f"{token_key}: /api/auth/me -> HTTP {status}: {me}")
        ok(f"{token_key}: auth as {user_label(me)}")
        assert_member_workspace(base_url, token, workspace_id, token_key)

    actions = list(config.get("owner_only_actions") or [])
    for label, token in (("editor", editor_token), ("guest", guest_token)):
        if not token:
            continue
        for action in actions:
            assert_activity_forbidden(base_url, token, workspace_id, str(action), label)

    outside_raw = str(config.get("outside_workspace_id") or "").strip()
    if outside_raw:
        outside_id = int(outside_raw)
        for label, token in (("editor", editor_token), ("guest", guest_token)):
            if token:
                assert_outside_workspace_forbidden(base_url, token, outside_id, label)

    print("\nAll workspace security smoke checks passed.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Workspace role/security smoke checks")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="Path to local JSON config")
    args = parser.parse_args()

    try:
        run(load_config(Path(args.config)))
        return 0
    except SmokeError as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
