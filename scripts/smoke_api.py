#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "scripts" / "smoke_api.local.json"


class SmokeError(RuntimeError):
    pass


def load_config(path: Path) -> dict[str, Any]:
    config: dict[str, Any] = {}
    if path.exists():
        config.update(json.loads(path.read_text(encoding="utf-8")))

    env_map = {
        "base_url": "COFFEE_SMOKE_BASE_URL",
        "admin_email": "COFFEE_SMOKE_ADMIN_EMAIL",
        "admin_password": "COFFEE_SMOKE_ADMIN_PASSWORD",
        "admin_token": "COFFEE_SMOKE_ADMIN_TOKEN",
        "test_user_email": "COFFEE_SMOKE_TEST_USER_EMAIL",
        "test_user_phone": "COFFEE_SMOKE_TEST_USER_PHONE",
        "expected_bitrix_contact_id": "COFFEE_SMOKE_EXPECTED_BITRIX_CONTACT_ID",
    }
    for key, env_name in env_map.items():
        if os.getenv(env_name):
            config[key] = os.getenv(env_name)

    if os.getenv("COFFEE_SMOKE_ALLOW_MUTATION"):
        config["allow_mutation"] = os.getenv("COFFEE_SMOKE_ALLOW_MUTATION") in {"1", "true", "yes", "on"}
    if os.getenv("COFFEE_SMOKE_EXPECT_BITRIX_SYNCED"):
        config["expect_bitrix_synced"] = os.getenv("COFFEE_SMOKE_EXPECT_BITRIX_SYNCED") in {"1", "true", "yes", "on"}

    config.setdefault("base_url", "https://barista-school.online")
    config.setdefault("allow_mutation", False)
    config.setdefault("expect_bitrix_synced", False)
    config.setdefault("poll_seconds", 35)
    config.setdefault(
        "forbidden_public_keys",
        ["email", "phone", "telegram", "yclients", "yclients_id", "bitrix_contact_id"],
    )
    return config


def require_config(config: dict[str, Any]) -> None:
    if not config.get("admin_token") and not (config.get("admin_email") and config.get("admin_password")):
        raise SmokeError(
            "Не заданы admin credentials или admin_token. Создайте scripts/smoke_api.local.json "
            "из scripts/smoke_api.example.json или задайте COFFEE_SMOKE_ADMIN_EMAIL/"
            "COFFEE_SMOKE_ADMIN_PASSWORD."
        )
    if not (config.get("test_user_email") or config.get("test_user_phone")):
        raise SmokeError("Нужно задать test_user_email или test_user_phone для поиска тестового пользователя.")


def api_url(base_url: str, path: str) -> str:
    return urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))


