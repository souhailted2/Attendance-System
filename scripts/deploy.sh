#!/usr/bin/env bash
# deploy.sh — Production deployment script for Hostinger shared-hosting Node.js app
#
# Architecture:
#   - App: Node.js 20 via nvm, managed by PM2 in cluster mode
#   - DB:  MySQL 8 on the same host (127.0.0.1:3306)
#   - Web: LiteSpeed + PHP reverse proxy → port 3000
#   - Deploy: build locally → commit dist/ → push to GitHub → server git pull
#
# Prerequisites (caller environment):
#   - sshpass:              apt-get install sshpass
#   - DEPLOY_SSH_PASSWORD:  export DEPLOY_SSH_PASSWORD="<password>"
#
# Usage:
#   bash scripts/deploy.sh              # full deploy (build + push + pull + restart)
#   SKIP_BUILD=1 bash scripts/deploy.sh # skip local build (just push + pull)

set -euo pipefail

SSH_HOST="109.106.251.14"
SSH_PORT="65002"
SSH_USER="u807293731"
REMOTE_APP_DIR="/home/u807293731/attendance"
GITHUB_URL="https://github.com/souhailted2/Attendance-System.git"
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

# ── Step 1: build locally ──────────────────────────────────────────────────────
if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "=== [1/4] Building production bundle ==="
  npm run build
else
  echo "=== [1/4] Skipping build (SKIP_BUILD=1) ==="
fi

# ── Step 2: commit dist/ and push to GitHub ────────────────────────────────────
echo "=== [2/4] Committing dist/ and pushing to GitHub ==="
git add -A
if git diff --cached --quiet; then
  echo "لا يوجد تغييرات جديدة للرفع"
else
  git commit -m "deploy: update dist/ $(date '+%Y-%m-%d %H:%M')"
  git push origin main
fi

# ── Step 3: server pulls from GitHub ──────────────────────────────────────────
echo "=== [3/5] Server pulling from GitHub ==="
ssh_run bash << REMOTE
  set -euo pipefail
  export NVM_DIR="\$HOME/.nvm"; source "\$NVM_DIR/nvm.sh"; nvm use 20 --silent
  cd "$REMOTE_APP_DIR"

  # Initialize git if not already done
  if [[ ! -d ".git" ]]; then
    git init
    git remote add origin "$GITHUB_URL"
  elif ! git remote | grep -q "^origin$"; then
    git remote add origin "$GITHUB_URL"
  fi

  git fetch origin main
  git reset --hard origin/main
  echo "تم السحب من GitHub بنجاح"
REMOTE

# ── Step 4: deploy ADMS PHP proxy and .htaccess rule ─────────────────────────
echo "=== [4/5] Deploying ADMS PHP proxy to public_html ==="
PUBLIC_HTML="/home/u807293731/domains/allal.alllal.com/public_html"
sshpass -f "$PASS_FILE" scp -P "$SSH_PORT" \
  -o StrictHostKeyChecking=accept-new \
  server-config/iclock.php "${SSH_USER}@${SSH_HOST}:${PUBLIC_HTML}/iclock.php"

sshpass -f "$PASS_FILE" scp -P "$SSH_PORT" \
  -o StrictHostKeyChecking=accept-new \
  server-config/proxy.php "${SSH_USER}@${SSH_HOST}:${PUBLIC_HTML}/proxy.php"

ssh_run bash << 'HTACCESS'
  PUBLIC_HTML="/home/u807293731/domains/allal.alllal.com/public_html"
  HTFILE="${PUBLIC_HTML}/.htaccess"

  cat > "${HTFILE}" << 'EOF'
# Enable PHP
AddHandler application/x-httpd-php .php

# Directory Index
DirectoryIndex index.php index.html

# Security settings
Options -Indexes
ServerSignature Off

RewriteEngine On

# ZKTeco ADMS Push Receiver
RewriteRule ^iclock/(.*)$ /iclock.php [L,QSA,PT]

# Static assets → Node.js
RewriteCond %{REQUEST_URI} \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|map)$ [NC]
RewriteRule ^ /proxy.php [L,QSA]

# API → Node.js
RewriteCond %{REQUEST_URI} ^/api/ [NC]
RewriteRule ^ /proxy.php [L,QSA]

# SPA — everything not an actual file → Node.js
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ /proxy.php [L,QSA]
EOF

  echo "تم تحديث .htaccess"
HTACCESS

# ── Step 5: reload PM2 (zero-downtime) ───────────────────────────────────────
echo "=== [5/5] Reloading PM2 (zero-downtime) and verifying ==="
ssh_run bash << 'REMOTE_RESTART'
  set -euo pipefail
  export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 20 --silent
  cd "$HOME/attendance"

  if pm2 list 2>/dev/null | grep -q "attendance"; then
    # reload = zero-downtime (يحافظ على الاتصالات الحالية)
    pm2 reload attendance --update-env
  else
    # أول تشغيل أو بعد انقطاع كامل
    pm2 resurrect 2>/dev/null || pm2 start ecosystem.config.cjs
    pm2 save --force
  fi

  # تسجيل الحالة الحالية دائماً
  pm2 save --force

  sleep 4
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/companies)
  if [[ "$STATUS" == "200" ]]; then
    echo "✓ النشر نجح — الموقع يعمل (HTTP $STATUS)"
    echo "✓ الموقع: https://allal.alllal.com"
  else
    echo "✗ تحذير: HTTP $STATUS" >&2
    pm2 logs --nostream --lines 20 attendance 2>&1 | tail -20
    exit 1
  fi
REMOTE_RESTART
