-- =====================================================================
-- سكريبت تعيين الفترات الصباحية والمسائية
-- شغّله على السيرفر بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/set_shifts.sql
-- =====================================================================

-- 1. إنشاء فترة صباحية إن لم تكن موجودة
INSERT INTO work_rules (id, name, work_start_time, work_end_time, late_grace_minutes, late_penalty_per_minute, early_leave_penalty_per_minute, absence_penalty, is_default)
SELECT UUID(), 'الفترة الصباحية', '08:00', '16:00', 0, '0', '0', '0', 1
WHERE NOT EXISTS (SELECT 1 FROM work_rules WHERE name = 'الفترة الصباحية');

-- 2. إنشاء فترة مسائية إن لم تكن موجودة
INSERT INTO work_rules (id, name, work_start_time, work_end_time, late_grace_minutes, late_penalty_per_minute, early_leave_penalty_per_minute, absence_penalty, is_default)
SELECT UUID(), 'الفترة المسائية', '14:00', '22:00', 0, '0', '0', '0', 0
WHERE NOT EXISTS (SELECT 1 FROM work_rules WHERE name = 'الفترة المسائية');

-- 3. تعيين الفترة المسائية لـ33 موظفاً
UPDATE employees
SET shift = 'evening'
WHERE employee_code IN ('18','159','239','246','325','397','311','313','349','382',
                        '297','309','337','369','71','262','276','366','143','22',
                        '105','158','179','191','258','263','78','125','204','359',
                        '142','203','287');

-- 4. باقي الموظفين النشطين → فترة صباحية
UPDATE employees
SET shift = 'morning'
WHERE employee_code NOT IN ('18','159','239','246','325','397','311','313','349','382',
                             '297','309','337','369','71','262','276','366','143','22',
                             '105','158','179','191','258','263','78','125','204','359',
                             '142','203','287');

-- 5. ربط workRuleId بالفترة المسائية
UPDATE employees e
JOIN work_rules wr ON wr.name = 'الفترة المسائية'
SET e.work_rule_id = wr.id
WHERE e.shift = 'evening';

-- 6. ربط workRuleId بالفترة الصباحية
UPDATE employees e
JOIN work_rules wr ON wr.name = 'الفترة الصباحية'
SET e.work_rule_id = wr.id
WHERE e.shift = 'morning';

-- تحقق من النتيجة
SELECT shift, COUNT(*) AS عدد_الموظفين FROM employees GROUP BY shift;
