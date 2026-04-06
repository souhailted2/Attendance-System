<?php
/**
 * Node.js Proxy — يحول جميع الطلبات لتطبيق Node.js على port 3000
 * Deploy: copy to ~/domains/allal.alllal.com/public_html/proxy.php
 */

$uri = $_SERVER['REQUEST_URI'];
$targetUrl = 'http://127.0.0.1:3000' . $uri;

$method = $_SERVER['REQUEST_METHOD'];
$body   = file_get_contents('php://input');

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
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

$response    = curl_exec($ch);
$httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize  = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo 'Error: Could not connect to app server';
    exit;
}

$responseHeaders = substr($response, 0, $headerSize);
$responseBody    = substr($response, $headerSize);

http_response_code($httpCode);

foreach (explode("\r\n", $responseHeaders) as $header) {
    if (preg_match('/^(Content-Type|Cache-Control|Set-Cookie|Location):/i', $header)) {
        header($header, false);
    }
}

echo $responseBody;
