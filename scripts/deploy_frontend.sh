#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${COFFEE_REMOTE:-root@159.194.233.13}"
SSH_KEY="${COFFEE_SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_DIST="${COFFEE_REMOTE_DIST:-/var/www/coffee-menu/dist}"
HEALTH_URL="${COFFEE_HEALTH_URL:-https://barista-school.online/api/health}"

cd "$ROOT"

echo "== Frontend build =="
npm run build

echo
echo "== Upload dist =="
rsync -avz --exclude='admin-panel.js' -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$ROOT/dist/" "$REMOTE:$REMOTE_DIST/"

echo
echo "== Health check =="
curl -fsS "$HEALTH_URL"
echo
echo "OK: frontend deployed."
