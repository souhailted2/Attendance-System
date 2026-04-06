-- =====================================================
-- SQL شامل لإصلاح أرقام الموظفين وأسمائهم
-- يعتمد على MDB (Badgenumber) + Excel (اسم الموظف)
-- =====================================================
START TRANSACTION;

-- ===== الخطوة 1: دمج المكررات (USERID ≠ Badgenumber) =====

-- USERID=1 → Badgenumber=261
SET @old_id = (SELECT id FROM employees WHERE employee_code = '1' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '261' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '261' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=2 → Badgenumber=245
SET @old_id = (SELECT id FROM employees WHERE employee_code = '2' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '245' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '245' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=3 → Badgenumber=82
SET @old_id = (SELECT id FROM employees WHERE employee_code = '3' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '82' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '82' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=4 → Badgenumber=122
SET @old_id = (SELECT id FROM employees WHERE employee_code = '4' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '122' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '122' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=5 → Badgenumber=27
SET @old_id = (SELECT id FROM employees WHERE employee_code = '5' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '27' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '27' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=6 → Badgenumber=132
SET @old_id = (SELECT id FROM employees WHERE employee_code = '6' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '132' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '132' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=7 → Badgenumber=121
SET @old_id = (SELECT id FROM employees WHERE employee_code = '7' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '121' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '121' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=8 → Badgenumber=308
SET @old_id = (SELECT id FROM employees WHERE employee_code = '8' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '308' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '308' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=9 → Badgenumber=403
SET @old_id = (SELECT id FROM employees WHERE employee_code = '9' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '403' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '403' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=10 → Badgenumber=188
SET @old_id = (SELECT id FROM employees WHERE employee_code = '10' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '188' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '188' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=11 → Badgenumber=184
SET @old_id = (SELECT id FROM employees WHERE employee_code = '11' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '184' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '184' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=12 → Badgenumber=361
SET @old_id = (SELECT id FROM employees WHERE employee_code = '12' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '361' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '361' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=13 → Badgenumber=138
SET @old_id = (SELECT id FROM employees WHERE employee_code = '13' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '138' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '138' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=14 → Badgenumber=198
SET @old_id = (SELECT id FROM employees WHERE employee_code = '14' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '198' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '198' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=15 → Badgenumber=399
SET @old_id = (SELECT id FROM employees WHERE employee_code = '15' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '399' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '399' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=16 → Badgenumber=46
SET @old_id = (SELECT id FROM employees WHERE employee_code = '16' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '46' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '46' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=17 → Badgenumber=124
SET @old_id = (SELECT id FROM employees WHERE employee_code = '17' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '124' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '124' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=18 → Badgenumber=79
SET @old_id = (SELECT id FROM employees WHERE employee_code = '18' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '79' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '79' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=19 → Badgenumber=405
SET @old_id = (SELECT id FROM employees WHERE employee_code = '19' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '405' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '405' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=20 → Badgenumber=130
SET @old_id = (SELECT id FROM employees WHERE employee_code = '20' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '130' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '130' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=21 → Badgenumber=35
SET @old_id = (SELECT id FROM employees WHERE employee_code = '21' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '35' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '35' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=22 → Badgenumber=83
SET @old_id = (SELECT id FROM employees WHERE employee_code = '22' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '83' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '83' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=23 → Badgenumber=212
SET @old_id = (SELECT id FROM employees WHERE employee_code = '23' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '212' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '212' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=24 → Badgenumber=81
SET @old_id = (SELECT id FROM employees WHERE employee_code = '24' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '81' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '81' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=25 → Badgenumber=375
SET @old_id = (SELECT id FROM employees WHERE employee_code = '25' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '375' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '375' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=26 → Badgenumber=352
SET @old_id = (SELECT id FROM employees WHERE employee_code = '26' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '352' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '352' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=27 → Badgenumber=270
SET @old_id = (SELECT id FROM employees WHERE employee_code = '27' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '270' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '270' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=28 → Badgenumber=389
SET @old_id = (SELECT id FROM employees WHERE employee_code = '28' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '389' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '389' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=29 → Badgenumber=348
SET @old_id = (SELECT id FROM employees WHERE employee_code = '29' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '348' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '348' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=30 → Badgenumber=1
SET @old_id = (SELECT id FROM employees WHERE employee_code = '30' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '1' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '1' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=31 → Badgenumber=2
SET @old_id = (SELECT id FROM employees WHERE employee_code = '31' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '2' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '2' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=32 → Badgenumber=4
SET @old_id = (SELECT id FROM employees WHERE employee_code = '32' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '4' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '4' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=33 → Badgenumber=6
SET @old_id = (SELECT id FROM employees WHERE employee_code = '33' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '6' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '6' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=34 → Badgenumber=7
SET @old_id = (SELECT id FROM employees WHERE employee_code = '34' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '7' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '7' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=35 → Badgenumber=8
SET @old_id = (SELECT id FROM employees WHERE employee_code = '35' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '8' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '8' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=36 → Badgenumber=10
SET @old_id = (SELECT id FROM employees WHERE employee_code = '36' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '10' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '10' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=37 → Badgenumber=11
SET @old_id = (SELECT id FROM employees WHERE employee_code = '37' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '11' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '11' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=38 → Badgenumber=12
SET @old_id = (SELECT id FROM employees WHERE employee_code = '38' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '12' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '12' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=39 → Badgenumber=13
SET @old_id = (SELECT id FROM employees WHERE employee_code = '39' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '13' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '13' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=40 → Badgenumber=15
SET @old_id = (SELECT id FROM employees WHERE employee_code = '40' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '15' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '15' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=41 → Badgenumber=18
SET @old_id = (SELECT id FROM employees WHERE employee_code = '41' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '18' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '18' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=42 → Badgenumber=20
SET @old_id = (SELECT id FROM employees WHERE employee_code = '42' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '20' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '20' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=43 → Badgenumber=21
SET @old_id = (SELECT id FROM employees WHERE employee_code = '43' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '21' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '21' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=44 → Badgenumber=22
SET @old_id = (SELECT id FROM employees WHERE employee_code = '44' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '22' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '22' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=45 → Badgenumber=24
SET @old_id = (SELECT id FROM employees WHERE employee_code = '45' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '24' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '24' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=46 → Badgenumber=25
SET @old_id = (SELECT id FROM employees WHERE employee_code = '46' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '25' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '25' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=47 → Badgenumber=26
SET @old_id = (SELECT id FROM employees WHERE employee_code = '47' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '26' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '26' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=48 → Badgenumber=28
SET @old_id = (SELECT id FROM employees WHERE employee_code = '48' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '28' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '28' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=49 → Badgenumber=30
SET @old_id = (SELECT id FROM employees WHERE employee_code = '49' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '30' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '30' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=50 → Badgenumber=31
SET @old_id = (SELECT id FROM employees WHERE employee_code = '50' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '31' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '31' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=51 → Badgenumber=32
SET @old_id = (SELECT id FROM employees WHERE employee_code = '51' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '32' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '32' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=52 → Badgenumber=36
SET @old_id = (SELECT id FROM employees WHERE employee_code = '52' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '36' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '36' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=53 → Badgenumber=37
SET @old_id = (SELECT id FROM employees WHERE employee_code = '53' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '37' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '37' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=54 → Badgenumber=38
SET @old_id = (SELECT id FROM employees WHERE employee_code = '54' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '38' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '38' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=55 → Badgenumber=39
SET @old_id = (SELECT id FROM employees WHERE employee_code = '55' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '39' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '39' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=56 → Badgenumber=40
SET @old_id = (SELECT id FROM employees WHERE employee_code = '56' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '40' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '40' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=57 → Badgenumber=41
SET @old_id = (SELECT id FROM employees WHERE employee_code = '57' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '41' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '41' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=58 → Badgenumber=43
SET @old_id = (SELECT id FROM employees WHERE employee_code = '58' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '43' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '43' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=59 → Badgenumber=44
SET @old_id = (SELECT id FROM employees WHERE employee_code = '59' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '44' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '44' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=60 → Badgenumber=45
SET @old_id = (SELECT id FROM employees WHERE employee_code = '60' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '45' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '45' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=61 → Badgenumber=47
SET @old_id = (SELECT id FROM employees WHERE employee_code = '61' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '47' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '47' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=62 → Badgenumber=48
SET @old_id = (SELECT id FROM employees WHERE employee_code = '62' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '48' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '48' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=63 → Badgenumber=49
SET @old_id = (SELECT id FROM employees WHERE employee_code = '63' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '49' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '49' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=64 → Badgenumber=51
SET @old_id = (SELECT id FROM employees WHERE employee_code = '64' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '51' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '51' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=65 → Badgenumber=52
SET @old_id = (SELECT id FROM employees WHERE employee_code = '65' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '52' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '52' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=66 → Badgenumber=53
SET @old_id = (SELECT id FROM employees WHERE employee_code = '66' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '53' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '53' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=67 → Badgenumber=54
SET @old_id = (SELECT id FROM employees WHERE employee_code = '67' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '54' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '54' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=68 → Badgenumber=55
SET @old_id = (SELECT id FROM employees WHERE employee_code = '68' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '55' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '55' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=69 → Badgenumber=57
SET @old_id = (SELECT id FROM employees WHERE employee_code = '69' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '57' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '57' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=70 → Badgenumber=58
SET @old_id = (SELECT id FROM employees WHERE employee_code = '70' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '58' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '58' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=71 → Badgenumber=59
SET @old_id = (SELECT id FROM employees WHERE employee_code = '71' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '59' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '59' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=72 → Badgenumber=60
SET @old_id = (SELECT id FROM employees WHERE employee_code = '72' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '60' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '60' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=73 → Badgenumber=61
SET @old_id = (SELECT id FROM employees WHERE employee_code = '73' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '61' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '61' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=74 → Badgenumber=62
SET @old_id = (SELECT id FROM employees WHERE employee_code = '74' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '62' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '62' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=75 → Badgenumber=63
SET @old_id = (SELECT id FROM employees WHERE employee_code = '75' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '63' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '63' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=76 → Badgenumber=64
SET @old_id = (SELECT id FROM employees WHERE employee_code = '76' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '64' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '64' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=77 → Badgenumber=65
SET @old_id = (SELECT id FROM employees WHERE employee_code = '77' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '65' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '65' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=78 → Badgenumber=67
SET @old_id = (SELECT id FROM employees WHERE employee_code = '78' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '67' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '67' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=79 → Badgenumber=68
SET @old_id = (SELECT id FROM employees WHERE employee_code = '79' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '68' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '68' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=80 → Badgenumber=69
SET @old_id = (SELECT id FROM employees WHERE employee_code = '80' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '69' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '69' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=81 → Badgenumber=70
SET @old_id = (SELECT id FROM employees WHERE employee_code = '81' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '70' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '70' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=82 → Badgenumber=71
SET @old_id = (SELECT id FROM employees WHERE employee_code = '82' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '71' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '71' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=83 → Badgenumber=72
SET @old_id = (SELECT id FROM employees WHERE employee_code = '83' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '72' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '72' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=84 → Badgenumber=73
SET @old_id = (SELECT id FROM employees WHERE employee_code = '84' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '73' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '73' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=85 → Badgenumber=74
SET @old_id = (SELECT id FROM employees WHERE employee_code = '85' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '74' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '74' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=86 → Badgenumber=75
SET @old_id = (SELECT id FROM employees WHERE employee_code = '86' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '75' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '75' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=87 → Badgenumber=76
SET @old_id = (SELECT id FROM employees WHERE employee_code = '87' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '76' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '76' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=88 → Badgenumber=78
SET @old_id = (SELECT id FROM employees WHERE employee_code = '88' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '78' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '78' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=89 → Badgenumber=86
SET @old_id = (SELECT id FROM employees WHERE employee_code = '89' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '86' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '86' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=90 → Badgenumber=87
SET @old_id = (SELECT id FROM employees WHERE employee_code = '90' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '87' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '87' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=91 → Badgenumber=88
SET @old_id = (SELECT id FROM employees WHERE employee_code = '91' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '88' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '88' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=92 → Badgenumber=91
SET @old_id = (SELECT id FROM employees WHERE employee_code = '92' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '91' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '91' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=93 → Badgenumber=92
SET @old_id = (SELECT id FROM employees WHERE employee_code = '93' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '92' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '92' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=102 → Badgenumber=103
SET @old_id = (SELECT id FROM employees WHERE employee_code = '102' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '103' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '103' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=103 → Badgenumber=104
SET @old_id = (SELECT id FROM employees WHERE employee_code = '103' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '104' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '104' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=104 → Badgenumber=105
SET @old_id = (SELECT id FROM employees WHERE employee_code = '104' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '105' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '105' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=105 → Badgenumber=107
SET @old_id = (SELECT id FROM employees WHERE employee_code = '105' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '107' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '107' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=106 → Badgenumber=108
SET @old_id = (SELECT id FROM employees WHERE employee_code = '106' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '108' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '108' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=107 → Badgenumber=109
SET @old_id = (SELECT id FROM employees WHERE employee_code = '107' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '109' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '109' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=108 → Badgenumber=110
SET @old_id = (SELECT id FROM employees WHERE employee_code = '108' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '110' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '110' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=109 → Badgenumber=112
SET @old_id = (SELECT id FROM employees WHERE employee_code = '109' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '112' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '112' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=110 → Badgenumber=113
SET @old_id = (SELECT id FROM employees WHERE employee_code = '110' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '113' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '113' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=111 → Badgenumber=115
SET @old_id = (SELECT id FROM employees WHERE employee_code = '111' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '115' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '115' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=112 → Badgenumber=117
SET @old_id = (SELECT id FROM employees WHERE employee_code = '112' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '117' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '117' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=113 → Badgenumber=118
SET @old_id = (SELECT id FROM employees WHERE employee_code = '113' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '118' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '118' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=114 → Badgenumber=119
SET @old_id = (SELECT id FROM employees WHERE employee_code = '114' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '119' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '119' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=115 → Badgenumber=125
SET @old_id = (SELECT id FROM employees WHERE employee_code = '115' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '125' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '125' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=116 → Badgenumber=126
SET @old_id = (SELECT id FROM employees WHERE employee_code = '116' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '126' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '126' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=117 → Badgenumber=129
SET @old_id = (SELECT id FROM employees WHERE employee_code = '117' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '129' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '129' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=118 → Badgenumber=133
SET @old_id = (SELECT id FROM employees WHERE employee_code = '118' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '133' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '133' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=119 → Badgenumber=134
SET @old_id = (SELECT id FROM employees WHERE employee_code = '119' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '134' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '134' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=120 → Badgenumber=135
SET @old_id = (SELECT id FROM employees WHERE employee_code = '120' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '135' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '135' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=121 → Badgenumber=137
SET @old_id = (SELECT id FROM employees WHERE employee_code = '121' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '137' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '137' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=122 → Badgenumber=139
SET @old_id = (SELECT id FROM employees WHERE employee_code = '122' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '139' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '139' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=123 → Badgenumber=142
SET @old_id = (SELECT id FROM employees WHERE employee_code = '123' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '142' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '142' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=124 → Badgenumber=143
SET @old_id = (SELECT id FROM employees WHERE employee_code = '124' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '143' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '143' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=125 → Badgenumber=144
SET @old_id = (SELECT id FROM employees WHERE employee_code = '125' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '144' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '144' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=126 → Badgenumber=145
SET @old_id = (SELECT id FROM employees WHERE employee_code = '126' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '145' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '145' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=127 → Badgenumber=147
SET @old_id = (SELECT id FROM employees WHERE employee_code = '127' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '147' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '147' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=128 → Badgenumber=148
SET @old_id = (SELECT id FROM employees WHERE employee_code = '128' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '148' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '148' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=129 → Badgenumber=151
SET @old_id = (SELECT id FROM employees WHERE employee_code = '129' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '151' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '151' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=130 → Badgenumber=152
SET @old_id = (SELECT id FROM employees WHERE employee_code = '130' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '152' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '152' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=131 → Badgenumber=154
SET @old_id = (SELECT id FROM employees WHERE employee_code = '131' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '154' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '154' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=132 → Badgenumber=156
SET @old_id = (SELECT id FROM employees WHERE employee_code = '132' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '156' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '156' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=133 → Badgenumber=158
SET @old_id = (SELECT id FROM employees WHERE employee_code = '133' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '158' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '158' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=134 → Badgenumber=159
SET @old_id = (SELECT id FROM employees WHERE employee_code = '134' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '159' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '159' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=135 → Badgenumber=162
SET @old_id = (SELECT id FROM employees WHERE employee_code = '135' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '162' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '162' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=136 → Badgenumber=163
SET @old_id = (SELECT id FROM employees WHERE employee_code = '136' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '163' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '163' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=137 → Badgenumber=164
SET @old_id = (SELECT id FROM employees WHERE employee_code = '137' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '164' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '164' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=138 → Badgenumber=165
SET @old_id = (SELECT id FROM employees WHERE employee_code = '138' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '165' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '165' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=139 → Badgenumber=166
SET @old_id = (SELECT id FROM employees WHERE employee_code = '139' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '166' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '166' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=140 → Badgenumber=168
SET @old_id = (SELECT id FROM employees WHERE employee_code = '140' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '168' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '168' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=141 → Badgenumber=169
SET @old_id = (SELECT id FROM employees WHERE employee_code = '141' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '169' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '169' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=142 → Badgenumber=170
SET @old_id = (SELECT id FROM employees WHERE employee_code = '142' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '170' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '170' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=143 → Badgenumber=171
SET @old_id = (SELECT id FROM employees WHERE employee_code = '143' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '171' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '171' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=144 → Badgenumber=172
SET @old_id = (SELECT id FROM employees WHERE employee_code = '144' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '172' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '172' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=145 → Badgenumber=178
SET @old_id = (SELECT id FROM employees WHERE employee_code = '145' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '178' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '178' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=146 → Badgenumber=179
SET @old_id = (SELECT id FROM employees WHERE employee_code = '146' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '179' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '179' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=147 → Badgenumber=180
SET @old_id = (SELECT id FROM employees WHERE employee_code = '147' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '180' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '180' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=148 → Badgenumber=182
SET @old_id = (SELECT id FROM employees WHERE employee_code = '148' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '182' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '182' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=149 → Badgenumber=183
SET @old_id = (SELECT id FROM employees WHERE employee_code = '149' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '183' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '183' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=150 → Badgenumber=185
SET @old_id = (SELECT id FROM employees WHERE employee_code = '150' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '185' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '185' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=151 → Badgenumber=186
SET @old_id = (SELECT id FROM employees WHERE employee_code = '151' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '186' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '186' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=152 → Badgenumber=190
SET @old_id = (SELECT id FROM employees WHERE employee_code = '152' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '190' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '190' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=153 → Badgenumber=191
SET @old_id = (SELECT id FROM employees WHERE employee_code = '153' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '191' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '191' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=154 → Badgenumber=192
SET @old_id = (SELECT id FROM employees WHERE employee_code = '154' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '192' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '192' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=155 → Badgenumber=194
SET @old_id = (SELECT id FROM employees WHERE employee_code = '155' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '194' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '194' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=156 → Badgenumber=195
SET @old_id = (SELECT id FROM employees WHERE employee_code = '156' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '195' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '195' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=157 → Badgenumber=197
SET @old_id = (SELECT id FROM employees WHERE employee_code = '157' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '197' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '197' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=158 → Badgenumber=199
SET @old_id = (SELECT id FROM employees WHERE employee_code = '158' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '199' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '199' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=159 → Badgenumber=200
SET @old_id = (SELECT id FROM employees WHERE employee_code = '159' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '200' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '200' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=160 → Badgenumber=201
SET @old_id = (SELECT id FROM employees WHERE employee_code = '160' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '201' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '201' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=161 → Badgenumber=202
SET @old_id = (SELECT id FROM employees WHERE employee_code = '161' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '202' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '202' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=162 → Badgenumber=203
SET @old_id = (SELECT id FROM employees WHERE employee_code = '162' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '203' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '203' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=163 → Badgenumber=204
SET @old_id = (SELECT id FROM employees WHERE employee_code = '163' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '204' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '204' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=164 → Badgenumber=206
SET @old_id = (SELECT id FROM employees WHERE employee_code = '164' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '206' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '206' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=165 → Badgenumber=208
SET @old_id = (SELECT id FROM employees WHERE employee_code = '165' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '208' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '208' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=166 → Badgenumber=210
SET @old_id = (SELECT id FROM employees WHERE employee_code = '166' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '210' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '210' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=167 → Badgenumber=211
SET @old_id = (SELECT id FROM employees WHERE employee_code = '167' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '211' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '211' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=168 → Badgenumber=214
SET @old_id = (SELECT id FROM employees WHERE employee_code = '168' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '214' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '214' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=169 → Badgenumber=215
SET @old_id = (SELECT id FROM employees WHERE employee_code = '169' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '215' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '215' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=170 → Badgenumber=216
SET @old_id = (SELECT id FROM employees WHERE employee_code = '170' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '216' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '216' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=171 → Badgenumber=217
SET @old_id = (SELECT id FROM employees WHERE employee_code = '171' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '217' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '217' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=172 → Badgenumber=219
SET @old_id = (SELECT id FROM employees WHERE employee_code = '172' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '219' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '219' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=173 → Badgenumber=220
SET @old_id = (SELECT id FROM employees WHERE employee_code = '173' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '220' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '220' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=174 → Badgenumber=224
SET @old_id = (SELECT id FROM employees WHERE employee_code = '174' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '224' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '224' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=175 → Badgenumber=227
SET @old_id = (SELECT id FROM employees WHERE employee_code = '175' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '227' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '227' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=176 → Badgenumber=228
SET @old_id = (SELECT id FROM employees WHERE employee_code = '176' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '228' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '228' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=177 → Badgenumber=229
SET @old_id = (SELECT id FROM employees WHERE employee_code = '177' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '229' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '229' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=178 → Badgenumber=232
SET @old_id = (SELECT id FROM employees WHERE employee_code = '178' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '232' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '232' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=179 → Badgenumber=234
SET @old_id = (SELECT id FROM employees WHERE employee_code = '179' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '234' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '234' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=180 → Badgenumber=236
SET @old_id = (SELECT id FROM employees WHERE employee_code = '180' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '236' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '236' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=181 → Badgenumber=237
SET @old_id = (SELECT id FROM employees WHERE employee_code = '181' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '237' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '237' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=182 → Badgenumber=239
SET @old_id = (SELECT id FROM employees WHERE employee_code = '182' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '239' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '239' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=183 → Badgenumber=242
SET @old_id = (SELECT id FROM employees WHERE employee_code = '183' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '242' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '242' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=184 → Badgenumber=243
SET @old_id = (SELECT id FROM employees WHERE employee_code = '184' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '243' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '243' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=185 → Badgenumber=246
SET @old_id = (SELECT id FROM employees WHERE employee_code = '185' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '246' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '246' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=186 → Badgenumber=247
SET @old_id = (SELECT id FROM employees WHERE employee_code = '186' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '247' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '247' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=187 → Badgenumber=248
SET @old_id = (SELECT id FROM employees WHERE employee_code = '187' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '248' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '248' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=188 → Badgenumber=249
SET @old_id = (SELECT id FROM employees WHERE employee_code = '188' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '249' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '249' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=189 → Badgenumber=250
SET @old_id = (SELECT id FROM employees WHERE employee_code = '189' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '250' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '250' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=190 → Badgenumber=251
SET @old_id = (SELECT id FROM employees WHERE employee_code = '190' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '251' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '251' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=191 → Badgenumber=253
SET @old_id = (SELECT id FROM employees WHERE employee_code = '191' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '253' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '253' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=192 → Badgenumber=254
SET @old_id = (SELECT id FROM employees WHERE employee_code = '192' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '254' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '254' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=193 → Badgenumber=255
SET @old_id = (SELECT id FROM employees WHERE employee_code = '193' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '255' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '255' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=194 → Badgenumber=258
SET @old_id = (SELECT id FROM employees WHERE employee_code = '194' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '258' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '258' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=195 → Badgenumber=262
SET @old_id = (SELECT id FROM employees WHERE employee_code = '195' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '262' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '262' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=196 → Badgenumber=263
SET @old_id = (SELECT id FROM employees WHERE employee_code = '196' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '263' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '263' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=197 → Badgenumber=265
SET @old_id = (SELECT id FROM employees WHERE employee_code = '197' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '265' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '265' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=198 → Badgenumber=266
SET @old_id = (SELECT id FROM employees WHERE employee_code = '198' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '266' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '266' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=199 → Badgenumber=267
SET @old_id = (SELECT id FROM employees WHERE employee_code = '199' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '267' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '267' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=200 → Badgenumber=269
SET @old_id = (SELECT id FROM employees WHERE employee_code = '200' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '269' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '269' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=201 → Badgenumber=271
SET @old_id = (SELECT id FROM employees WHERE employee_code = '201' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '271' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '271' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=202 → Badgenumber=273
SET @old_id = (SELECT id FROM employees WHERE employee_code = '202' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '273' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '273' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=203 → Badgenumber=274
SET @old_id = (SELECT id FROM employees WHERE employee_code = '203' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '274' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '274' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=204 → Badgenumber=275
SET @old_id = (SELECT id FROM employees WHERE employee_code = '204' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '275' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '275' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=205 → Badgenumber=276
SET @old_id = (SELECT id FROM employees WHERE employee_code = '205' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '276' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '276' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=206 → Badgenumber=278
SET @old_id = (SELECT id FROM employees WHERE employee_code = '206' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '278' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '278' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=207 → Badgenumber=279
SET @old_id = (SELECT id FROM employees WHERE employee_code = '207' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '279' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '279' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=208 → Badgenumber=281
SET @old_id = (SELECT id FROM employees WHERE employee_code = '208' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '281' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '281' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=209 → Badgenumber=284
SET @old_id = (SELECT id FROM employees WHERE employee_code = '209' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '284' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '284' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=210 → Badgenumber=286
SET @old_id = (SELECT id FROM employees WHERE employee_code = '210' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '286' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '286' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=211 → Badgenumber=287
SET @old_id = (SELECT id FROM employees WHERE employee_code = '211' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '287' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '287' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=212 → Badgenumber=289
SET @old_id = (SELECT id FROM employees WHERE employee_code = '212' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '289' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '289' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=213 → Badgenumber=290
SET @old_id = (SELECT id FROM employees WHERE employee_code = '213' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '290' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '290' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=214 → Badgenumber=292
SET @old_id = (SELECT id FROM employees WHERE employee_code = '214' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '292' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '292' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=215 → Badgenumber=295
SET @old_id = (SELECT id FROM employees WHERE employee_code = '215' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '295' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '295' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=216 → Badgenumber=296
SET @old_id = (SELECT id FROM employees WHERE employee_code = '216' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '296' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '296' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=217 → Badgenumber=297
SET @old_id = (SELECT id FROM employees WHERE employee_code = '217' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '297' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '297' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=218 → Badgenumber=298
SET @old_id = (SELECT id FROM employees WHERE employee_code = '218' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '298' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '298' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=219 → Badgenumber=299
SET @old_id = (SELECT id FROM employees WHERE employee_code = '219' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '299' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '299' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=220 → Badgenumber=300
SET @old_id = (SELECT id FROM employees WHERE employee_code = '220' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '300' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '300' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=221 → Badgenumber=302
SET @old_id = (SELECT id FROM employees WHERE employee_code = '221' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '302' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '302' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=222 → Badgenumber=306
SET @old_id = (SELECT id FROM employees WHERE employee_code = '222' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '306' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '306' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=223 → Badgenumber=307
SET @old_id = (SELECT id FROM employees WHERE employee_code = '223' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '307' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '307' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=224 → Badgenumber=309
SET @old_id = (SELECT id FROM employees WHERE employee_code = '224' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '309' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '309' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=225 → Badgenumber=310
SET @old_id = (SELECT id FROM employees WHERE employee_code = '225' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '310' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '310' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=226 → Badgenumber=311
SET @old_id = (SELECT id FROM employees WHERE employee_code = '226' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '311' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '311' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=227 → Badgenumber=312
SET @old_id = (SELECT id FROM employees WHERE employee_code = '227' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '312' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '312' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=228 → Badgenumber=314
SET @old_id = (SELECT id FROM employees WHERE employee_code = '228' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '314' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '314' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=229 → Badgenumber=315
SET @old_id = (SELECT id FROM employees WHERE employee_code = '229' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '315' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '315' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=230 → Badgenumber=318
SET @old_id = (SELECT id FROM employees WHERE employee_code = '230' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '318' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '318' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=231 → Badgenumber=319
SET @old_id = (SELECT id FROM employees WHERE employee_code = '231' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '319' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '319' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=232 → Badgenumber=321
SET @old_id = (SELECT id FROM employees WHERE employee_code = '232' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '321' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '321' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=233 → Badgenumber=322
SET @old_id = (SELECT id FROM employees WHERE employee_code = '233' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '322' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '322' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=234 → Badgenumber=324
SET @old_id = (SELECT id FROM employees WHERE employee_code = '234' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '324' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '324' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=235 → Badgenumber=325
SET @old_id = (SELECT id FROM employees WHERE employee_code = '235' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '325' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '325' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=236 → Badgenumber=329
SET @old_id = (SELECT id FROM employees WHERE employee_code = '236' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '329' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '329' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=237 → Badgenumber=330
SET @old_id = (SELECT id FROM employees WHERE employee_code = '237' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '330' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '330' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=238 → Badgenumber=331
SET @old_id = (SELECT id FROM employees WHERE employee_code = '238' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '331' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '331' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=239 → Badgenumber=333
SET @old_id = (SELECT id FROM employees WHERE employee_code = '239' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '333' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '333' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=240 → Badgenumber=334
SET @old_id = (SELECT id FROM employees WHERE employee_code = '240' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '334' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '334' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=241 → Badgenumber=336
SET @old_id = (SELECT id FROM employees WHERE employee_code = '241' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '336' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '336' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=242 → Badgenumber=337
SET @old_id = (SELECT id FROM employees WHERE employee_code = '242' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '337' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '337' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=243 → Badgenumber=339
SET @old_id = (SELECT id FROM employees WHERE employee_code = '243' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '339' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '339' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=244 → Badgenumber=340
SET @old_id = (SELECT id FROM employees WHERE employee_code = '244' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '340' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '340' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=245 → Badgenumber=341
SET @old_id = (SELECT id FROM employees WHERE employee_code = '245' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '341' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '341' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=246 → Badgenumber=344
SET @old_id = (SELECT id FROM employees WHERE employee_code = '246' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '344' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '344' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=247 → Badgenumber=345
SET @old_id = (SELECT id FROM employees WHERE employee_code = '247' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '345' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '345' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=249 → Badgenumber=349
SET @old_id = (SELECT id FROM employees WHERE employee_code = '249' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '349' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '349' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=250 → Badgenumber=351
SET @old_id = (SELECT id FROM employees WHERE employee_code = '250' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '351' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '351' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=251 → Badgenumber=353
SET @old_id = (SELECT id FROM employees WHERE employee_code = '251' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '353' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '353' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=252 → Badgenumber=356
SET @old_id = (SELECT id FROM employees WHERE employee_code = '252' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '356' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '356' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=253 → Badgenumber=357
SET @old_id = (SELECT id FROM employees WHERE employee_code = '253' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '357' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '357' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=254 → Badgenumber=358
SET @old_id = (SELECT id FROM employees WHERE employee_code = '254' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '358' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '358' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=255 → Badgenumber=359
SET @old_id = (SELECT id FROM employees WHERE employee_code = '255' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '359' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '359' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=256 → Badgenumber=365
SET @old_id = (SELECT id FROM employees WHERE employee_code = '256' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '365' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '365' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=257 → Badgenumber=366
SET @old_id = (SELECT id FROM employees WHERE employee_code = '257' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '366' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '366' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=258 → Badgenumber=368
SET @old_id = (SELECT id FROM employees WHERE employee_code = '258' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '368' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '368' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=259 → Badgenumber=369
SET @old_id = (SELECT id FROM employees WHERE employee_code = '259' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '369' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '369' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=260 → Badgenumber=371
SET @old_id = (SELECT id FROM employees WHERE employee_code = '260' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '371' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '371' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=261 → Badgenumber=372
SET @old_id = (SELECT id FROM employees WHERE employee_code = '261' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '372' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '372' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=262 → Badgenumber=374
SET @old_id = (SELECT id FROM employees WHERE employee_code = '262' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '374' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '374' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=263 → Badgenumber=376
SET @old_id = (SELECT id FROM employees WHERE employee_code = '263' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '376' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '376' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=264 → Badgenumber=378
SET @old_id = (SELECT id FROM employees WHERE employee_code = '264' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '378' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '378' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=265 → Badgenumber=379
SET @old_id = (SELECT id FROM employees WHERE employee_code = '265' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '379' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '379' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=266 → Badgenumber=380
SET @old_id = (SELECT id FROM employees WHERE employee_code = '266' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '380' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '380' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=267 → Badgenumber=381
SET @old_id = (SELECT id FROM employees WHERE employee_code = '267' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '381' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '381' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=268 → Badgenumber=382
SET @old_id = (SELECT id FROM employees WHERE employee_code = '268' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '382' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '382' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=269 → Badgenumber=384
SET @old_id = (SELECT id FROM employees WHERE employee_code = '269' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '384' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '384' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=270 → Badgenumber=387
SET @old_id = (SELECT id FROM employees WHERE employee_code = '270' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '387' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '387' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=271 → Badgenumber=388
SET @old_id = (SELECT id FROM employees WHERE employee_code = '271' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '388' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '388' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=273 → Badgenumber=394
SET @old_id = (SELECT id FROM employees WHERE employee_code = '273' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '394' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '394' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=274 → Badgenumber=396
SET @old_id = (SELECT id FROM employees WHERE employee_code = '274' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '396' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '396' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=275 → Badgenumber=397
SET @old_id = (SELECT id FROM employees WHERE employee_code = '275' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '397' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '397' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=276 → Badgenumber=401
SET @old_id = (SELECT id FROM employees WHERE employee_code = '276' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '401' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '401' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=277 → Badgenumber=402
SET @old_id = (SELECT id FROM employees WHERE employee_code = '277' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '402' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '402' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=278 → Badgenumber=404
SET @old_id = (SELECT id FROM employees WHERE employee_code = '278' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '404' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '404' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=279 → Badgenumber=406
SET @old_id = (SELECT id FROM employees WHERE employee_code = '279' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '406' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '406' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=280 → Badgenumber=408
SET @old_id = (SELECT id FROM employees WHERE employee_code = '280' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '408' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '408' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=281 → Badgenumber=409
SET @old_id = (SELECT id FROM employees WHERE employee_code = '281' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '409' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '409' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=282 → Badgenumber=411
SET @old_id = (SELECT id FROM employees WHERE employee_code = '282' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '411' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '411' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=283 → Badgenumber=412
SET @old_id = (SELECT id FROM employees WHERE employee_code = '283' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '412' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '412' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=284 → Badgenumber=413
SET @old_id = (SELECT id FROM employees WHERE employee_code = '284' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '413' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '413' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=285 → Badgenumber=415
SET @old_id = (SELECT id FROM employees WHERE employee_code = '285' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '415' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '415' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=286 → Badgenumber=416
SET @old_id = (SELECT id FROM employees WHERE employee_code = '286' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '416' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '416' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=287 → Badgenumber=417
SET @old_id = (SELECT id FROM employees WHERE employee_code = '287' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '417' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '417' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=288 → Badgenumber=419
SET @old_id = (SELECT id FROM employees WHERE employee_code = '288' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '419' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '419' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=289 → Badgenumber=420
SET @old_id = (SELECT id FROM employees WHERE employee_code = '289' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '420' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '420' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=290 → Badgenumber=421
SET @old_id = (SELECT id FROM employees WHERE employee_code = '290' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '421' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '421' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=291 → Badgenumber=422
SET @old_id = (SELECT id FROM employees WHERE employee_code = '291' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '422' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '422' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=292 → Badgenumber=423
SET @old_id = (SELECT id FROM employees WHERE employee_code = '292' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '423' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '423' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=293 → Badgenumber=424
SET @old_id = (SELECT id FROM employees WHERE employee_code = '293' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '424' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '424' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=294 → Badgenumber=425
SET @old_id = (SELECT id FROM employees WHERE employee_code = '294' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '425' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '425' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=295 → Badgenumber=427
SET @old_id = (SELECT id FROM employees WHERE employee_code = '295' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '427' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '427' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=296 → Badgenumber=428
SET @old_id = (SELECT id FROM employees WHERE employee_code = '296' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '428' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '428' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=297 → Badgenumber=430
SET @old_id = (SELECT id FROM employees WHERE employee_code = '297' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '430' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '430' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=298 → Badgenumber=431
SET @old_id = (SELECT id FROM employees WHERE employee_code = '298' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '431' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '431' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=299 → Badgenumber=433
SET @old_id = (SELECT id FROM employees WHERE employee_code = '299' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '433' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '433' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=300 → Badgenumber=436
SET @old_id = (SELECT id FROM employees WHERE employee_code = '300' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '436' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '436' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=301 → Badgenumber=445
SET @old_id = (SELECT id FROM employees WHERE employee_code = '301' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '445' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '445' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=302 → Badgenumber=449
SET @old_id = (SELECT id FROM employees WHERE employee_code = '302' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '449' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '449' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=303 → Badgenumber=450
SET @old_id = (SELECT id FROM employees WHERE employee_code = '303' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '450' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '450' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=304 → Badgenumber=454
SET @old_id = (SELECT id FROM employees WHERE employee_code = '304' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '454' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '454' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=305 → Badgenumber=469
SET @old_id = (SELECT id FROM employees WHERE employee_code = '305' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '469' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '469' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=306 → Badgenumber=468
SET @old_id = (SELECT id FROM employees WHERE employee_code = '306' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '468' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '468' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=307 → Badgenumber=470
SET @old_id = (SELECT id FROM employees WHERE employee_code = '307' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '470' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '470' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=308 → Badgenumber=128
SET @old_id = (SELECT id FROM employees WHERE employee_code = '308' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '128' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '128' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=309 → Badgenumber=471
SET @old_id = (SELECT id FROM employees WHERE employee_code = '309' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '471' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '471' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=310 → Badgenumber=472
SET @old_id = (SELECT id FROM employees WHERE employee_code = '310' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '472' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '472' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=311 → Badgenumber=473
SET @old_id = (SELECT id FROM employees WHERE employee_code = '311' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '473' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '473' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=312 → Badgenumber=474
SET @old_id = (SELECT id FROM employees WHERE employee_code = '312' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '474' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '474' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=313 → Badgenumber=305
SET @old_id = (SELECT id FROM employees WHERE employee_code = '313' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '305' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '305' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=314 → Badgenumber=328
SET @old_id = (SELECT id FROM employees WHERE employee_code = '314' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '328' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '328' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=315 → Badgenumber=205
SET @old_id = (SELECT id FROM employees WHERE employee_code = '315' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '205' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '205' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=316 → Badgenumber=207
SET @old_id = (SELECT id FROM employees WHERE employee_code = '316' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '207' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '207' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=317 → Badgenumber=209
SET @old_id = (SELECT id FROM employees WHERE employee_code = '317' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '209' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '209' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=318 → Badgenumber=213
SET @old_id = (SELECT id FROM employees WHERE employee_code = '318' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '213' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '213' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=319 → Badgenumber=218
SET @old_id = (SELECT id FROM employees WHERE employee_code = '319' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '218' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '218' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=320 → Badgenumber=221
SET @old_id = (SELECT id FROM employees WHERE employee_code = '320' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '221' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '221' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=321 → Badgenumber=222
SET @old_id = (SELECT id FROM employees WHERE employee_code = '321' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '222' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '222' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=322 → Badgenumber=223
SET @old_id = (SELECT id FROM employees WHERE employee_code = '322' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '223' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '223' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=323 → Badgenumber=326
SET @old_id = (SELECT id FROM employees WHERE employee_code = '323' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '326' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '326' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=324 → Badgenumber=440
SET @old_id = (SELECT id FROM employees WHERE employee_code = '324' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '440' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '440' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=325 → Badgenumber=93
SET @old_id = (SELECT id FROM employees WHERE employee_code = '325' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '93' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '93' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=326 → Badgenumber=225
SET @old_id = (SELECT id FROM employees WHERE employee_code = '326' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '225' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '225' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=327 → Badgenumber=226
SET @old_id = (SELECT id FROM employees WHERE employee_code = '327' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '226' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '226' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=328 → Badgenumber=230
SET @old_id = (SELECT id FROM employees WHERE employee_code = '328' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '230' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '230' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=329 → Badgenumber=231
SET @old_id = (SELECT id FROM employees WHERE employee_code = '329' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '231' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '231' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=330 → Badgenumber=335
SET @old_id = (SELECT id FROM employees WHERE employee_code = '330' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '335' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '335' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=331 → Badgenumber=233
SET @old_id = (SELECT id FROM employees WHERE employee_code = '331' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '233' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '233' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=332 → Badgenumber=235
SET @old_id = (SELECT id FROM employees WHERE employee_code = '332' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '235' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '235' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=333 → Badgenumber=238
SET @old_id = (SELECT id FROM employees WHERE employee_code = '333' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '238' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '238' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=334 → Badgenumber=240
SET @old_id = (SELECT id FROM employees WHERE employee_code = '334' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '240' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '240' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=335 → Badgenumber=241
SET @old_id = (SELECT id FROM employees WHERE employee_code = '335' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '241' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '241' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=336 → Badgenumber=244
SET @old_id = (SELECT id FROM employees WHERE employee_code = '336' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '244' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '244' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=337 → Badgenumber=252
SET @old_id = (SELECT id FROM employees WHERE employee_code = '337' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '252' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '252' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=338 → Badgenumber=256
SET @old_id = (SELECT id FROM employees WHERE employee_code = '338' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '256' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '256' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=339 → Badgenumber=257
SET @old_id = (SELECT id FROM employees WHERE employee_code = '339' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '257' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '257' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=340 → Badgenumber=456
SET @old_id = (SELECT id FROM employees WHERE employee_code = '340' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '456' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '456' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=341 → Badgenumber=317
SET @old_id = (SELECT id FROM employees WHERE employee_code = '341' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '317' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '317' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=342 → Badgenumber=77
SET @old_id = (SELECT id FROM employees WHERE employee_code = '342' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '77' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '77' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=343 → Badgenumber=173
SET @old_id = (SELECT id FROM employees WHERE employee_code = '343' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '173' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '173' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=344 → Badgenumber=465
SET @old_id = (SELECT id FROM employees WHERE employee_code = '344' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '465' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '465' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=345 → Badgenumber=464
SET @old_id = (SELECT id FROM employees WHERE employee_code = '345' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '464' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '464' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=346 → Badgenumber=141
SET @old_id = (SELECT id FROM employees WHERE employee_code = '346' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '141' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '141' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=347 → Badgenumber=294
SET @old_id = (SELECT id FROM employees WHERE employee_code = '347' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '294' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '294' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=348 → Badgenumber=395
SET @old_id = (SELECT id FROM employees WHERE employee_code = '348' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '395' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '395' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=349 → Badgenumber=157
SET @old_id = (SELECT id FROM employees WHERE employee_code = '349' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '157' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '157' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=350 → Badgenumber=140
SET @old_id = (SELECT id FROM employees WHERE employee_code = '350' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '140' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '140' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=351 → Badgenumber=414
SET @old_id = (SELECT id FROM employees WHERE employee_code = '351' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '414' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '414' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=352 → Badgenumber=268
SET @old_id = (SELECT id FROM employees WHERE employee_code = '352' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '268' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '268' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=353 → Badgenumber=362
SET @old_id = (SELECT id FROM employees WHERE employee_code = '353' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '362' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '362' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=354 → Badgenumber=383
SET @old_id = (SELECT id FROM employees WHERE employee_code = '354' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '383' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '383' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=355 → Badgenumber=455
SET @old_id = (SELECT id FROM employees WHERE employee_code = '355' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '455' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '455' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=356 → Badgenumber=410
SET @old_id = (SELECT id FROM employees WHERE employee_code = '356' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '410' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '410' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=357 → Badgenumber=332
SET @old_id = (SELECT id FROM employees WHERE employee_code = '357' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '332' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '332' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=358 → Badgenumber=447
SET @old_id = (SELECT id FROM employees WHERE employee_code = '358' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '447' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '447' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=359 → Badgenumber=426
SET @old_id = (SELECT id FROM employees WHERE employee_code = '359' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '426' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '426' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=360 → Badgenumber=459
SET @old_id = (SELECT id FROM employees WHERE employee_code = '360' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '459' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '459' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=361 → Badgenumber=460
SET @old_id = (SELECT id FROM employees WHERE employee_code = '361' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '460' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '460' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=362 → Badgenumber=177
SET @old_id = (SELECT id FROM employees WHERE employee_code = '362' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '177' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '177' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=363 → Badgenumber=291
SET @old_id = (SELECT id FROM employees WHERE employee_code = '363' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '291' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '291' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=364 → Badgenumber=17
SET @old_id = (SELECT id FROM employees WHERE employee_code = '364' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '17' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '17' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=365 → Badgenumber=42
SET @old_id = (SELECT id FROM employees WHERE employee_code = '365' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '42' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '42' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=366 → Badgenumber=346
SET @old_id = (SELECT id FROM employees WHERE employee_code = '366' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '346' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '346' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=367 → Badgenumber=153
SET @old_id = (SELECT id FROM employees WHERE employee_code = '367' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '153' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '153' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=368 → Badgenumber=407
SET @old_id = (SELECT id FROM employees WHERE employee_code = '368' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '407' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '407' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=369 → Badgenumber=347
SET @old_id = (SELECT id FROM employees WHERE employee_code = '369' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '347' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '347' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=370 → Badgenumber=458
SET @old_id = (SELECT id FROM employees WHERE employee_code = '370' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '458' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '458' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=371 → Badgenumber=50
SET @old_id = (SELECT id FROM employees WHERE employee_code = '371' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '50' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '50' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=372 → Badgenumber=303
SET @old_id = (SELECT id FROM employees WHERE employee_code = '372' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '303' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '303' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=373 → Badgenumber=288
SET @old_id = (SELECT id FROM employees WHERE employee_code = '373' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '288' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '288' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=374 → Badgenumber=373
SET @old_id = (SELECT id FROM employees WHERE employee_code = '374' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '373' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '373' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=375 → Badgenumber=370
SET @old_id = (SELECT id FROM employees WHERE employee_code = '375' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '370' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '370' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=376 → Badgenumber=323
SET @old_id = (SELECT id FROM employees WHERE employee_code = '376' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '323' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '323' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=377 → Badgenumber=89
SET @old_id = (SELECT id FROM employees WHERE employee_code = '377' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '89' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '89' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=378 → Badgenumber=386
SET @old_id = (SELECT id FROM employees WHERE employee_code = '378' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '386' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '386' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=379 → Badgenumber=301
SET @old_id = (SELECT id FROM employees WHERE employee_code = '379' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '301' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '301' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=380 → Badgenumber=272
SET @old_id = (SELECT id FROM employees WHERE employee_code = '380' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '272' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '272' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=381 → Badgenumber=355
SET @old_id = (SELECT id FROM employees WHERE employee_code = '381' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '355' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '355' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=382 → Badgenumber=131
SET @old_id = (SELECT id FROM employees WHERE employee_code = '382' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '131' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '131' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=383 → Badgenumber=443
SET @old_id = (SELECT id FROM employees WHERE employee_code = '383' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '443' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '443' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=384 → Badgenumber=418
SET @old_id = (SELECT id FROM employees WHERE employee_code = '384' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '418' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '418' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=385 → Badgenumber=29
SET @old_id = (SELECT id FROM employees WHERE employee_code = '385' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '29' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '29' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=386 → Badgenumber=451
SET @old_id = (SELECT id FROM employees WHERE employee_code = '386' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '451' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '451' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=387 → Badgenumber=84
SET @old_id = (SELECT id FROM employees WHERE employee_code = '387' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '84' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '84' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=388 → Badgenumber=16
SET @old_id = (SELECT id FROM employees WHERE employee_code = '388' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '16' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '16' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=389 → Badgenumber=439
SET @old_id = (SELECT id FROM employees WHERE employee_code = '389' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '439' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '439' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=390 → Badgenumber=9
SET @old_id = (SELECT id FROM employees WHERE employee_code = '390' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '9' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '9' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=391 → Badgenumber=400
SET @old_id = (SELECT id FROM employees WHERE employee_code = '391' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '400' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '400' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=392 → Badgenumber=452
SET @old_id = (SELECT id FROM employees WHERE employee_code = '392' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '452' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '452' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=393 → Badgenumber=453
SET @old_id = (SELECT id FROM employees WHERE employee_code = '393' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '453' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '453' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=394 → Badgenumber=338
SET @old_id = (SELECT id FROM employees WHERE employee_code = '394' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '338' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '338' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=395 → Badgenumber=174
SET @old_id = (SELECT id FROM employees WHERE employee_code = '395' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '174' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '174' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=396 → Badgenumber=196
SET @old_id = (SELECT id FROM employees WHERE employee_code = '396' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '196' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '196' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=397 → Badgenumber=14
SET @old_id = (SELECT id FROM employees WHERE employee_code = '397' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '14' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '14' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=398 → Badgenumber=150
SET @old_id = (SELECT id FROM employees WHERE employee_code = '398' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '150' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '150' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=399 → Badgenumber=161
SET @old_id = (SELECT id FROM employees WHERE employee_code = '399' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '161' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '161' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=400 → Badgenumber=66
SET @old_id = (SELECT id FROM employees WHERE employee_code = '400' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '66' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '66' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=401 → Badgenumber=146
SET @old_id = (SELECT id FROM employees WHERE employee_code = '401' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '146' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '146' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=402 → Badgenumber=259
SET @old_id = (SELECT id FROM employees WHERE employee_code = '402' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '259' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '259' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=403 → Badgenumber=114
SET @old_id = (SELECT id FROM employees WHERE employee_code = '403' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '114' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '114' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=404 → Badgenumber=277
SET @old_id = (SELECT id FROM employees WHERE employee_code = '404' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '277' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '277' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=405 → Badgenumber=160
SET @old_id = (SELECT id FROM employees WHERE employee_code = '405' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '160' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '160' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=406 → Badgenumber=80
SET @old_id = (SELECT id FROM employees WHERE employee_code = '406' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '80' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '80' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=407 → Badgenumber=398
SET @old_id = (SELECT id FROM employees WHERE employee_code = '407' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '398' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '398' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=408 → Badgenumber=285
SET @old_id = (SELECT id FROM employees WHERE employee_code = '408' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '285' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '285' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=409 → Badgenumber=343
SET @old_id = (SELECT id FROM employees WHERE employee_code = '409' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '343' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '343' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=410 → Badgenumber=90
SET @old_id = (SELECT id FROM employees WHERE employee_code = '410' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '90' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '90' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=411 → Badgenumber=385
SET @old_id = (SELECT id FROM employees WHERE employee_code = '411' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '385' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '385' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=412 → Badgenumber=438
SET @old_id = (SELECT id FROM employees WHERE employee_code = '412' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '438' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '438' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=413 → Badgenumber=176
SET @old_id = (SELECT id FROM employees WHERE employee_code = '413' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '176' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '176' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=414 → Badgenumber=120
SET @old_id = (SELECT id FROM employees WHERE employee_code = '414' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '120' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '120' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=415 → Badgenumber=446
SET @old_id = (SELECT id FROM employees WHERE employee_code = '415' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '446' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '446' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=416 → Badgenumber=85
SET @old_id = (SELECT id FROM employees WHERE employee_code = '416' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '85' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '85' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=417 → Badgenumber=136
SET @old_id = (SELECT id FROM employees WHERE employee_code = '417' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '136' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '136' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=418 → Badgenumber=282
SET @old_id = (SELECT id FROM employees WHERE employee_code = '418' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '282' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '282' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=419 → Badgenumber=181
SET @old_id = (SELECT id FROM employees WHERE employee_code = '419' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '181' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '181' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=420 → Badgenumber=116
SET @old_id = (SELECT id FROM employees WHERE employee_code = '420' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '116' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '116' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=421 → Badgenumber=350
SET @old_id = (SELECT id FROM employees WHERE employee_code = '421' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '350' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '350' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=422 → Badgenumber=56
SET @old_id = (SELECT id FROM employees WHERE employee_code = '422' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '56' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '56' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=423 → Badgenumber=102
SET @old_id = (SELECT id FROM employees WHERE employee_code = '423' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '102' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '102' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=424 → Badgenumber=127
SET @old_id = (SELECT id FROM employees WHERE employee_code = '424' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '127' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '127' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=425 → Badgenumber=367
SET @old_id = (SELECT id FROM employees WHERE employee_code = '425' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '367' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '367' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=426 → Badgenumber=280
SET @old_id = (SELECT id FROM employees WHERE employee_code = '426' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '280' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '280' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=427 → Badgenumber=393
SET @old_id = (SELECT id FROM employees WHERE employee_code = '427' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '393' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '393' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=428 → Badgenumber=434
SET @old_id = (SELECT id FROM employees WHERE employee_code = '428' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '434' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '434' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=429 → Badgenumber=149
SET @old_id = (SELECT id FROM employees WHERE employee_code = '429' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '149' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '149' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=430 → Badgenumber=155
SET @old_id = (SELECT id FROM employees WHERE employee_code = '430' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '155' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '155' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=431 → Badgenumber=437
SET @old_id = (SELECT id FROM employees WHERE employee_code = '431' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '437' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '437' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=432 → Badgenumber=466
SET @old_id = (SELECT id FROM employees WHERE employee_code = '432' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '466' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '466' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=433 → Badgenumber=316
SET @old_id = (SELECT id FROM employees WHERE employee_code = '433' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '316' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '316' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=434 → Badgenumber=313
SET @old_id = (SELECT id FROM employees WHERE employee_code = '434' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '313' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '313' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=435 → Badgenumber=390
SET @old_id = (SELECT id FROM employees WHERE employee_code = '435' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '390' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '390' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=436 → Badgenumber=187
SET @old_id = (SELECT id FROM employees WHERE employee_code = '436' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '187' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '187' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=437 → Badgenumber=354
SET @old_id = (SELECT id FROM employees WHERE employee_code = '437' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '354' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '354' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=438 → Badgenumber=19
SET @old_id = (SELECT id FROM employees WHERE employee_code = '438' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '19' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '19' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=439 → Badgenumber=106
SET @old_id = (SELECT id FROM employees WHERE employee_code = '439' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '106' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '106' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=440 → Badgenumber=462
SET @old_id = (SELECT id FROM employees WHERE employee_code = '440' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '462' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '462' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=441 → Badgenumber=320
SET @old_id = (SELECT id FROM employees WHERE employee_code = '441' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '320' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '320' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=442 → Badgenumber=429
SET @old_id = (SELECT id FROM employees WHERE employee_code = '442' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '429' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '429' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=443 → Badgenumber=476
SET @old_id = (SELECT id FROM employees WHERE employee_code = '443' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '476' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '476' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- USERID=444 → Badgenumber=475
SET @old_id = (SELECT id FROM employees WHERE employee_code = '444' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '475' LIMIT 1);
-- إذا الاثنان موجودان: دمج الحضور ثم حذف القديم
UPDATE attendance SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
-- إذا القديم موجود فقط: تحديث الكود
UPDATE employees SET employee_code = '475' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- ===== الخطوة 2: تحديث الأسماء من Excel =====

UPDATE employees SET name = 'بوقطاية عز الدين' WHERE employee_code = '1';
UPDATE employees SET name = 'مدلل طارق' WHERE employee_code = '2';
UPDATE employees SET name = 'مسعي محمد البشير' WHERE employee_code = '4';
UPDATE employees SET name = 'بوقطاية محمد انور' WHERE employee_code = '6';
UPDATE employees SET name = 'دهيمي عمار' WHERE employee_code = '7';
UPDATE employees SET name = 'احميد راتب' WHERE employee_code = '8';
UPDATE employees SET name = 'شبرو عبد الرحمن' WHERE employee_code = '10';
UPDATE employees SET name = 'خليل عبد الحميد' WHERE employee_code = '11';
UPDATE employees SET name = 'العقوبي رمزي' WHERE employee_code = '12';
UPDATE employees SET name = 'قابوسة علي' WHERE employee_code = '13';
UPDATE employees SET name = 'حابي اميرة' WHERE employee_code = '15';
UPDATE employees SET name = 'ساحة علي' WHERE employee_code = '18';
UPDATE employees SET name = 'بن سعدية السعيد' WHERE employee_code = '20';
UPDATE employees SET name = 'صبتي محمود التجاني' WHERE employee_code = '21';
UPDATE employees SET name = 'نويوات شويطر سفيان' WHERE employee_code = '22';
UPDATE employees SET name = 'هقي العروسي' WHERE employee_code = '24';
UPDATE employees SET name = 'شيخة يمينة' WHERE employee_code = '25';
UPDATE employees SET name = 'بن حوة عبد القادر' WHERE employee_code = '26';
UPDATE employees SET name = 'مدخل هدى' WHERE employee_code = '27';
UPDATE employees SET name = 'سالم الياس' WHERE employee_code = '28';
UPDATE employees SET name = 'جاب الله العربي' WHERE employee_code = '30';
UPDATE employees SET name = 'لموشي يوسف' WHERE employee_code = '31';
UPDATE employees SET name = 'بن عبد الله المولدي' WHERE employee_code = '32';
UPDATE employees SET name = 'بلهادف عبد الرحمن' WHERE employee_code = '35';
UPDATE employees SET name = 'شريف احمد' WHERE employee_code = '36';
UPDATE employees SET name = 'دهيمي مختار' WHERE employee_code = '37';
UPDATE employees SET name = 'تجاني محمد الطاهر' WHERE employee_code = '38';
UPDATE employees SET name = 'معوش الصادق' WHERE employee_code = '39';
UPDATE employees SET name = 'تجيني نور الدين' WHERE employee_code = '40';
UPDATE employees SET name = 'جلاب السعيد' WHERE employee_code = '41';
UPDATE employees SET name = 'احميد نعيم' WHERE employee_code = '43';
UPDATE employees SET name = 'غريسي ايوب' WHERE employee_code = '44';
UPDATE employees SET name = 'شوية حمد' WHERE employee_code = '45';
UPDATE employees SET name = 'كبسة عائشة' WHERE employee_code = '46';
UPDATE employees SET name = 'تريكي مسعود' WHERE employee_code = '47';
UPDATE employees SET name = 'عياشي محمد' WHERE employee_code = '48';
UPDATE employees SET name = 'طويل عبد الغني' WHERE employee_code = '49';
UPDATE employees SET name = 'ممادي العيد' WHERE employee_code = '51';
UPDATE employees SET name = 'عيساوي حمزة' WHERE employee_code = '52';
UPDATE employees SET name = 'فليون عبد القادر' WHERE employee_code = '53';
UPDATE employees SET name = 'طواهرية الياس' WHERE employee_code = '54';
UPDATE employees SET name = 'بوته سندس' WHERE employee_code = '55';
UPDATE employees SET name = 'شلبي يوسف' WHERE employee_code = '57';
UPDATE employees SET name = 'بشيري علي' WHERE employee_code = '58';
UPDATE employees SET name = 'تجيني عنتر' WHERE employee_code = '59';
UPDATE employees SET name = 'عطية سعد' WHERE employee_code = '60';
UPDATE employees SET name = 'جاب الله الحاج علي' WHERE employee_code = '61';
UPDATE employees SET name = 'بكوش سعد' WHERE employee_code = '62';
UPDATE employees SET name = 'ممادي بشير' WHERE employee_code = '63';
UPDATE employees SET name = 'مدخل نعيمة' WHERE employee_code = '64';
UPDATE employees SET name = 'سعداني احمد' WHERE employee_code = '65';
UPDATE employees SET name = 'قدور عبد الباسط' WHERE employee_code = '67';
UPDATE employees SET name = 'سعيد سعد' WHERE employee_code = '68';
UPDATE employees SET name = 'شيخة مبروك خميس' WHERE employee_code = '69';
UPDATE employees SET name = 'سبوعي علي شوقي' WHERE employee_code = '70';
UPDATE employees SET name = 'عبيدي اسامة' WHERE employee_code = '71';
UPDATE employees SET name = 'بن يامة ابراهيم' WHERE employee_code = '72';
UPDATE employees SET name = 'حريز بكار المهدي' WHERE employee_code = '73';
UPDATE employees SET name = 'حشيفة محمد' WHERE employee_code = '74';
UPDATE employees SET name = 'عتيق محمد' WHERE employee_code = '75';
UPDATE employees SET name = 'عاد احمد' WHERE employee_code = '76';
UPDATE employees SET name = 'مناعي التجاني' WHERE employee_code = '78';
UPDATE employees SET name = 'موم مسعودة' WHERE employee_code = '79';
UPDATE employees SET name = 'موم حليمة' WHERE employee_code = '81';
UPDATE employees SET name = 'حبيب الزهرة' WHERE employee_code = '82';
UPDATE employees SET name = 'وصيف تواتي وجدان' WHERE employee_code = '83';
UPDATE employees SET name = 'عتير السعيد' WHERE employee_code = '86';
UPDATE employees SET name = 'بالي عبد الرزاق' WHERE employee_code = '87';
UPDATE employees SET name = 'العابد عبد الوهاب' WHERE employee_code = '88';
UPDATE employees SET name = 'وقادي السعيد' WHERE employee_code = '91';
UPDATE employees SET name = 'غريسي عبد الله' WHERE employee_code = '92';
UPDATE employees SET name = 'طنش الطاهر' WHERE employee_code = '93';
UPDATE employees SET name = 'زان دلال' WHERE employee_code = '94';
UPDATE employees SET name = 'فاضل عبد الحميد' WHERE employee_code = '95';
UPDATE employees SET name = 'سوداني جمال' WHERE employee_code = '96';
UPDATE employees SET name = 'جراية رزقي' WHERE employee_code = '97';
UPDATE employees SET name = 'بن حوى اسماعيل' WHERE employee_code = '98';
UPDATE employees SET name = 'سويسي احمد' WHERE employee_code = '99';
UPDATE employees SET name = 'زبيدي علي' WHERE employee_code = '100';
UPDATE employees SET name = 'غربي جمال' WHERE employee_code = '101';
UPDATE employees SET name = 'نصري زيد' WHERE employee_code = '103';
UPDATE employees SET name = 'زغيب توفيق' WHERE employee_code = '104';
UPDATE employees SET name = 'بزايدية امير' WHERE employee_code = '105';
UPDATE employees SET name = 'احميد احمد التجاني' WHERE employee_code = '107';
UPDATE employees SET name = 'ميموني حسين' WHERE employee_code = '108';
UPDATE employees SET name = 'حماني العروسي' WHERE employee_code = '109';
UPDATE employees SET name = 'ميداوي ابتسام' WHERE employee_code = '110';
UPDATE employees SET name = 'ديدة رمزي' WHERE employee_code = '112';
UPDATE employees SET name = 'مومن مسعود البشير' WHERE employee_code = '113';
UPDATE employees SET name = 'مسعي محمد ابراهيم' WHERE employee_code = '115';
UPDATE employees SET name = 'مناني حمزة' WHERE employee_code = '117';
UPDATE employees SET name = 'محبوبي عبد العزيز' WHERE employee_code = '118';
UPDATE employees SET name = 'العاتي بن سالم' WHERE employee_code = '119';
UPDATE employees SET name = 'بيكي وردة' WHERE employee_code = '121';
UPDATE employees SET name = 'عبيدي سعد نصيرة' WHERE employee_code = '122';
UPDATE employees SET name = 'بلال عائشة' WHERE employee_code = '124';
UPDATE employees SET name = 'ساحة العربي' WHERE employee_code = '125';
UPDATE employees SET name = 'مداوي جمعة' WHERE employee_code = '126';
UPDATE employees SET name = 'حومدي اياس' WHERE employee_code = '128';
UPDATE employees SET name = 'كشحة عبد الفتاح' WHERE employee_code = '129';
UPDATE employees SET name = 'ربوح سامية' WHERE employee_code = '130';
UPDATE employees SET name = 'عطر آمنة' WHERE employee_code = '132';
UPDATE employees SET name = 'بن علية شكري' WHERE employee_code = '133';
UPDATE employees SET name = 'تليلي الهادي' WHERE employee_code = '134';
UPDATE employees SET name = 'حميد الوليد' WHERE employee_code = '135';
UPDATE employees SET name = 'شرفي عبد النور' WHERE employee_code = '137';
UPDATE employees SET name = 'حتيري سليمة' WHERE employee_code = '138';
UPDATE employees SET name = 'حبيب عبد الرزاق' WHERE employee_code = '139';
UPDATE employees SET name = 'بن عيشة محمد' WHERE employee_code = '142';
UPDATE employees SET name = 'بن احمد يونس' WHERE employee_code = '143';
UPDATE employees SET name = 'صوالح احميمة سعد' WHERE employee_code = '144';
UPDATE employees SET name = 'طواهرية علي' WHERE employee_code = '145';
UPDATE employees SET name = 'حمو العيد' WHERE employee_code = '147';
UPDATE employees SET name = 'مراد عبد القادر' WHERE employee_code = '148';
UPDATE employees SET name = 'فرحات عبد الجبار' WHERE employee_code = '151';
UPDATE employees SET name = 'بن احمد عمر' WHERE employee_code = '152';
UPDATE employees SET name = 'فرحات ربيع' WHERE employee_code = '154';
UPDATE employees SET name = 'عياشي عمر عبد الفتاح' WHERE employee_code = '156';
UPDATE employees SET name = 'ربيعي محمد' WHERE employee_code = '158';
UPDATE employees SET name = 'ممادي محمد الحبيب' WHERE employee_code = '159';
UPDATE employees SET name = 'سعيد محمد العربي' WHERE employee_code = '162';
UPDATE employees SET name = 'حمدي الياس' WHERE employee_code = '163';
UPDATE employees SET name = 'شمسة محمد' WHERE employee_code = '164';
UPDATE employees SET name = 'بوترعة احمد' WHERE employee_code = '165';
UPDATE employees SET name = 'قريرة عبد العزيز' WHERE employee_code = '166';
UPDATE employees SET name = 'مكاوي نور الدين' WHERE employee_code = '168';
UPDATE employees SET name = 'زيدي رشيد' WHERE employee_code = '169';
UPDATE employees SET name = 'مكاوي احمد شوقي' WHERE employee_code = '170';
UPDATE employees SET name = 'طالبي محمد الصادق' WHERE employee_code = '171';
UPDATE employees SET name = 'قبنة عبد الرحمن' WHERE employee_code = '172';
UPDATE employees SET name = 'مذكور عبد المجيد' WHERE employee_code = '178';
UPDATE employees SET name = 'عبد القوي عمار' WHERE employee_code = '179';
UPDATE employees SET name = 'ياحي السعيد' WHERE employee_code = '180';
UPDATE employees SET name = 'عيساوي احمد البخاري' WHERE employee_code = '182';
UPDATE employees SET name = 'هنيات المولدي' WHERE employee_code = '183';
UPDATE employees SET name = 'واده ربح' WHERE employee_code = '184';
UPDATE employees SET name = 'حنكة علي' WHERE employee_code = '185';
UPDATE employees SET name = 'نسيب عرفات' WHERE employee_code = '186';
UPDATE employees SET name = 'عروة سمراء' WHERE employee_code = '188';
UPDATE employees SET name = 'رقيق ايناس' WHERE employee_code = '190';
UPDATE employees SET name = 'ربيعي سالم' WHERE employee_code = '191';
UPDATE employees SET name = 'حمصي مسعود' WHERE employee_code = '192';
UPDATE employees SET name = 'منصر انور' WHERE employee_code = '194';
UPDATE employees SET name = 'سلمان لمين' WHERE employee_code = '195';
UPDATE employees SET name = 'مسعي محمد علي 2' WHERE employee_code = '197';
UPDATE employees SET name = 'وادة مريم' WHERE employee_code = '198';
UPDATE employees SET name = 'جرادي حمزة' WHERE employee_code = '199';
UPDATE employees SET name = 'قدور فظيل' WHERE employee_code = '200';
UPDATE employees SET name = 'مسعي محمد السعيد' WHERE employee_code = '201';
UPDATE employees SET name = 'ديدة وليد' WHERE employee_code = '202';
UPDATE employees SET name = 'طواهر محمود' WHERE employee_code = '203';
UPDATE employees SET name = 'احويج فارس' WHERE employee_code = '204';
UPDATE employees SET name = 'حمصي هشام' WHERE employee_code = '206';
UPDATE employees SET name = 'غانم نبيل' WHERE employee_code = '207';
UPDATE employees SET name = 'عطية صالح' WHERE employee_code = '208';
UPDATE employees SET name = 'سلامة احمد البشير' WHERE employee_code = '209';
UPDATE employees SET name = 'نصبة ابراهيم' WHERE employee_code = '210';
UPDATE employees SET name = 'حمدي ايمن' WHERE employee_code = '211';
UPDATE employees SET name = 'شريفي حسن' WHERE employee_code = '212';
UPDATE employees SET name = 'جويدة احمد فوزي' WHERE employee_code = '213';
UPDATE employees SET name = 'لعوج حسن' WHERE employee_code = '214';
UPDATE employees SET name = 'بهى خليفة' WHERE employee_code = '215';
UPDATE employees SET name = 'زغدي محمد الصالح' WHERE employee_code = '216';
UPDATE employees SET name = 'خناب محمد الصالح' WHERE employee_code = '217';
UPDATE employees SET name = 'بن عون اسامة' WHERE employee_code = '218';
UPDATE employees SET name = 'قديري عبد الرحمن' WHERE employee_code = '219';
UPDATE employees SET name = 'عبيد بوبكر' WHERE employee_code = '220';
UPDATE employees SET name = 'قرميط عبد الرؤوف' WHERE employee_code = '221';
UPDATE employees SET name = 'تامة احمد البشير' WHERE employee_code = '222';
UPDATE employees SET name = 'غالية الياس' WHERE employee_code = '223';
UPDATE employees SET name = 'فارس مراد' WHERE employee_code = '224';
UPDATE employees SET name = 'دبش عمار' WHERE employee_code = '227';
UPDATE employees SET name = 'رقيق ابتسام' WHERE employee_code = '228';
UPDATE employees SET name = 'سلمي احمد' WHERE employee_code = '229';
UPDATE employees SET name = 'حبيب بلقاسم' WHERE employee_code = '232';
UPDATE employees SET name = 'قرفي اسحاق' WHERE employee_code = '234';
UPDATE employees SET name = 'عامر عبد المنعم' WHERE employee_code = '236';
UPDATE employees SET name = 'وذيني بلال' WHERE employee_code = '237';
UPDATE employees SET name = 'حميد حمزة' WHERE employee_code = '239';
UPDATE employees SET name = 'بن بردي مسعود' WHERE employee_code = '242';
UPDATE employees SET name = 'سباق عبد القادر بوبكر' WHERE employee_code = '243';
UPDATE employees SET name = 'زروق عبد الرزاق' WHERE employee_code = '245';
UPDATE employees SET name = 'زبيدي جعفر' WHERE employee_code = '246';
UPDATE employees SET name = 'جرو الزهرة' WHERE employee_code = '247';
UPDATE employees SET name = 'غريسي زكرياء' WHERE employee_code = '248';
UPDATE employees SET name = 'عمامرة عبد السلام' WHERE employee_code = '249';
UPDATE employees SET name = 'بهى محسن' WHERE employee_code = '250';
UPDATE employees SET name = 'بن عمر عماد الدين' WHERE employee_code = '251';
UPDATE employees SET name = 'فاضل صدام' WHERE employee_code = '253';
UPDATE employees SET name = 'مشري خالد' WHERE employee_code = '254';
UPDATE employees SET name = 'شيحاني محمد الامين' WHERE employee_code = '255';
UPDATE employees SET name = 'سقني عقبة' WHERE employee_code = '258';
UPDATE employees SET name = 'سمينة جمعة' WHERE employee_code = '261';
UPDATE employees SET name = 'عتيق نصر سليم' WHERE employee_code = '262';
UPDATE employees SET name = 'لشهب بوبكر' WHERE employee_code = '263';
UPDATE employees SET name = 'حقيق لطفي' WHERE employee_code = '265';
UPDATE employees SET name = 'زواري احمد مريم' WHERE employee_code = '266';
UPDATE employees SET name = 'دشري الحاج علي' WHERE employee_code = '267';
UPDATE employees SET name = 'غدير عمر امجد' WHERE employee_code = '269';
UPDATE employees SET name = 'موساوي جهاد' WHERE employee_code = '270';
UPDATE employees SET name = 'قماري مازن حسنين' WHERE employee_code = '271';
UPDATE employees SET name = 'فاضل بلقاسم' WHERE employee_code = '273';
UPDATE employees SET name = 'غريسي معتز' WHERE employee_code = '274';
UPDATE employees SET name = 'بن الشهبة عبد العزيز' WHERE employee_code = '275';
UPDATE employees SET name = 'عتيق العربي يوسف' WHERE employee_code = '276';
UPDATE employees SET name = 'دية بوبكر' WHERE employee_code = '278';
UPDATE employees SET name = 'زغدي كمال' WHERE employee_code = '279';
UPDATE employees SET name = 'منيعي عبد الباسط' WHERE employee_code = '281';
UPDATE employees SET name = 'تجاني ايوب' WHERE employee_code = '284';
UPDATE employees SET name = 'قدوري مباركة' WHERE employee_code = '286';
UPDATE employees SET name = 'دشري عبد الجبار' WHERE employee_code = '287';
UPDATE employees SET name = 'بلقاضي لمنور' WHERE employee_code = '288';
UPDATE employees SET name = 'حمتين السعيد' WHERE employee_code = '289';
UPDATE employees SET name = 'برتيمة عبد الكريم' WHERE employee_code = '290';
UPDATE employees SET name = 'محبوب مصباح وليد' WHERE employee_code = '292';
UPDATE employees SET name = 'ميهوب يوسف' WHERE employee_code = '295';
UPDATE employees SET name = 'رداد المهدي' WHERE employee_code = '296';
UPDATE employees SET name = 'تليلي الطاهر 2' WHERE employee_code = '297';
UPDATE employees SET name = 'عطا الله رياض' WHERE employee_code = '298';
UPDATE employees SET name = 'يحياوي ياسين' WHERE employee_code = '299';
UPDATE employees SET name = 'عروة فتيحة' WHERE employee_code = '300';
UPDATE employees SET name = 'غنابزية عبد الكامل' WHERE employee_code = '302';
UPDATE employees SET name = 'مسعودي جمال' WHERE employee_code = '305';
UPDATE employees SET name = 'بلخضر ساعد' WHERE employee_code = '306';
UPDATE employees SET name = 'خلوط طارق' WHERE employee_code = '307';
UPDATE employees SET name = 'سمينة حنان' WHERE employee_code = '308';
UPDATE employees SET name = 'عبابة هاشم' WHERE employee_code = '309';
UPDATE employees SET name = 'بن بداري عبد الفتاح' WHERE employee_code = '310';
UPDATE employees SET name = 'يومبعي محمد' WHERE employee_code = '311';
UPDATE employees SET name = 'مداوي نسرين' WHERE employee_code = '312';
UPDATE employees SET name = 'هيمة ابراهيم' WHERE employee_code = '314';
UPDATE employees SET name = 'قديري حمزة' WHERE employee_code = '315';
UPDATE employees SET name = 'بوقطاية محمد السعيد' WHERE employee_code = '318';
UPDATE employees SET name = 'دبار الاخضر' WHERE employee_code = '319';
UPDATE employees SET name = 'دحمري فوزي' WHERE employee_code = '321';
UPDATE employees SET name = 'غنبازي مبروك' WHERE employee_code = '322';
UPDATE employees SET name = 'طالبي يوسف' WHERE employee_code = '324';
UPDATE employees SET name = 'مساعيد محمد الحبيب' WHERE employee_code = '325';
UPDATE employees SET name = 'مشري عماد الدين' WHERE employee_code = '326';
UPDATE employees SET name = 'بن عبد الله ايمن' WHERE employee_code = '328';
UPDATE employees SET name = 'دودو نبيل' WHERE employee_code = '329';
UPDATE employees SET name = 'بوضياف صبري' WHERE employee_code = '330';
UPDATE employees SET name = 'نيس ميلود' WHERE employee_code = '331';
UPDATE employees SET name = 'مداوي يوسف' WHERE employee_code = '333';
UPDATE employees SET name = 'مزيو محمد' WHERE employee_code = '334';
UPDATE employees SET name = 'بن غالي العربي' WHERE employee_code = '336';
UPDATE employees SET name = 'كوت نور الدين' WHERE employee_code = '337';
UPDATE employees SET name = 'منير عبد الكريم' WHERE employee_code = '339';
UPDATE employees SET name = 'دوش عبد القادر' WHERE employee_code = '340';
UPDATE employees SET name = 'بوضياف بوضياف' WHERE employee_code = '341';
UPDATE employees SET name = 'رحال عبد الباقي' WHERE employee_code = '344';
UPDATE employees SET name = 'بركة مسعود' WHERE employee_code = '345';
UPDATE employees SET name = 'فايزي المولدي' WHERE employee_code = '348';
UPDATE employees SET name = 'حمادي الحبيب' WHERE employee_code = '349';
UPDATE employees SET name = 'درويش عبد الله' WHERE employee_code = '351';
UPDATE employees SET name = 'تجيني حسين' WHERE employee_code = '352';
UPDATE employees SET name = 'براهمي عمار' WHERE employee_code = '353';
UPDATE employees SET name = 'سوفلي عبد الوهاب' WHERE employee_code = '356';
UPDATE employees SET name = 'طنش السعيد' WHERE employee_code = '357';
UPDATE employees SET name = 'مهيش ميلود' WHERE employee_code = '358';
UPDATE employees SET name = 'مسعي احمد البشير' WHERE employee_code = '359';
UPDATE employees SET name = 'بوغزالة محمد كريمة' WHERE employee_code = '361';
UPDATE employees SET name = 'سعيد صالح' WHERE employee_code = '365';
UPDATE employees SET name = 'بوذينة عماد الدين' WHERE employee_code = '366';
UPDATE employees SET name = 'دهيمي عبد الحافظ' WHERE employee_code = '368';
UPDATE employees SET name = 'كشحة عادل' WHERE employee_code = '369';
UPDATE employees SET name = 'تلحيق السعيد' WHERE employee_code = '371';
UPDATE employees SET name = 'حمدي البشير' WHERE employee_code = '372';
UPDATE employees SET name = 'غدير عمر عبد الغني' WHERE employee_code = '374';
UPDATE employees SET name = 'دوة محمد الحبيب' WHERE employee_code = '375';
UPDATE employees SET name = 'تجاني محمد الصادق' WHERE employee_code = '376';
UPDATE employees SET name = 'بيكي هيثم' WHERE employee_code = '378';
UPDATE employees SET name = 'شيحاني عبد الوهاب' WHERE employee_code = '379';
UPDATE employees SET name = 'زربيط محمد الطاهر' WHERE employee_code = '380';
UPDATE employees SET name = 'حشيفة فتحي' WHERE employee_code = '381';
UPDATE employees SET name = 'جاب الله عبد السلام' WHERE employee_code = '382';
UPDATE employees SET name = 'زين صلاح الدين' WHERE employee_code = '384';
UPDATE employees SET name = 'ربوح ميلود' WHERE employee_code = '387';
UPDATE employees SET name = 'يومبعي وائل' WHERE employee_code = '388';
UPDATE employees SET name = 'بن عمار احمد' WHERE employee_code = '389';
UPDATE employees SET name = 'عباسي عمر' WHERE employee_code = '394';
UPDATE employees SET name = 'بك اسامة' WHERE employee_code = '396';
UPDATE employees SET name = 'عامر جلال' WHERE employee_code = '397';
UPDATE employees SET name = 'طريلي خولة' WHERE employee_code = '399';
UPDATE employees SET name = 'ديدة الطاهر' WHERE employee_code = '401';
UPDATE employees SET name = 'بله عماد الدين' WHERE employee_code = '402';
UPDATE employees SET name = 'بن عمارة خيرة' WHERE employee_code = '403';
UPDATE employees SET name = 'سالم عبد السلام' WHERE employee_code = '404';
UPDATE employees SET name = 'كنيوة مريم' WHERE employee_code = '405';
UPDATE employees SET name = 'تجاني البشير' WHERE employee_code = '409';
UPDATE employees SET name = 'يومبعي محمد العيد' WHERE employee_code = '411';
UPDATE employees SET name = 'عية مراد' WHERE employee_code = '412';
UPDATE employees SET name = 'بن يامة عبد العزيز' WHERE employee_code = '413';
UPDATE employees SET name = 'عباسي السعيد' WHERE employee_code = '415';
UPDATE employees SET name = 'طنش عبد المالك' WHERE employee_code = '417';
UPDATE employees SET name = 'رزيق محمد' WHERE employee_code = '421';
UPDATE employees SET name = 'غريسي خليفة' WHERE employee_code = '422';
UPDATE employees SET name = 'عاشور الحاج سعد' WHERE employee_code = '425';
UPDATE employees SET name = 'قرح زكية' WHERE employee_code = '427';
UPDATE employees SET name = 'عسيلة ابراهيم' WHERE employee_code = '430';
UPDATE employees SET name = 'فايزي فؤاد' WHERE employee_code = '431';
UPDATE employees SET name = 'تجاني محمد الهادي' WHERE employee_code = '433';
UPDATE employees SET name = 'العايش احمد الثاني' WHERE employee_code = '436';
UPDATE employees SET name = 'تجاني محمد البشير' WHERE employee_code = '440';
UPDATE employees SET name = 'عقيب الزهرة' WHERE employee_code = '445';
UPDATE employees SET name = 'ثامر اذرير' WHERE employee_code = '449';
UPDATE employees SET name = 'دودو نور الدين' WHERE employee_code = '450';
UPDATE employees SET name = 'قوبعة محمد' WHERE employee_code = '454';
UPDATE employees SET name = 'سلطانة عبد المجيد' WHERE employee_code = '468';
UPDATE employees SET name = 'بيكي محمد رضا' WHERE employee_code = '469';
UPDATE employees SET name = 'زويزية مبروك' WHERE employee_code = '470';
UPDATE employees SET name = 'علاق العربي' WHERE employee_code = '471';
UPDATE employees SET name = 'رحال عثمان' WHERE employee_code = '472';
UPDATE employees SET name = 'غننة عبد الحاكم' WHERE employee_code = '473';
UPDATE employees SET name = 'رحالي السبتي' WHERE employee_code = '474';

COMMIT;

-- ===== تحقق بعد التطبيق =====
SELECT COUNT(*) AS 'مكررات بعد الإصلاح'
FROM (
  SELECT employee_code, COUNT(*) as cnt FROM employees GROUP BY employee_code HAVING cnt > 1
) dup;
SELECT COUNT(*) AS 'موظفون بدون اسم حقيقي'
FROM employees WHERE name = employee_code OR name REGEXP '^[0-9]+$';