#!/bin/bash
DB="mysql -h127.0.0.1 -uu807293731_insert -p'Taher96+++.com' u807293731_insert"

echo "=== تشغيل الإصلاح ==="
eval "$DB" < ~/attendance/scripts/fix_from_users_table.sql

echo ""
echo "=== النتيجة ==="
eval "$DB" -e "SELECT COUNT(*) AS total FROM employees;"
eval "$DB" -e "SELECT employee_code, name FROM employees WHERE employee_code IN ('7','34','380') ORDER BY employee_code+0;"
eval "$DB" -e "SELECT COUNT(*) AS matched FROM employees e JOIN users u ON CONVERT(e.card_number USING utf8mb4) COLLATE utf8mb4_general_ci = CONVERT(u.card_no USING utf8mb4) COLLATE utf8mb4_general_ci WHERE e.employee_code = u.employee_id;"
