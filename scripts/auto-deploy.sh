#!/bin/bash
HOME=/home/u807293731
PM2_HOME=/home/u807293731/.pm2
NODE_BIN=$(ls -d /home/u807293731/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)
export HOME PM2_HOME PATH=$NODE_BIN:/usr/local/bin:/usr/bin:/bin

cd /home/u807293731/attendance
git fetch origin -q

if ! git diff --quiet HEAD origin/main -- dist/ agent/ scripts/; then
    git checkout -f origin/main -- dist/ agent/ scripts/
    $NODE_BIN/pm2 reload attendance --update-env 2>/dev/null || \
        $NODE_BIN/pm2 start /home/u807293731/attendance/ecosystem.config.cjs
    $NODE_BIN/pm2 save --force 2>/dev/null
    echo "$(date): deployed + pm2 reloaded" >> /home/u807293731/attendance/deploy.log

    # تحقق من أن تحميل حزمة MDB يعمل
    sleep 3
    MDB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 10 \
        https://allal.alllal.com/api/agent/download-mdb-package 2>/dev/null || echo "000")
    if [ "$MDB_STATUS" = "200" ] || [ "$MDB_STATUS" = "401" ]; then
        echo "$(date): mdb-package endpoint OK ($MDB_STATUS)" >> /home/u807293731/attendance/deploy.log
    else
        echo "$(date): WARNING mdb-package endpoint returned $MDB_STATUS" >> /home/u807293731/attendance/deploy.log
    fi
fi

# تحقق دائماً أن PM2 يعمل حتى بدون تحديثات
if ! $NODE_BIN/pm2 list 2>/dev/null | grep -q "attendance.*online"; then
    $NODE_BIN/pm2 start /home/u807293731/attendance/ecosystem.config.cjs 2>/dev/null
    $NODE_BIN/pm2 save --force 2>/dev/null
    echo "$(date): pm2 restarted (was down)" >> /home/u807293731/attendance/deploy.log
fi
