-- =====================================================
-- ربط employees بـ users (المصدر الصحيح)
-- المنطق: users.card_no ↔ employees.card_number → تصحيح employee_code + name
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- ===== الخطوة 1: تصحيح employee_code و name من جدول users =====
-- نربط بين الجدولين عبر رقم البطاقة (card_no = card_number)

UPDATE employees e
JOIN users u ON e.card_number = u.card_no AND u.employee_id IS NOT NULL
SET 
  e.employee_code = u.employee_id,
  e.name = CASE 
    WHEN u.name IS NOT NULL AND u.name != '' AND u.name != 'غير معرف'
    THEN u.name
    ELSE e.name
  END;

-- ===== الخطوة 2: إصلاح سجلات الحضور المكررة =====
-- بعد تغيير employee_code قد يكون هناك موظفان بنفس الكود الجديد
-- (واحد كان صحيحاً والآخر ghost تم تعديله)

-- نقل الحضور من الـ ghost إلى الأصيل إذا أصبح الكود مكرراً
-- أولاً: إيجاد المكررات وحلها
DROP TEMPORARY TABLE IF EXISTS tmp_dup_codes;
CREATE TEMPORARY TABLE tmp_dup_codes AS
SELECT employee_code, MIN(id) AS keep_id, MAX(id) AS ghost_id
FROM employees
GROUP BY employee_code
HAVING COUNT(*) > 1;

-- حذف تعارضات الحضور أولاً
DELETE FROM attendance_records 
WHERE employee_id IN (SELECT ghost_id FROM tmp_dup_codes)
  AND `date` IN (
    SELECT ar2.`date` 
    FROM attendance_records ar2
    JOIN tmp_dup_codes d ON ar2.employee_id = d.keep_id
  );

-- نقل بقية الحضور
UPDATE attendance_records ar
JOIN tmp_dup_codes d ON ar.employee_id = d.ghost_id
SET ar.employee_id = d.keep_id;

-- حذف الـ ghosts
DELETE FROM employees WHERE id IN (SELECT ghost_id FROM tmp_dup_codes);

DROP TEMPORARY TABLE IF EXISTS tmp_dup_codes;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- ===== تحقق =====
SELECT COUNT(*) AS 'مكررات' FROM (SELECT employee_code, COUNT(*) c FROM employees GROUP BY employee_code HAVING c > 1) x;
SELECT COUNT(*) AS 'الإجمالي للموظفين' FROM employees;
SELECT COUNT(*) AS 'موظف بكود خاطئ (لا يوجد في users)' 
FROM employees e 
LEFT JOIN users u ON e.employee_code = u.employee_id
WHERE u.id IS NULL AND e.employee_code REGEXP '^[0-9]+$';
-- عينة 5 موظفين للتحقق
SELECT e.employee_code, e.name, e.card_number, u.employee_id, u.card_no, u.name AS users_name
FROM employees e
LEFT JOIN users u ON e.card_number = u.card_no
LIMIT 5;
