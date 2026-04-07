-- حذف جميع الموظفين وسجلات الحضور
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE attendance_records;
TRUNCATE TABLE employees;
SET FOREIGN_KEY_CHECKS = 1;

-- تحقق
SELECT COUNT(*) AS 'الموظفون المتبقون' FROM employees;
SELECT COUNT(*) AS 'سجلات الحضور المتبقة' FROM attendance_records;