def request_json(
    base_url: str,
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    timeout: int = 20,
) -> Any:
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
            return json.loads(raw) if raw else None
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        raise SmokeError(f"{method} {path} -> HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise SmokeError(f"{method} {path} -> network error: {exc}") from exc


def ok(message: str) -> None:
    print(f"OK  {message}")


def fail(message: str) -> None:
    raise SmokeError(message)


def assert_access_shape(value: Any, context: str) -> None:
    if not isinstance(value, dict):
        fail(f"{context}: access должен быть объектом")
    for key in ("drinks", "finance", "author"):
        if not isinstance(value.get(key), bool):
            fail(f"{context}: access.{key} должен быть boolean")


def normalize_phone(value: str) -> str:
    digits = "".join(ch for ch in (value or "") if ch.isdigit())
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    return digits


def phone_matches(left: str, right: str) -> bool:
    a = normalize_phone(left)
    b = normalize_phone(right)
    if not a or not b:
        return False
    return a == b or a[-10:] == b[-10:]


def find_test_user(users: list[dict[str, Any]], config: dict[str, Any]) -> dict[str, Any]:
    target_email = (config.get("test_user_email") or "").strip().lower()
    target_phone = config.get("test_user_phone") or ""
    for user in users:
        if target_email and str(user.get("email", "")).lower() == target_email:
            return user
        if target_phone and phone_matches(str(user.get("phone", "")), target_phone):
            return user
    fail("Тестовый пользователь не найден по email/телефону.")


def find_author(authors: list[dict[str, Any]], user_id: int) -> dict[str, Any] | None:
    for author in authors:
        if int(author.get("user_id") or 0) == int(user_id):
            return author
    return None


def collect_forbidden_paths(value: Any, forbidden: set[str], prefix: str = "$") -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            path = f"{prefix}.{key}"
            if key in forbidden:
                found.append(path)
            found.extend(collect_forbidden_paths(child, forbidden, path))
    elif isinstance(value, list):
        for idx, child in enumerate(value):
            found.extend(collect_forbidden_paths(child, forbidden, f"{prefix}[{idx}]"))
    return found


def poll_author(base_url: str, token: str, user_id: int, seconds: int) -> dict[str, Any] | None:
    deadline = time.time() + seconds
    last_author = None
    while time.time() <= deadline:
        authors = request_json(base_url, "GET", "/api/admin/authors", token=token)
        if not isinstance(authors, list):
            fail("/api/admin/authors должен вернуть список")
        last_author = find_author(authors, user_id)
        if last_author and last_author.get("profile_id"):
            status = str(last_author.get("bitrix_sync_status") or "")
            contact_id = str(last_author.get("bitrix_contact_id") or "")
            if status == "synced" and contact_id:
                return last_author
            if status == "error":
                return last_author
        time.sleep(2)
    return last_author


def run(config: dict[str, Any]) -> None:
    require_config(config)
    base_url = str(config["base_url"]).rstrip("/")

    print(f"== API smoke: {base_url} ==")
    print(f"Mutation mode: {'on' if config.get('allow_mutation') else 'off'}")

    health = request_json(base_url, "GET", "/api/health")
    if not isinstance(health, dict) or health.get("ok") is not True:
        fail("/api/health вернул неожиданный ответ")
    ok("health")

    token = config.get("admin_token")
    if token:
        ok("admin token configured")
    else:
        login = request_json(
            base_url,
            "POST",
            "/api/auth/login",
            {"email": config["admin_email"], "password": config["admin_password"]},
        )
        token = login.get("token") if isinstance(login, dict) else None
        if not token:
            fail("admin login не вернул token")
        ok("admin login")

    me = request_json(base_url, "GET", "/api/auth/me", token=token)
    if not isinstance(me, dict) or not me.get("is_admin"):
        fail("/api/auth/me не вернул admin user")
    assert_access_shape(me.get("access"), "/api/auth/me")
    ok("/api/auth/me access")

    users = request_json(base_url, "GET", "/api/admin/users", token=token)
    if not isinstance(users, list) or not users:
        fail("/api/admin/users должен вернуть непустой список")
    for user in users:
        assert_access_shape(user.get("access"), f"user {user.get('id')}")
    ok("/api/admin/users access flags")

    test_user = find_test_user(users, config)
    user_id = int(test_user["id"])
    print(f"Test user: id={user_id}, email={test_user.get('email')}, phone={test_user.get('phone')}")

    if config.get("allow_mutation"):
        patch = request_json(base_url, "PATCH", f"/api/admin/users/{user_id}", {"access_author": True}, token=token)
        if not isinstance(patch, dict) or not patch.get("access_author"):
            fail("PATCH access_author не включил доступ автора")
        ok("author access toggle")
    elif not test_user.get("access_author"):
        fail("У тестового пользователя access_author=false. Включите доступ или запустите smoke с allow_mutation=true.")
    else:
        ok("author access already enabled")

    author = poll_author(base_url, token, user_id, int(config.get("poll_seconds") or 35))
    if not author or not author.get("profile_id"):
        fail("author_profiles не появился для тестового пользователя")
    ok("author profile exists")

    status = str(author.get("bitrix_sync_status") or "")
    contact_id = str(author.get("bitrix_contact_id") or "")
    if status not in {"pending", "synced", "error", ""}:
        fail(f"Неожиданный bitrix_sync_status={status}")

    expected_contact_id = str(config.get("expected_bitrix_contact_id") or "")
    if config.get("expect_bitrix_synced"):
        if status != "synced":
            fail(f"Ожидали bitrix_sync_status=synced, получили {status or '<empty>'}: {author.get('bitrix_sync_error') or ''}")
        if expected_contact_id and contact_id != expected_contact_id:
            fail(f"Ожидали bitrix_contact_id={expected_contact_id}, получили {contact_id or '<empty>'}")
        ok("Bitrix sync synced")
    else:
        ok(f"Bitrix sync status accepted: {status or '<empty>'}")

    public_recipes = request_json(base_url, "GET", "/api/public/author-recipes")
    if not isinstance(public_recipes, list):
        fail("/api/public/author-recipes должен вернуть список")
    forbidden = set(config.get("forbidden_public_keys") or [])
    leaks = collect_forbidden_paths(public_recipes, forbidden)
    if leaks:
        fail("Public API отдаёт приватные поля: " + ", ".join(leaks[:10]))
    ok("public recipes privacy")

    print("\nAll smoke checks passed.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke checks for barista-school.online API")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="Path to local JSON config")
    parser.add_argument("--apply", action="store_true", help="Enable safe mutation for the configured test user")
    parser.add_argument("--expect-bitrix-synced", action="store_true", help="Require synced Bitrix contact")
    args = parser.parse_args()

    config = load_config(Path(args.config))
    if args.apply:
        config["allow_mutation"] = True
    if args.expect_bitrix_synced:
        config["expect_bitrix_synced"] = True

    try:
        run(config)
        return 0
    except SmokeError as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
