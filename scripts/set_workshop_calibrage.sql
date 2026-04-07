-- =====================================================================
-- تعيين الموظفين لورشة الكاليبراج
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_calibrage.sql
-- =====================================================================

-- تعيين الموظفين لورشة الكاليبراج (الورشة موجودة مسبقاً)
UPDATE employees e
JOIN workshops w ON w.name = 'الكاليبراج'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('60','199','214','232','237','243','302','314','345','356','404');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('60','199','214','232','237','243','302','314','345','356','404')
ORDER BY CAST(e.employee_code AS UNSIGNED);
