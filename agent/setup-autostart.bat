@echo off
chcp 65001 >nul
title ZKTeco AutoSync - إعداد التشغيل التلقائي

echo ════════════════════════════════════════════════════════
echo   ZKTeco AutoSync - إعداد التشغيل التلقائي مع Windows
echo ════════════════════════════════════════════════════════
echo.

:: التحقق من صلاحيات Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ يجب تشغيل هذا الملف كـ Administrator
    echo.
    echo    انقر بالزر الأيمن على الملف ← "Run as administrator"
    echo.
    pause
    exit /b 1
)

set "SCRIPT_DIR=%~dp0"
set "TASK_NAME=ZKTeco_AutoSync"
set "VBS_FILE=%SCRIPT_DIR%autostart-silent.vbs"

echo ✅ صلاحيات Administrator: موجودة
echo 📂 المجلد: %SCRIPT_DIR%
echo.

:: إنشاء ملف VBS لتشغيل auto.bat بصمت (بدون نافذة CMD)
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.Run Chr(34) ^& "%SCRIPT_DIR%auto.bat" ^& Chr(34), 0, False >> "%VBS_FILE%"
echo Set WshShell = Nothing >> "%VBS_FILE%"

echo ✅ تم إنشاء: autostart-silent.vbs
echo.

:: حذف المهمة القديمة إن وجدت
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: إنشاء مهمة تشتغل عند تسجيل الدخول لـ Windows (بصلاحيات عالية)
schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "wscript.exe \"%VBS_FILE%\"" ^
  /sc onlogon ^
  /rl highest ^
  /delay 0000:30 ^
  /f >nul 2>&1

if %errorlevel% equ 0 (
    echo ════════════════════════════════════════════════════════
    echo ✅ تم إعداد التشغيل التلقائي بنجاح!
    echo ════════════════════════════════════════════════════════
    echo.
    echo   المهمة: %TASK_NAME%
    echo   سيشتغل ZKTeco AutoSync تلقائياً عند كل تسجيل دخول
    echo   مع تأخير 30 ثانية لانتظار اتصال الشبكة
    echo.
    echo ════════════════════════════════════════════════════════
    echo   لإيقاف التشغيل التلقائي لاحقاً:
    echo   schtasks /delete /tn %TASK_NAME% /f
    echo ════════════════════════════════════════════════════════
) else (
    echo ❌ فشل إعداد المهمة المجدولة
    echo.
    echo    جرب: فتح Task Scheduler يدوياً وأنشئ مهمة تشغيل عند الدخول
    echo    أو ضع اختصار لـ auto.bat في مجلد Startup:
    echo    %%APPDATA%%\Microsoft\Windows\Start Menu\Programs\Startup
)

echo.
pause
