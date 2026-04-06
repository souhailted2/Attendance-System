@echo off
  REM ================================================================
  REM سكريبت النشر والإصلاح الكامل - يُشغَّل من جهاز Windows
  REM ================================================================

  REM تأكد من وجود المتغيرات
  set VPS_HOST=109.106.251.14
  set VPS_PORT=65002
  set VPS_USER=u807293731
  set VPS_PASS=Taher96+++.com
  set APP_DIR=~/attendance

  REM 1. نسخ ملفات dist إلى السيرفر
  echo [1/4] نقل ملفات التطبيق...
  scp -P %VPS_PORT% -r dist\ %VPS_USER%@%VPS_HOST%:%APP_DIR%/dist/
  scp -P %VPS_PORT% agent\mdb-agent.js %VPS_USER%@%VPS_HOST%:%APP_DIR%/agent/

  REM 2. نسخ ملفات SQL
  echo [2/4] نقل ملفات SQL...
  scp -P %VPS_PORT% scripts\fix_employee_names_cards.sql %VPS_USER%@%VPS_HOST%:/tmp/
  scp -P %VPS_PORT% scripts\repair_checkout_today.sql %VPS_USER%@%VPS_HOST%:/tmp/

  REM 3. إعادة تشغيل التطبيق
  echo [3/4] إعادة تشغيل التطبيق...
  ssh -p %VPS_PORT% %VPS_USER%@%VPS_HOST% "cd %APP_DIR% && pm2 reload attendance --update-env && pm2 save --force"

  REM 4. تشغيل SQL
  echo [4/4] تحديث قاعدة البيانات...
  ssh -p %VPS_PORT% %VPS_USER%@%VPS_HOST% "mysql -h 127.0.0.1 -u u807293731_insert -pTaher96+++.com u807293731_insert < /tmp/fix_employee_names_cards.sql && mysql -h 127.0.0.1 -u u807293731_insert -pTaher96+++.com u807293731_insert < /tmp/repair_checkout_today.sql"

  echo ================================================================
  echo تم النشر بنجاح
  echo ================================================================
  pause
  