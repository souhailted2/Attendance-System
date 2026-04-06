-- =====================================================
-- SQL v6: تصحيح employees من users (مع حل تعارض الـ collation)
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- ===== الخطوة 1: تصحيح employee_code + name من users =====
-- نستخدم COLLATE لحل تعارض utf8mb4_uca1400_ai_ci vs utf8mb4_general_ci

UPDATE employees e
JOIN users u 
  ON CONVERT(e.card_number USING utf8mb4) COLLATE utf8mb4_general_ci 
   = CONVERT(u.card_no     USING utf8mb4) COLLATE utf8mb4_general_ci
  AND u.employee_id IS NOT NULL
SET 
  e.employee_code = u.employee_id,
  e.name = CASE 
    WHEN u.name IS NOT NULL AND u.name != '' AND u.name NOT LIKE 'غير معرف%'
    THEN u.name
    ELSE e.name
  END;

-- ===== الخطوة 2: دمج المكررات التي قد تنتج من تعديل employee_code =====

DROP TEMPORARY TABLE IF EXISTS tmp_dup;
CREATE TEMPORARY TABLE tmp_dup AS
SELECT employee_code, MIN(id) AS keep_id, MAX(id) AS drop_id
FROM employees
GROUP BY employee_code
HAVING COUNT(*) > 1;

-- حذف تعارضات الحضور أولاً
DELETE ar FROM attendance_records ar
JOIN tmp_dup d ON ar.employee_id = d.drop_id
WHERE ar.`date` IN (
  SELECT dt FROM (
    SELECT `date` AS dt FROM attendance_records WHERE employee_id IN (SELECT keep_id FROM tmp_dup)
  ) AS sub
);

-- نقل بقية الحضور إلى الموظف الصحيح
UPDATE attendance_records ar
JOIN tmp_dup d ON ar.employee_id = d.drop_id
SET ar.employee_id = d.keep_id;

-- حذف الموظف المكرر
DELETE FROM employees WHERE id IN (SELECT drop_id FROM tmp_dup);

DROP TEMPORARY TABLE IF EXISTS tmp_dup;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- ===== تحقق =====
SELECT COUNT(*) AS 'مكررات' FROM (SELECT employee_code, COUNT(*) c FROM employees GROUP BY employee_code HAVING c > 1) x;
SELECT COUNT(*) AS 'الإجمالي' FROM employees;
SELECT COUNT(*) AS 'تطابقات ناجحة مع users'
FROM employees e
JOIN users u
  ON e.card_number COLLATE utf8mb4_general_ci = u.card_no COLLATE utf8mb4_general_ci
  AND e.employee_code COLLATE utf8mb4_general_ci = u.employee_id COLLATE utf8mb4_general_ci
WHERE u.employee_id IS NOT NULL;
-- عينة 10 للتحقق
SELECT e.employee_code, e.name, u.employee_id AS 'رقم_users', u.name AS 'اسم_users'
FROM employees e
JOIN users u
  ON e.card_number COLLATE utf8mb4_general_ci = u.card_no COLLATE utf8mb4_general_ci
WHERE u.employee_id IS NOT NULL
ORDER BY e.employee_code + 0
LIMIT 10;
