-- =====================================================================
-- تعيين موظفي الصيانة الكهربائية لورشتهم
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_electrical.sql
-- =====================================================================

-- تعيين الموظفين لورشة الصيانة الكهربائية (الورشة موجودة مسبقاً)
UPDATE employees e
JOIN workshops w ON w.name = 'الصيانة الكهربائية'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('49','185','295');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('49','185','295')
ORDER BY CAST(e.employee_code AS UNSIGNED);
