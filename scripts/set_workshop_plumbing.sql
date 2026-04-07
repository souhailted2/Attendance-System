-- =====================================================================
-- تعيين الموظفين لورشة الترصيص الصحي
-- =====================================================================

UPDATE employees e
JOIN workshops w ON w.name = 'الترصيص الصحي'
SET e.workshop_id = w.id
WHERE e.employee_code IN ('217','245');

SELECT e.employee_code, e.name, w.name AS workshop
FROM employees e
LEFT JOIN workshops w ON w.id = e.workshop_id
WHERE e.employee_code IN ('217','245')
ORDER BY CAST(e.employee_code AS UNSIGNED);
