-- ═══════════════════════════════════════════════════════════════════
-- تصحيح تواريخ الحضور الخاطئة: 2025 → 2026
-- السبب: ساعة جهاز البصمة كانت تُظهر 2025 بدل 2026
-- الإزاحة: +1 سنة - 1 يوم  (6/4/2025 في الجهاز = 5/4/2026 الحقيقي)
-- ═══════════════════════════════════════════════════════════════════

-- 1. عرض السجلات الخاطئة قبل التعديل
SELECT 
  COUNT(*) AS 'سجلات خاطئة بسنة 2025',
  MIN(date) AS 'أقدم تاريخ',
  MAX(date) AS 'أحدث تاريخ'
FROM attendance_records
WHERE YEAR(date) = 2025;

-- 2. تصحيح التواريخ: +1 سنة ثم -1 يوم
UPDATE attendance_records
SET date = DATE_SUB(DATE_ADD(date, INTERVAL 1 YEAR), INTERVAL 1 DAY)
WHERE YEAR(date) = 2025;

-- 3. تحقق بعد التعديل
SELECT 
  COUNT(*) AS 'تم تصحيحها',
  MIN(date) AS 'أقدم تاريخ',
  MAX(date) AS 'أحدث تاريخ'
FROM attendance_records
WHERE YEAR(date) = 2026;

-- 4. تأكيد لا يوجد مكررات بعد التصحيح
SELECT employee_id, date, COUNT(*) AS cnt
FROM attendance_records
GROUP BY employee_id, date
HAVING cnt > 1
LIMIT 5;
