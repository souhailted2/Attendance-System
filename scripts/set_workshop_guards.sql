-- =====================================================================
-- تعيين موظفي الحراسة لورشتهم
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_guards.sql
-- =====================================================================

-- إنشاء ورشة الحراس إن لم تكن موجودة
INSERT INTO workshops (id, name, description)
SELECT UUID(), 'الحراس', 'قسم الحراسة والأمن'
WHERE NOT EXISTS (SELECT 1 FROM workshops WHERE name = 'الحراس');

-- تعيين الموظفين لورشة الحراس
UPDATE employees e
JOIN workshops w ON w.name = 'الحراس'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('38','69','167');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('38','69','167')
ORDER BY CAST(e.employee_code AS UNSIGNED);
