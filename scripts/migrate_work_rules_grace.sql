-- =====================================================================
-- إضافة حقول نوافذ المهلة لجدول work_rules
-- شغّله بالأمر:
--   mysql -h 127.0.0.1 -u DB_USER -pDB_PASS DB_NAME < scripts/migrate_work_rules_grace.sql
-- =====================================================================

ALTER TABLE work_rules
  ADD COLUMN IF NOT EXISTS early_arrival_grace_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_leave_grace_minutes   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_leave_grace_minutes    INT NOT NULL DEFAULT 0;

-- تحقق
SELECT id, name, work_start_time, work_end_time,
       late_grace_minutes,
       early_arrival_grace_minutes,
       early_leave_grace_minutes,
       late_leave_grace_minutes
FROM work_rules;
