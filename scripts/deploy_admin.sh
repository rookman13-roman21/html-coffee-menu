#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$ROOT/.." && pwd)"
ADMIN_DIR="$ROOT/server/admin"
REMOTE="${COFFEE_REMOTE:-root@159.194.233.13}"
SSH_KEY="${COFFEE_SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_PANEL="${COFFEE_REMOTE_PANEL:-/var/www/coffee-menu/dist/admin-panel.js}"
HEALTH_URL="${COFFEE_HEALTH_URL:-https://barista-school.online/api/health}"

echo "== Admin bundle =="
bash "$ADMIN_DIR/build.sh"
node --check "$ADMIN_DIR/admin-panel.js"

echo
echo "== Upload admin-panel.js =="
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  "$ADMIN_DIR/admin-panel.js" "$REMOTE:$REMOTE_PANEL"

echo
echo "== Health check =="
curl -fsS "$HEALTH_URL"
echo
echo "OK: admin panel deployed."
