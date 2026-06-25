#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$ROOT/.." && pwd)"
SERVER_DIR="$ROOT/server"
ADMIN_DIR="$SERVER_DIR/admin"
PY_CACHE="${TMPDIR:-/tmp}/coffee-menu-pycache"

cd "$ROOT"

echo "== Coffee_menu preflight =="
echo "Frontend: $ROOT"
echo "Server:   $SERVER_DIR"

echo
echo "== Git status =="
git status --short --branch

echo
echo "== Python compile =="
PYTHONPYCACHEPREFIX="$PY_CACHE" python3 -m py_compile "$SERVER_DIR/main.py"

echo
echo "== Admin bundle =="
bash "$ADMIN_DIR/build.sh"
node --check "$ADMIN_DIR/admin-panel.js"

echo
echo "== Frontend build =="
npm run build

echo
echo "== Docs sync =="
diff -u "$PROJECT_ROOT/PROJECT_MAP.md" "$ROOT/PROJECT_MAP.md" >/dev/null

echo
echo "== Secret scan in docs =="
if rg -n 'tikcy|7976269448|20127c8213|AAGL_|SMTP_PASS=[A-Za-z0-9_-]{6,}|YANDEX_SECRET=[A-Za-z0-9_-]{6,}|TELEGRAM_BOT_TOKEN=[0-9]+:|BITRIX_WEBHOOK=https?://|\*\*Token:\*\* `[0-9]+:' \
  "$PROJECT_ROOT/PROJECT_MAP.md" "$ROOT"/*.md; then
  echo "Secret-like value found in docs. Stop."
  exit 1
fi

echo
echo "OK: preflight checks passed."
