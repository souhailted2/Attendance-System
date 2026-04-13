import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const workshops = pgTable("workshops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const workRules = pgTable("work_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  workStartTime: text("work_start_time").notNull().default("08:00"),
  workEndTime: text("work_end_time").notNull().default("16:00"),
  lateGraceMinutes: integer("late_grace_minutes").notNull().default(0),
  earlyArrivalGraceMinutes: integer("early_arrival_grace_minutes").notNull().default(0),
  earlyLeaveGraceMinutes: integer("early_leave_grace_minutes").notNull().default(0),
  lateLeaveGraceMinutes: integer("late_leave_grace_minutes").notNull().default(0),
  latePenaltyPerMinute: text("late_penalty_per_minute").notNull().default("0"),
  earlyLeavePenaltyPerMinute: text("early_leave_penalty_per_minute").notNull().default("0"),
  absencePenalty: text("absence_penalty").notNull().default("0"),
  isDefault: boolean("is_default").notNull().default(false),
  is24hShift: boolean("is_24h_shift").notNull().default(false),
  checkoutEarliestTime: text("checkout_earliest_time"),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  employeeCode: text("employee_code").notNull().unique(),
  cardNumber: text("card_number"),
  positionId: varchar("position_id"),
  workRuleId: varchar("work_rule_id"),
  companyId: varchar("company_id"),
  workshopId: varchar("workshop_id"),
  phone: text("phone"),
  shift: text("shift").default("morning"),
  contractEndDate: text("contract_end_date"),
  nonRenewalDate: text("non_renewal_date"),
  isActive: boolean("is_active").notNull().default(true),
  hourlyRate: text("hourly_rate").default("0"),
  baseSalary: text("base_salary").default("0"),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: text("date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status").notNull().default("present"),
  lateMinutes: integer("late_minutes").notNull().default(0),
  earlyLeaveMinutes: integer("early_leave_minutes").notNull().default(0),
  middleAbsenceMinutes: integer("middle_absence_minutes").notNull().default(0),
  totalHours: text("total_hours").default("0"),
  penalty: text("penalty").default("0"),
  notes: text("notes"),
  rawPunches: text("raw_punches"),
}, (table) => [
  uniqueIndex("attendance_employee_date_idx").on(table.employeeId, table.date),
]);

export const deviceSettings = pgTable("device_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  port: integer("port").notNull().default(4370),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: text("last_sync_at"),
  workshopId: varchar("workshop_id"),
  serialNumber: varchar("serial_number"),
});

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  username: text("username"),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code").notNull().default(200),
  details: text("details"),
  createdAt: text("created_at").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  employeeName: text("employee_name"),
  employeeCode: text("employee_code"),
  workshopName: text("workshop_name"),
  workRuleName: text("work_rule_name"),
  recordDate: text("record_date"),
  isReverted: integer("is_reverted").default(0),
  revertedAt: text("reverted_at"),
  revertedBy: text("reverted_by"),
});

export const lockedRecords = pgTable("locked_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: text("employee_id").notNull(),
  recordDate: text("record_date").notNull(),
  lockedBy: text("locked_by"),
  lockedAt: text("locked_at"),
  activityLogId: text("activity_log_id"),
});

export const leaves = pgTable("leaves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isPaid: boolean("is_paid").notNull().default(true),
  targetType: text("target_type").notNull().default("all"),
  shiftValue: text("shift_value"),
  workshopId: varchar("workshop_id"),
  employeeId: varchar("employee_id"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
});

export const grants = pgTable("grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  amount: text("amount").notNull(),
  type: text("type").notNull().default("grant"),
  targetType: text("target_type").notNull().default("all"),
  shiftValue: text("shift_value"),
  workshopId: varchar("workshop_id"),
  employeeIds: text("employee_ids"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
});

export const grantConditions = pgTable("grant_conditions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grantId: varchar("grant_id").notNull(),
  conditionType: text("condition_type").notNull(),
  attendancePeriodType: text("attendance_period_type"),
  attendancePeriodValue: text("attendance_period_value"),
  absenceMode: text("absence_mode"),
  daysThreshold: text("days_threshold"),
  weekdayCount: text("weekday_count"),
  weekdays: text("weekdays"),
  minutesThreshold: integer("minutes_threshold"),
  violationsThreshold: integer("violations_threshold"),
  effectType: text("effect_type").notNull(),
  effectAmount: text("effect_amount"),
});

export const workScheduleOverrides = pgTable("work_schedule_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dateFrom: text("date_from").notNull(),
  dateTo: text("date_to").notNull(),
  workRuleId: varchar("work_rule_id"),
  workStartTime: text("work_start_time").notNull(),
  workEndTime: text("work_end_time").notNull(),
  isOvernight: boolean("is_overnight").notNull().default(false),
  notes: text("notes"),
  weeklyOffDays: text("weekly_off_days"),
});

