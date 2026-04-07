-- =====================================================================
-- تعيين الموظفين لورشة الصيانة
-- =====================================================================

UPDATE employees e
JOIN workshops w ON w.name = 'الصيانة'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('104','118','137','357');

SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('104','118','137','357')
ORDER BY CAST(e.employee_code AS UNSIGNED);
