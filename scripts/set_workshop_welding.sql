-- =====================================================================
-- تعيين موظفي التلحيم لورشتهم
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_welding.sql
-- =====================================================================

-- تعيين الموظفين لورشة التلحيم (الورشة موجودة مسبقاً)
UPDATE employees e
JOIN workshops w ON w.name = 'التلحيم'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('178','431','436','450');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('178','431','436','450')
ORDER BY CAST(e.employee_code AS UNSIGNED);
