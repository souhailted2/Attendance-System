-- =====================================================================
-- تعيين الموظفين لورشة سلك الزنقاج
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_wire_zincage.sql
-- =====================================================================

-- تعيين الموظفين لورشة سلك الزنقاج (الورشة موجودة مسبقاً)
UPDATE employees e
JOIN workshops w ON w.name = 'سلك الزنقاج'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('41','96','284','299','333','352','374','417');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('41','96','284','299','333','352','374','417')
ORDER BY CAST(e.employee_code AS UNSIGNED);
