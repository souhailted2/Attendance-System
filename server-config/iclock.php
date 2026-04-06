<?php
/**
 * ZKTeco ADMS Push Receiver Proxy
 * This file lives in the Apache/LiteSpeed public_html root.
 * It forwards all /iclock/* requests to the Node.js app on port 3000.
 *
 * Deploy: copy this file to ~/domains/allal.alllal.com/public_html/iclock.php
 * .htaccess rule: RewriteRule ^iclock/(.*)$ /iclock.php [L,QSA,PT]
 */

$path = preg_replace('/^\/iclock/', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (empty($path) || $path === '/') $path = '/cdata';

$queryString = $_SERVER['QUERY_STRING'] ?? '';
$targetUrl = 'http://127.0.0.1:3000/iclock' . $path;
if ($queryString) $targetUrl .= '?' . $queryString;

$body   = file_get_contents('php://input');
$method = $_SERVER['REQUEST_METHOD'];

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

$headers = [];
if ($method === 'POST') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? 'text/plain';
    $headers[] = 'Content-Type: ' . $contentType;
    $headers[] = 'Content-Length: ' . strlen($body);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}
if (!empty($headers)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode ?: 200);
header('Content-Type: text/plain');
echo $response !== false ? $response : 'OK';
