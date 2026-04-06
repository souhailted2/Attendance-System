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

// إعادة التشغيل الآمنة: SIGUSR2 (graceful reload) بدلاً من SIGTERM (إيقاف كامل)
$pidFile = "$home/.pm2/pids/attendance-0.pid";
$restart = "";

if (file_exists($pidFile)) {
    $pid = (int)trim(file_get_contents($pidFile));
    if ($pid > 0 && file_exists("/proc/$pid")) {
        // العملية شغّالة — إرسال SIGUSR2 للتحديث بدون إيقاف
        shell_exec("kill -USR2 $pid 2>&1");
        sleep(1);
        $restart = "أُرسل SIGUSR2 → PID $pid (graceful reload)";
    } else {
        // العملية متوقفة — إعادة تشغيل كاملة
        $out = shell_exec("$env && cd $project && $nodeBin/pm2 resurrect 2>&1 || $nodeBin/pm2 start $project/ecosystem.config.cjs 2>&1");
        $restart = "إعادة تشغيل من الصفر:\n" . $out;
    }
} else {
    $restart = "ملف PID غير موجود — تحقق من pm2 يدوياً";
}

echo "<pre style='direction:ltr;background:#111;color:#0f0;padding:20px;font-size:13px'>";
echo "=== git ===\n" . htmlspecialchars($git ?: "(لا تحديثات جديدة)") . "\n\n";
echo "=== restart ===\n" . htmlspecialchars($restart) . "\n";
echo "</pre>";
echo "<b style='color:green'>✓ تم النشر</b>";
