-- =====================================================================
-- تعيين جماعي للموظفين لورشاتهم
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshops_bulk.sql
-- =====================================================================

-- 1. ورشة فيس ال
UPDATE employees e JOIN workshops w ON w.name = 'فيس ال'
SET e.workshop_id = w.id WHERE e.employee_code IN ('24');

-- 2. ورشة رونديل
UPDATE employees e JOIN workshops w ON w.name = 'رونديل'
SET e.workshop_id = w.id WHERE e.employee_code IN ('156','194','315');

-- 3. ورشة الفيلتاج (المجموعة الأولى)
UPDATE employees e JOIN workshops w ON w.name = 'الفيلتاج'
SET e.workshop_id = w.id WHERE e.employee_code IN ('20','31','65','87','97','100','101','103','152','290');

-- 4. ورشة السكوتش
UPDATE employees e JOIN workshops w ON w.name = 'السكوتش'
SET e.workshop_id = w.id WHERE e.employee_code IN ('91','129');

-- 5. ورشة الرفش
UPDATE employees e JOIN workshops w ON w.name = 'الرفش'
SET e.workshop_id = w.id WHERE e.employee_code IN ('28','57','88','154','186','202','278','292','330','334','340','344','351','379','383');

-- 6. ورشة السلك
UPDATE employees e JOIN workshops w ON w.name = 'السلك'
SET e.workshop_id = w.id WHERE e.employee_code IN ('142','203','287');

-- 7. ورشة الشبكة
UPDATE employees e JOIN workshops w ON w.name = 'الشبكة'
SET e.workshop_id = w.id WHERE e.employee_code IN ('78','125','204','359','398');

-- 8. ورشة الزنقاج
UPDATE employees e JOIN workshops w ON w.name = 'الزنقاج'
SET e.workshop_id = w.id WHERE e.employee_code IN ('22','105','158','179','191','258','263');

-- 9. ورشة الكاليبراج
UPDATE employees e JOIN workshops w ON w.name = 'الكاليبراج'
SET e.workshop_id = w.id WHERE e.employee_code IN ('143');

-- 10. ورشة الصامولة
UPDATE employees e JOIN workshops w ON w.name = 'الصامولة'
SET e.workshop_id = w.id WHERE e.employee_code IN ('71','262','276','366');

-- 11. ورشة التيج فيلتي
UPDATE employees e JOIN workshops w ON w.name = 'التيج فيلتي'
SET e.workshop_id = w.id WHERE e.employee_code IN ('297','309','337','369');

-- 12. ورشة الفيلتاج (المجموعة الثانية)
UPDATE employees e JOIN workshops w ON w.name = 'الفيلتاج'
SET e.workshop_id = w.id WHERE e.employee_code IN ('311','313','349','382');

-- 13. ورشة البراغي
UPDATE employees e JOIN workshops w ON w.name = 'البراغي'
SET e.workshop_id = w.id WHERE e.employee_code IN ('18','159','239','246','325','397');

-- =====================================================================
-- تحقق من النتائج
-- =====================================================================
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN (
  '24',
  '156','194','315',
  '20','31','65','87','97','100','101','103','152','290',
  '91','129',
  '28','57','88','154','186','202','278','292','330','334','340','344','351','379','383',
  '142','203','287',
  '78','125','204','359','398',
  '22','105','158','179','191','258','263',
  '143',
  '71','262','276','366',
  '297','309','337','369',
  '311','313','349','382',
  '18','159','239','246','325','397'
)
ORDER BY w.name, CAST(e.employee_code AS UNSIGNED);
