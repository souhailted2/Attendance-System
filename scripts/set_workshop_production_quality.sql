-- =====================================================================
-- تعيين الموظفين لورشة مسؤول الانتاج و الجودة
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_production_quality.sql
-- =====================================================================

-- تعيين الموظفين لورشة مسؤول الانتاج و الجودة (الورشة موجودة مسبقاً)
UPDATE employees e
JOIN workshops w ON w.name = 'مسؤول الانتاج و الجودة'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('267','310');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('267','310')
ORDER BY CAST(e.employee_code AS UNSIGNED);
