-- محاولة إصلاح ترميز الأسماء المكسورة في employees من users
-- الطريقة: قراءة الاسم من users بالترميز الصحيح

UPDATE employees e
JOIN users u
  ON e.card_number COLLATE utf8mb4_general_ci = u.card_no COLLATE utf8mb4_general_ci
SET e.name = CONVERT(BINARY CONVERT(u.name USING latin1) USING utf8mb4)
WHERE e.name LIKE '%?%'
  AND u.name LIKE '%?%'
  AND CONVERT(BINARY CONVERT(u.name USING latin1) USING utf8mb4) NOT LIKE '%?%';

-- تحقق
SELECT COUNT(*) AS 'لا يزال مكسور' FROM employees WHERE name LIKE '%?%';
SELECT employee_code, name FROM employees WHERE name LIKE '%?%' LIMIT 10;
