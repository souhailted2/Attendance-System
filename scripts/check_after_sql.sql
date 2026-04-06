SET NAMES utf8mb4;

-- التحقق: هل بقي أي TEMP_ أو كودات غريبة؟
SELECT COUNT(*) AS temp_remaining FROM employees WHERE employee_code LIKE 'TEMP_%';

-- هل كل الأكواد أرقام صحيحة؟
SELECT COUNT(*) AS numeric_codes FROM employees WHERE employee_code REGEXP '^[0-9]+$';

-- الموظفون الذين اسمهم = employee_code (أي لم يُحدَّث الاسم):
SELECT employee_code, name, card_number FROM employees 
WHERE name = employee_code OR name REGEXP '^[0-9]+$'
ORDER BY CAST(employee_code AS UNSIGNED);

-- إجمالي:
SELECT COUNT(*) AS total FROM employees;