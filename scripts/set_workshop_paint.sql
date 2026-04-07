-- =====================================================================
-- تعيين الموظفين لورشة الدهن
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_paint.sql
-- =====================================================================

-- تعيين الموظفين لورشة الدهن (الورشة موجودة مسبقاً)
UPDATE employees e
JOIN workshops w ON w.name = 'الدهن'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('21','39','40','107','216','236','242','251','269','394');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('21','39','40','107','216','236','242','251','269','394')
ORDER BY CAST(e.employee_code AS UNSIGNED);
