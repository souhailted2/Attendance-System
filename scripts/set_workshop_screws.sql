-- =====================================================================
-- تعيين الموظفين لورشة البراغي
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_workshop_screws.sql
-- =====================================================================

-- تعيين الموظفين لورشة البراغي (الورشة موجودة مسبقاً)
UPDATE employees e
JOIN workshops w ON w.name = 'البراغي'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('51','52','67','74','86','108','117','119','139','163',
                           '168','170','200','220','253','273','281','326','331',
                           '421','434');

-- تحقق من النتيجة
SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('51','52','67','74','86','108','117','119','139','163',
                           '168','170','200','220','253','273','281','326','331',
                           '421','434')
ORDER BY CAST(e.employee_code AS UNSIGNED);
