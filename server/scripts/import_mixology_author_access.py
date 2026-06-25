#!/usr/bin/env python3
"""Build private Mixology author-access whitelist from a YClients report."""

from __future__ import annotations

import argparse
import glob
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_REPORT_GLOB = (
    "/Users/Romka/Downloads/All_Code/YClients-Dashboard/"
    "data/mixology/reports/generated/*.clients.json"
)


def normalize_phone(value: str) -> str:
    digits = re.sub(r"\D+", "", value or "")
    if len(digits) == 11 and digits.startswith("8"):
        return "7" + digits[1:]
    if len(digits) == 10:
        return "7" + digits
    return digits


def visited_dates(records: str) -> list[str]:
    dates: list[str] = []
    for part in str(records or "").split("|"):
        item = part.strip()
        if not re.search(r"\bvisited\b", item):
            continue
        match = re.match(r"(\d{4}-\d{2}-\d{2})\b", item)
        if match:
            dates.append(match.group(1))
    return sorted(set(dates))


def row_mixology_dates(row: dict) -> list[str]:
    dates = visited_dates(row.get("mixology_records", ""))
    raw_dates = row.get("mixology_dates")
    if isinstance(raw_dates, list):
        dates.extend(str(item)[:10] for item in raw_dates if item)
    first_cup_date = str(row.get("first_cup_date") or "").strip()[:10]
    if re.match(r"\d{4}-\d{2}-\d{2}$", first_cup_date):
        dates.append(first_cup_date)
    return sorted(set(date for date in dates if re.match(r"\d{4}-\d{2}-\d{2}$", date)))


def event_season(title: str, dates: list[str]) -> str:
    match = re.search(r"\b(20\d{2})\b", title or "")
    if match:
        return match.group(1)
    for date in dates:
        if re.match(r"20\d{2}-", date):
            return date[:4]
    return ""


def mixology_participations(row: dict, dates: list[str]) -> list[dict]:
    service = str(row.get("first_active_visit_service") or "").strip()
    season = event_season(service, dates)
    title = service if re.search(r"mixology", service, re.I) else f"MBS MIXOLOGY CUP {season}".strip()
    event_key = f"mixology-cup-{season}" if season else "mixology-cup"
    return [{
        "event_key": event_key,
        "event_title": title or "MBS MIXOLOGY CUP",
        "season": season,
        "dates": dates,
        "source": "mixology_author_access",
    }]


def latest_report(pattern: str) -> Path:
    files = [Path(p) for p in glob.glob(pattern)]
    if not files:
        raise SystemExit(f"No report files found: {pattern}")
    return max(files, key=lambda p: p.stat().st_mtime)


def load_rows(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise SystemExit(f"Expected list in {path}")
    return [row for row in data if isinstance(row, dict)]


def build_items(rows: list[dict]) -> list[dict]:
    by_phone: dict[str, dict] = {}
    for row in rows:
        dates = row_mixology_dates(row)
        if not dates:
            continue
        phone = normalize_phone(row.get("phone", ""))
        if not phone:
            continue
        current = by_phone.setdefault(
            phone,
            {
                "phone": phone,
                "yclients_id": str(row.get("id") or ""),
                "visited_dates": [],
                "championship_participations": [],
            },
        )
        current["visited_dates"] = sorted(set(current["visited_dates"]) | set(dates))
        merged = {
            item.get("event_key"): item
            for item in current.get("championship_participations", [])
            if isinstance(item, dict) and item.get("event_key")
        }
        for item in mixology_participations(row, dates):
            existing = merged.get(item["event_key"]) or {**item, "dates": []}
            existing["dates"] = sorted(set(existing.get("dates") or []) | set(item["dates"]))
            merged[item["event_key"]] = existing
        current["championship_participations"] = sorted(merged.values(), key=lambda item: item.get("event_key") or "")
        if not current["yclients_id"] and row.get("id"):
            current["yclients_id"] = str(row.get("id"))
    return sorted(by_phone.values(), key=lambda item: item["phone"])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="", help="Path to *.clients.json report")
    parser.add_argument("--glob", default=DEFAULT_REPORT_GLOB, help="Report glob used when --source is empty")
    parser.add_argument(
        "--output",
        default=str(Path(__file__).resolve().parents[1] / "data" / "mixology_author_access.json"),
        help="Private backend whitelist output path",
    )
    args = parser.parse_args()

    source = Path(args.source).expanduser() if args.source else latest_report(args.glob)
    output = Path(args.output).expanduser()
    rows = load_rows(source)
    items = build_items(rows)
    payload = {
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source": str(source),
        "items": items,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    tmp = output.with_suffix(output.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    os.replace(tmp, output)
    print(json.dumps({"ok": True, "source": str(source), "output": str(output), "items": len(items)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
