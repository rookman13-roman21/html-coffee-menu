#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$ROOT/.." && pwd)"
SERVER_DIR="$PROJECT_ROOT/server"
REMOTE="${COFFEE_REMOTE:-root@159.194.233.13}"
SSH_KEY="${COFFEE_SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_SERVER="${COFFEE_REMOTE_SERVER:-/var/www/coffee-menu/server}"
SERVICE="${COFFEE_SERVICE:-coffee-menu-api.service}"
PY_CACHE="${TMPDIR:-/tmp}/coffee-menu-pycache"

echo "== Python compile =="
PYTHONPYCACHEPREFIX="$PY_CACHE" python3 -m py_compile "$SERVER_DIR/main.py"

echo
echo "== Remote SQLite backup =="
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE" \
  "set -e; cd '$REMOTE_SERVER'; mkdir -p backups; cp data/app.db backups/app-\$(date +%Y%m%d-%H%M%S).before-backend-deploy.db; echo BACKUP_CREATED"

echo
echo "== Upload backend =="
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE" \
  "set -e; mkdir -p '$REMOTE_SERVER/scripts' '$REMOTE_SERVER/data'"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  "$SERVER_DIR/main.py" "$REMOTE:$REMOTE_SERVER/main.py"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  "$SERVER_DIR/scripts/import_mixology_author_access.py" "$REMOTE:$REMOTE_SERVER/scripts/import_mixology_author_access.py"
if [[ -f "$SERVER_DIR/data/mixology_author_access.json" ]]; then
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    "$SERVER_DIR/data/mixology_author_access.json" "$REMOTE:$REMOTE_SERVER/data/mixology_author_access.json"
fi

echo
echo "== Restart API and health =="
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE" \
  "set -e; systemctl restart '$SERVICE'; systemctl is-active '$SERVICE'; curl -fsS http://127.0.0.1:8000/api/health"
echo
echo "OK: backend deployed."
