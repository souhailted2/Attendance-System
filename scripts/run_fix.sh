#!/bin/bash
MYSQL="mysql -h127.0.0.1 -uu807293731_insert -pTaher96+++.com u807293731_insert"

echo "=== تشغيل الإصلاح ==="
$MYSQL < ~/attendance/scripts/fix_from_users_table.sql

echo ""
echo "=== النتيجة ==="
$MYSQL << 'SQL'
SELECT COUNT(*) AS 'الإجمالي' FROM employees;
SELECT employee_code, name, card_number
FROM employees
WHERE employee_code IN ('7','34','380')
ORDER BY employee_code+0;
SELECT COUNT(*) AS 'تطابقات ناجحة'
FROM employees e
INNER JOIN users u
  ON e.card_number COLLATE utf8mb4_general_ci = u.card_no COLLATE utf8mb4_general_ci
  AND e.employee_code COLLATE utf8mb4_general_ci = u.employee_id COLLATE utf8mb4_general_ci
WHERE u.employee_id IS NOT NULL;
SELECT e.employee_code, e.name, u.employee_id AS 'رقم_users', u.name AS 'اسم_users'
FROM employees e
INNER JOIN users u
  ON e.card_number COLLATE utf8mb4_general_ci = u.card_no COLLATE utf8mb4_general_ci
WHERE u.employee_id IS NOT NULL
ORDER BY e.employee_code+0
LIMIT 10;
SQL
