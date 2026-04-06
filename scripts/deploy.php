<?php
$secret = "12300";

if (!isset($_GET['token']) || $_GET['token'] !== $secret) {
    http_response_code(403);
    die("Access Denied");
}

$home = "/home/u807293731";
$project = "$home/attendance";

// مسار pm2 (NVM أو global)
$pm2Paths = [
    "$home/.nvm/versions/node/v18.20.8/bin/pm2",
    "$home/.nvm/versions/node/v20.19.0/bin/pm2",
    "$home/.nvm/versions/node/v16.20.2/bin/pm2",
    "/usr/local/bin/pm2",
    "/usr/bin/pm2",
];
$pm2 = null;
foreach ($pm2Paths as $p) {
    if (file_exists($p)) { $pm2 = $p; break; }
}
if (!$pm2) {
    // آخر محاولة: ابحث تلقائياً
    $found = shell_exec("find $home/.nvm -name pm2 -type f 2>/dev/null | head -1");
    $pm2 = trim($found) ?: "pm2";
}

$commands = [
    "cd $project",
    "git fetch origin 2>&1",
    "git checkout -f origin/main -- dist/ agent/mdb-agent.js scripts/ 2>&1",
    "export \$(grep -v '^#' $project/.env | xargs) 2>/dev/null; $pm2 reload attendance --update-env 2>&1",
    "$pm2 save --force 2>&1",
];

$full = implode(" && ", $commands);
$output = shell_exec($full . " 2>&1");

echo "<pre style='direction:ltr;background:#111;color:#0f0;padding:20px;font-size:13px'>";
echo "pm2 path: $pm2\n\n";
echo htmlspecialchars($output ?: "(لا يوجد مخرجات — ربما الأمر يعمل بصمت)");
echo "</pre>";
echo "<p style='color:green;font-weight:bold'>✓ تم تشغيل النشر</p>";
