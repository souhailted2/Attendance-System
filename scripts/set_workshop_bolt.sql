-- =====================================================================
-- تعيين الموظف لورشة الصامولة
-- =====================================================================

UPDATE employees e
JOIN workshops w ON w.name = 'الصامولة'
SET e.workshop_id = w.id
WHERE e.employee_code = '75';

SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code = '75';