export const frozenArchives = pgTable("frozen_archives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: varchar("month", { length: 7 }).notNull(),
  workshopId: varchar("workshop_id", { length: 36 }).notNull(),
  workRuleId: varchar("work_rule_id", { length: 36 }).notNull(),
  frozenAt: text("frozen_at").notNull(),
  frozenBy: text("frozen_by").notNull(),
  reportJson: text("report_json").notNull(),
}, (table) => [
  uniqueIndex("frozen_archives_month_ws_rule_idx").on(table.month, table.workshopId, table.workRuleId),
]);

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  description: true,
});

export const insertWorkshopSchema = createInsertSchema(workshops).pick({
  name: true,
  description: true,
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  name: true,
  description: true,
});

export const insertWorkRuleSchema = createInsertSchema(workRules).pick({
  name: true,
  workStartTime: true,
  workEndTime: true,
  lateGraceMinutes: true,
  earlyArrivalGraceMinutes: true,
  earlyLeaveGraceMinutes: true,
  lateLeaveGraceMinutes: true,
  latePenaltyPerMinute: true,
  earlyLeavePenaltyPerMinute: true,
  absencePenalty: true,
  isDefault: true,
  is24hShift: true,
  checkoutEarliestTime: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  name: true,
  employeeCode: true,
  cardNumber: true,
  positionId: true,
  workRuleId: true,
  companyId: true,
  workshopId: true,
  phone: true,
  shift: true,
  contractEndDate: true,
  nonRenewalDate: true,
  isActive: true,
  hourlyRate: true,
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).pick({
  employeeId: true,
  date: true,
  checkIn: true,
  checkOut: true,
  status: true,
  lateMinutes: true,
  earlyLeaveMinutes: true,
  middleAbsenceMinutes: true,
  totalHours: true,
  penalty: true,
  notes: true,
  rawPunches: true,
});

export const insertDeviceSettingsSchema = createInsertSchema(deviceSettings).pick({
  name: true,
  ipAddress: true,
  port: true,
  isActive: true,
  lastSyncAt: true,
  workshopId: true,
  serialNumber: true,
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).pick({
  key: true,
  value: true,
});

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
export type FrozenArchive = typeof frozenArchives.$inferSelect;

export const insertLeaveSchema = createInsertSchema(leaves).pick({
  startDate: true, endDate: true, isPaid: true, targetType: true,
  shiftValue: true, workshopId: true, employeeId: true, notes: true, createdAt: true, createdBy: true,
});
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leaves.$inferSelect;

export const insertGrantSchema = createInsertSchema(grants).pick({
  name: true, amount: true, type: true, targetType: true,
  shiftValue: true, workshopId: true, employeeIds: true, createdAt: true, createdBy: true,
});
export type InsertGrant = z.infer<typeof insertGrantSchema>;
export type Grant = typeof grants.$inferSelect;

export const insertGrantConditionSchema = createInsertSchema(grantConditions).pick({
  grantId: true, conditionType: true, attendancePeriodType: true, attendancePeriodValue: true,
  absenceMode: true, daysThreshold: true, weekdayCount: true, weekdays: true,
  minutesThreshold: true, violationsThreshold: true, effectType: true, effectAmount: true,
});
export type InsertGrantCondition = z.infer<typeof insertGrantConditionSchema>;
export type GrantCondition = typeof grantConditions.$inferSelect;

export type GrantWithConditions = Grant & { conditions: GrantCondition[] };

export const insertWorkScheduleOverrideSchema = createInsertSchema(workScheduleOverrides).pick({
  name: true, dateFrom: true, dateTo: true, workRuleId: true,
  workStartTime: true, workEndTime: true, isOvernight: true, notes: true, weeklyOffDays: true,
});
export type InsertWorkScheduleOverride = z.infer<typeof insertWorkScheduleOverrideSchema>;
export type WorkScheduleOverride = typeof workScheduleOverrides.$inferSelect;

export const insertEmployeeDebtSchema = z.object({
  employeeId: z.string(),
  description: z.string(),
  totalAmount: z.string(),
  monthlyDeduction: z.string(),
  remainingAmount: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.string(),
});
export type InsertEmployeeDebt = z.infer<typeof insertEmployeeDebtSchema>;
export type EmployeeDebt = {
  id: string;
  employeeId: string;
  description: string;
  totalAmount: string;
  monthlyDeduction: string;
  remainingAmount: string;
  isActive: boolean;
  createdAt: string;
};

export const insertAdvanceSchema = z.object({
  employeeId: z.string(),
  amount: z.string(),
  advanceDate: z.string(),
  month: z.number(),
  year: z.number(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type InsertAdvance = z.infer<typeof insertAdvanceSchema>;
export type Advance = {
  id: string;
  employeeId: string;
  amount: string;
  advanceDate: string;
  month: number;
  year: number;
  notes: string | null;
  createdAt: string;
};
