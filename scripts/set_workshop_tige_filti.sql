-- =====================================================================
-- تعيين الموظفين لورشة التيج فيلتي
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_tige_filti.sql
-- =====================================================================

-- تعيين الموظفين لورشة التيج فيلتي (الورشة موجودة مسبقاً)
UPDATE employees e
JOIN workshops w ON w.name = 'التيج فيلتي'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('144','201','265','353','402','415');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('144','201','265','353','402','415')
ORDER BY CAST(e.employee_code AS UNSIGNED);
