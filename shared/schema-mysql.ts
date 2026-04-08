import { mysqlTable, text, varchar, int, boolean, uniqueIndex } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("auth_users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 191 }).notNull(),
  password: text("password").notNull(),
}, (table) => [
  uniqueIndex("auth_users_username_idx").on(table.username),
]);

export const companies = mysqlTable("companies", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const workshops = mysqlTable("workshops", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const positions = mysqlTable("positions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const workRules = mysqlTable("work_rules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  workStartTime: text("work_start_time").notNull().default("08:00"),
  workEndTime: text("work_end_time").notNull().default("16:00"),
  lateGraceMinutes: int("late_grace_minutes").notNull().default(0),
  earlyArrivalGraceMinutes: int("early_arrival_grace_minutes").notNull().default(0),
  earlyLeaveGraceMinutes: int("early_leave_grace_minutes").notNull().default(0),
  lateLeaveGraceMinutes: int("late_leave_grace_minutes").notNull().default(0),
  latePenaltyPerMinute: text("late_penalty_per_minute").notNull().default("0"),
  earlyLeavePenaltyPerMinute: text("early_leave_penalty_per_minute").notNull().default("0"),
  absencePenalty: text("absence_penalty").notNull().default("0"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const employees = mysqlTable("employees", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  employeeCode: varchar("employee_code", { length: 100 }).notNull(),
  cardNumber: varchar("card_number", { length: 100 }),
  positionId: varchar("position_id", { length: 36 }),
  workRuleId: varchar("work_rule_id", { length: 36 }),
  companyId: varchar("company_id", { length: 36 }),
  workshopId: varchar("workshop_id", { length: 36 }),
  phone: text("phone"),
  shift: text("shift").default("morning"),
  contractEndDate: text("contract_end_date"),
  nonRenewalDate: text("non_renewal_date"),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => [
  uniqueIndex("employees_employee_code_idx").on(table.employeeCode),
]);

export const attendanceRecords = mysqlTable("attendance_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 36 }).notNull(),
  date: text("date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status").notNull().default("present"),
  lateMinutes: int("late_minutes").notNull().default(0),
  earlyLeaveMinutes: int("early_leave_minutes").notNull().default(0),
  middleAbsenceMinutes: int("middle_absence_minutes").notNull().default(0),
  totalHours: text("total_hours").default("0"),
  penalty: text("penalty").default("0"),
  notes: text("notes"),
}, (table) => [
  uniqueIndex("attendance_employee_date_idx").on(table.employeeId, table.date),
]);

export const deviceSettings = mysqlTable("device_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  port: int("port").notNull().default(4370),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: text("last_sync_at"),
  workshopId: varchar("workshop_id", { length: 36 }),
  serialNumber: varchar("serial_number", { length: 64 }),
});

export const appSettings = mysqlTable("app_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 191 }).notNull(),
  value: text("value").notNull(),
}, (table) => [
  uniqueIndex("app_settings_key_idx").on(table.key),
]);

export const frozenArchives = mysqlTable("frozen_archives", {
  id: varchar("id", { length: 36 }).primaryKey(),
  month: varchar("month", { length: 7 }).notNull(),
  workshopId: varchar("workshop_id", { length: 36 }).notNull(),
  workRuleId: varchar("work_rule_id", { length: 36 }).notNull(),
  frozenAt: varchar("frozen_at", { length: 50 }).notNull(),
  frozenBy: varchar("frozen_by", { length: 191 }).notNull(),
  reportJson: text("report_json").notNull(),
}, (table) => [
  uniqueIndex("frozen_archives_month_ws_rule_idx").on(table.month, table.workshopId, table.workRuleId),
]);

export const activityLogs = mysqlTable("activity_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  username: varchar("username", { length: 191 }),
  method: varchar("method", { length: 10 }).notNull(),
  path: text("path").notNull(),
  statusCode: int("status_code").notNull().default(200),
  details: text("details"),
  createdAt: varchar("created_at", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id", { length: 36 }),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  employeeName: varchar("employee_name", { length: 191 }),
  employeeCode: varchar("employee_code", { length: 50 }),
  workshopName: varchar("workshop_name", { length: 191 }),
  workRuleName: varchar("work_rule_name", { length: 191 }),
  recordDate: varchar("record_date", { length: 20 }),
  isReverted: int("is_reverted").default(0),
  revertedAt: varchar("reverted_at", { length: 50 }),
  revertedBy: varchar("reverted_by", { length: 191 }),
});

export const lockedRecords = mysqlTable("locked_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 36 }).notNull(),
  recordDate: varchar("record_date", { length: 20 }).notNull(),
  lockedBy: varchar("locked_by", { length: 191 }),
  lockedAt: varchar("locked_at", { length: 50 }),
  activityLogId: varchar("activity_log_id", { length: 36 }),
});

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertCompanySchema = createInsertSchema(companies).pick({ name: true, description: true });
export const insertWorkshopSchema = createInsertSchema(workshops).pick({ name: true, description: true });
export const insertPositionSchema = createInsertSchema(positions).pick({ name: true, description: true });
export const insertWorkRuleSchema = createInsertSchema(workRules).pick({
  name: true, workStartTime: true, workEndTime: true,
  lateGraceMinutes: true, earlyArrivalGraceMinutes: true,
  earlyLeaveGraceMinutes: true, lateLeaveGraceMinutes: true,
  latePenaltyPerMinute: true, earlyLeavePenaltyPerMinute: true, absencePenalty: true, isDefault: true,
});
export const insertEmployeeSchema = createInsertSchema(employees).pick({
  name: true, employeeCode: true, cardNumber: true, positionId: true, workRuleId: true,
  companyId: true, workshopId: true, phone: true, shift: true,
  contractEndDate: true, nonRenewalDate: true, isActive: true,
});
export const insertAttendanceSchema = createInsertSchema(attendanceRecords).pick({
  employeeId: true, date: true, checkIn: true, checkOut: true, status: true,
  lateMinutes: true, earlyLeaveMinutes: true, middleAbsenceMinutes: true, totalHours: true, penalty: true, notes: true,
});
export const insertDeviceSettingsSchema = createInsertSchema(deviceSettings).pick({
  name: true, ipAddress: true, port: true, isActive: true, lastSyncAt: true, workshopId: true, serialNumber: true,
});
export const insertAppSettingsSchema = createInsertSchema(appSettings).pick({ key: true, value: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true, username: true, method: true, path: true, statusCode: true, details: true, createdAt: true,
  entityType: true, entityId: true, oldValues: true, newValues: true,
  employeeName: true, employeeCode: true, workshopName: true, workRuleName: true, recordDate: true,
  isReverted: true, revertedAt: true, revertedBy: true,
});

export const insertLockedRecordSchema = createInsertSchema(lockedRecords).pick({
  employeeId: true, recordDate: true, lockedBy: true, lockedAt: true, activityLogId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;
export type Workshop = typeof workshops.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertWorkRule = z.infer<typeof insertWorkRuleSchema>;
export type WorkRule = typeof workRules.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertDeviceSettings = z.infer<typeof insertDeviceSettingsSchema>;
export type DeviceSettings = typeof deviceSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertLockedRecord = z.infer<typeof insertLockedRecordSchema>;
export type LockedRecord = typeof lockedRecords.$inferSelect;

export const insertFrozenArchiveSchema = createInsertSchema(frozenArchives).pick({
  month: true, workshopId: true, workRuleId: true, frozenAt: true, frozenBy: true, reportJson: true,
});
export type InsertFrozenArchive = z.infer<typeof insertFrozenArchiveSchema>;
export type FrozenArchiveMysql = typeof frozenArchives.$inferSelect;
