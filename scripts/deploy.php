<?php
$secret = "12300";
if (!isset($_GET['token']) || $_GET['token'] !== $secret) {
    http_response_code(403);
    die("Access Denied");
}

$home = "/home/u807293731";
$project = "$home/attendance";

// إيجاد pm2
$found = shell_exec("find $home/.nvm -name pm2 -type f 2>/dev/null | head -1");
$pm2 = trim($found) ?: "pm2";

// node bin directory (في نفس بيئة NVM)
$nodeBin = dirname(dirname($pm2)) . '/bin';

$cmd = "export PATH=$nodeBin:$PATH && cd $project && git fetch origin 2>&1 && git checkout -f origin/main -- dist/ agent/mdb-agent.js scripts/ 2>&1 && export \$(grep -v '^#' $project/.env | xargs) 2>/dev/null; $pm2 reload attendance --update-env 2>&1 && $pm2 save --force 2>&1";

$output = shell_exec($cmd);

echo "<pre style='direction:ltr;background:#111;color:#0f0;padding:20px;font-size:13px'>";
echo "pm2: $pm2\n";
echo "node bin: $nodeBin\n\n";
echo htmlspecialchars($output ?: "(لا مخرجات — ربما الأمر نجح بصمت)");
echo "</pre>";
echo "<b style='color:green'>✓ تم تشغيل النشر</b>";
