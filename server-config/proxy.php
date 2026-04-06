<?php
/**
 * Node.js Proxy مع إعادة محاولة تلقائية وإعادة تشغيل ذاتي
 * Deploy: copy to ~/domains/allal.alllal.com/public_html/proxy.php
 */

$uri       = $_SERVER['REQUEST_URI'];
$targetUrl = 'http://127.0.0.1:3000' . $uri;
$method    = $_SERVER['REQUEST_METHOD'];
$body      = file_get_contents('php://input');

function doRequest($targetUrl, $method, $body) {
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $headers = [];
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if ($contentType) $headers[] = 'Content-Type: ' . $contentType;
    if ($body && in_array($method, ['POST','PUT','PATCH'])) {
        $headers[] = 'Content-Length: ' . strlen($body);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    if (!empty($headers)) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response   = curl_exec($ch);
    $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    return ['response' => $response, 'httpCode' => $httpCode, 'headerSize' => $headerSize];
}

function tryRestartApp() {
    $nvmPath = '/home/u807293731/.nvm/nvm.sh';
    $appPath = '/home/u807293731/attendance';
    $cmd = "bash -c 'source {$nvmPath} && cd {$appPath} && pm2 resurrect > /dev/null 2>&1 &' > /dev/null 2>&1 &";
    shell_exec($cmd);
    sleep(4);
}

// المحاولة الأولى
$result = doRequest($targetUrl, $method, $body);

// فشل الاتصال → أعد تشغيل التطبيق وحاول مجدداً
if ($result['response'] === false) {
    tryRestartApp();
    $result = doRequest($targetUrl, $method, $body);
}

// لا تزال فاشلة → محاولة أخيرة
if ($result['response'] === false) {
    sleep(2);
    $result = doRequest($targetUrl, $method, $body);
}

// فشل كلياً → صفحة انتظار تُحدِّث نفسها
if ($result['response'] === false) {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    header('Retry-After: 10');
    echo '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>جارٍ التحميل — نظام الحضور</title>
<meta http-equiv="refresh" content="8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:48px 40px;text-align:center;max-width:360px;width:90%}
  .spinner{width:48px;height:48px;border:5px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 24px}
  h2{color:#1e293b;font-size:1.25rem;margin-bottom:8px}
  p{color:#64748b;font-size:.9rem;line-height:1.6}
  @keyframes spin{to{transform:rotate(360deg)}}
</style></head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>جارٍ تشغيل النظام...</h2>
    <p>سيتم تحديث الصفحة تلقائياً خلال ثوانٍ قليلة</p>
  </div>
</body></html>';
    exit;
}

$responseHeaders = substr($result['response'], 0, $result['headerSize']);
$responseBody    = substr($result['response'], $result['headerSize']);

http_response_code($result['httpCode']);

foreach (explode("\r\n", $responseHeaders) as $header) {
    if (preg_match('/^(Content-Type|Cache-Control|Set-Cookie|Location):/i', $header)) {
        header($header, false);
    }
}

echo $responseBody;
