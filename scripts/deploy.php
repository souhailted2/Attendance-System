<?php
$secret = "12300";
if (!isset($_GET['token']) || $_GET['token'] !== $secret) {
    http_response_code(403);
    die("Access Denied");
}

$home = "/home/u807293731";
$project = "$home/attendance";

$nvmDir = "$home/.nvm/versions/node";
$nodeVer = trim(shell_exec("ls $nvmDir 2>/dev/null | sort -V | tail -1"));
$nodeBin = "$nvmDir/$nodeVer/bin";
$env     = "export HOME=$home PM2_HOME=$home/.pm2 PATH=$nodeBin:/usr/local/bin:/usr/bin:/bin";

// git: سحب آخر التحديثات
$git = shell_exec("$env && cd $project && git fetch origin 2>&1 && git checkout -f origin/main -- dist/ agent/mdb-agent.js scripts/ 2>&1");

// إعادة تشغيل العملية عبر PID مباشرة (pm2 يُعيدها تلقائياً)
$pidFile = "$home/.pm2/pids/attendance-0.pid";
$restart = "";
if (file_exists($pidFile)) {
    $pid = (int)trim(file_get_contents($pidFile));
    if ($pid > 0) {
        shell_exec("kill -15 $pid 2>&1");
        sleep(2);
        $newPid = file_exists($pidFile) ? (int)trim(file_get_contents($pidFile)) : 0;
        $restart = "قتل PID $pid ← pm2 أعاد التشغيل، PID الجديد: $newPid";
    }
} else {
    $restart = "ملف PID غير موجود!";
}

echo "<pre style='direction:ltr;background:#111;color:#0f0;padding:20px;font-size:13px'>";
echo "=== git ===\n" . htmlspecialchars($git ?: "(لا تحديثات جديدة — الكود محدث)") . "\n\n";
echo "=== restart ===\n" . htmlspecialchars($restart) . "\n";
echo "</pre>";
echo "<b style='color:green'>✓ تم النشر</b>";
