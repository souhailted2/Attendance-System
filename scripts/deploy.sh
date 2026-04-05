#!/usr/bin/env bash
# deploy.sh — Production deployment script for Hostinger shared hosting
# Usage: bash scripts/deploy.sh
# Requirements: sshpass installed locally (apt-get install sshpass)

set -euo pipefail

SSH_HOST="109.106.251.14"
SSH_PORT="65002"
SSH_USER="u807293731"
REMOTE_APP_DIR="/home/u807293731/attendance"
LOCAL_DIST="dist/index.cjs"
PASS_FILE="/tmp/.deploy_pass"

if [[ -z "${DEPLOY_SSH_PASSWORD:-}" ]]; then
  echo "ERROR: Set DEPLOY_SSH_PASSWORD env var before running this script." >&2
  exit 1
fi

printf '%s' "$DEPLOY_SSH_PASSWORD" > "$PASS_FILE"
chmod 600 "$PASS_FILE"
trap 'rm -f "$PASS_FILE"' EXIT

ssh_cmd() {
  sshpass -f "$PASS_FILE" ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "$@"
}

scp_cmd() {
  sshpass -f "$PASS_FILE" scp -o StrictHostKeyChecking=no -P "$SSH_PORT" "$@"
}

echo "=== 1/4 Building production bundle ==="
npm run build

echo "=== 2/4 Uploading dist/index.cjs to server ==="
scp_cmd "$LOCAL_DIST" "${SSH_USER}@${SSH_HOST}:${REMOTE_APP_DIR}/dist/index.cjs"

echo "=== 3/4 Restarting PM2 app ==="
ssh_cmd '
  export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 20 --silent
  pm2 restart attendance --update-env
'

echo "=== 4/4 Verifying deployment ==="
sleep 3
STATUS=$(ssh_cmd 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/companies')

if [[ "$STATUS" == "200" ]]; then
  echo "Deployment successful — API responded with HTTP $STATUS"
  echo "Live at: https://allal.alllal.com"
else
  echo "WARNING: API responded with HTTP $STATUS (expected 200)" >&2
  exit 1
fi
