-- =====================================================================
-- تعيين موظفي التصميم لورشتهم
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_design.sql
-- =====================================================================

-- إنشاء ورشة التصميم إن لم تكن موجودة
INSERT INTO workshops (id, name, description)
SELECT UUID(), 'التصميم', 'قسم التصميم'
WHERE NOT EXISTS (SELECT 1 FROM workshops WHERE name = 'التصميم');

-- تعيين الموظف لورشة التصميم
UPDATE employees e
JOIN workshops w ON w.name = 'التصميم'
SET e.workshop_id = w.id
WHERE e.employee_code = '43';

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code = '43';
