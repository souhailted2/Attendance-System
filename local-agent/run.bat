@echo off
chcp 65001 > nul
title ZKTeco Local Agent - مزامنة الحضور

echo ================================================
echo    ZKTeco Local Agent - مزامنة الحضور تلقائياً
echo ================================================
echo.

:: التحقق من Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo خطأ: Node.js غير مثبت على هذا الكمبيوتر
    echo حمّله من: https://nodejs.org
    pause
    exit /b 1
)

:: التحقق من المكتبات
if not exist "node_modules" (
    echo تثبيت المكتبات المطلوبة...
    npm install
    echo.
)

echo بدء تشغيل الوكيل — سيتزامن كل 5 دقائق
echo اضغط Ctrl+C لإيقاف التشغيل
echo.

node agent.js --loop

pause
