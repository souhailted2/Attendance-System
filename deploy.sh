#!/bin/bash
# سكريبت النشر التلقائي — يُشغَّل على السيرفر
set -e

cd ~/attendance

# حفظ .env مؤقتاً إذا كان موجوداً
if [ -f .env ]; then
  cp .env /tmp/attendance_env_backup
fi

# جلب آخر تحديثات بالقوة (يتجاوز أي تعارضات محلية)
git fetch origin main
git reset --hard origin/main

# استعادة .env
if [ -f /tmp/attendance_env_backup ]; then
  cp /tmp/attendance_env_backup .env
  echo ".env تمت الاستعادة"
fi

# تحميل متغيرات البيئة وإعادة تشغيل التطبيق
set -a && source .env && set +a
pm2 reload attendance --update-env
pm2 save --force

echo "تم النشر بنجاح"
