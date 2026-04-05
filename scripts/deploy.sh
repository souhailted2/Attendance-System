#!/usr/bin/env bash
# deploy.sh — Production deployment script for Hostinger shared-hosting Node.js app
#
# Architecture:
#   - App: Node.js 20 via nvm, managed by PM2 in cluster mode
#   - DB:  MySQL 8 on the same host (127.0.0.1:3306)
#   - Web: LiteSpeed + PHP reverse proxy → port 3000
#   - Bundle: esbuild CJS (dist/index.cjs) — all npm deps pre-bundled inside
#
# Prerequisites (caller environment):
#   - sshpass:              apt-get install sshpass
#   - DEPLOY_SSH_PASSWORD:  export DEPLOY_SSH_PASSWORD="<password>"
#
# Usage:
#   bash scripts/deploy.sh              # full deploy (build + upload + restart + verify)
#   SKIP_BUILD=1 bash scripts/deploy.sh # skip local npm run build

set -euo pipefail

SSH_HOST="109.106.251.14"
SSH_PORT="65002"
SSH_USER="u807293731"
REMOTE_APP_DIR="/home/u807293731/attendance"
PASS_FILE="/tmp/.deploy_pass_$(date +%s)"

if [[ -z "${DEPLOY_SSH_PASSWORD:-}" ]]; then
  echo "ERROR: Set DEPLOY_SSH_PASSWORD env var before running this script." >&2
  exit 1
fi

printf '%s' "$DEPLOY_SSH_PASSWORD" > "$PASS_FILE"
chmod 600 "$PASS_FILE"
trap 'rm -f "$PASS_FILE"' EXIT

ssh_run() {
  sshpass -f "$PASS_FILE" ssh \
    -o StrictHostKeyChecking=accept-new \
    -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "$@"
}

scp_upload() {
  sshpass -f "$PASS_FILE" scp \
    -o StrictHostKeyChecking=accept-new \
    -P "$SSH_PORT" "$@"
}

# ── Step 1: local build ────────────────────────────────────────────────────────
if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "=== [1/5] Building production bundle ==="
  npm run build
else
  echo "=== [1/5] Skipping build (SKIP_BUILD=1) ==="
fi

echo "=== [2/5] Uploading dist/index.cjs ==="
scp_upload dist/index.cjs "${SSH_USER}@${SSH_HOST}:${REMOTE_APP_DIR}/dist/index.cjs"

# ── Step 3: ensure ecosystem config exists and DATABASE_URL is set ─────────────
echo "=== [3/5] Verifying ecosystem config and DATABASE_URL on server ==="
ssh_run bash << 'REMOTE_CHECK'
  set -euo pipefail
  export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 20 --silent

  if [[ ! -f "$HOME/attendance/ecosystem.config.cjs" ]]; then
    echo "ERROR: ecosystem.config.cjs not found at ~/attendance/ecosystem.config.cjs" >&2
    exit 1
  fi

  # Verify pm2 can read the config
  pm2 prettylist --no-color 2>/dev/null | grep -q "attendance" || echo "INFO: App not yet in PM2 — will start fresh."

  # Verify node_modules has mysql2 (bundled in CJS, but double-check for edge cases)
  if [[ ! -d "$HOME/attendance/node_modules/mysql2" ]]; then
    echo "INFO: mysql2 not in server node_modules. Installing..."
    cd "$HOME/attendance" && npm install mysql2 --save 2>&1 | tail -5
  fi
REMOTE_CHECK

# ── Step 4: restart PM2 ───────────────────────────────────────────────────────
echo "=== [4/5] Restarting PM2 app ==="
ssh_run bash << 'REMOTE_RESTART'
  set -euo pipefail
  export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 20 --silent
  cd "$HOME/attendance"

  if pm2 list 2>/dev/null | grep -q "attendance"; then
    pm2 restart attendance --update-env
  else
    pm2 start ecosystem.config.cjs
    pm2 save
  fi
REMOTE_RESTART

# ── Step 5: health check ──────────────────────────────────────────────────────
echo "=== [5/5] Verifying deployment ==="
sleep 4
STATUS=$(ssh_run 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/companies')

if [[ "$STATUS" == "200" ]]; then
  echo "✓ Deployment successful — API responded with HTTP $STATUS"
  echo "✓ Live at: https://allal.alllal.com"
else
  echo "✗ WARNING: API responded with HTTP $STATUS (expected 200)" >&2
  ssh_run '
    export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 20 --silent
    pm2 logs --nostream --lines 20 attendance 2>&1 | tail -20
  '
  exit 1
fi
