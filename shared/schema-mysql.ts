import { mysqlTable, text, varchar, int, boolean, decimal, uniqueIndex } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("auth_users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 191 }).notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).default("staff"),
  allowedShifts: text("allowed_shifts"),
  allowedWorkshopIds: text("allowed_workshop_ids"),
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
  is24hShift: boolean("is_24h_shift").notNull().default(false),
  checkoutEarliestTime: text("checkout_earliest_time"),
  isFlexibleShift: boolean("is_flexible_shift").notNull().default(false),
  flexibleShiftHours: int("flexible_shift_hours").notNull().default(8),
});

export const employees = mysqlTable("employees", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  frenchName: text("french_name"),
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
  hourlyRate: text("hourly_rate").default("0"),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).default("0"),
}, (table) => [
  uniqueIndex("employees_employee_code_idx").on(table.employeeCode),
]);

export const employeeDebts = mysqlTable("employee_debts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 36 }).notNull(),
  description: text("description").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  monthlyDeduction: decimal("monthly_deduction", { precision: 12, scale: 2 }).notNull().default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  lastDeductedMonth: varchar("last_deducted_month", { length: 7 }),
  createdAt: text("created_at").notNull(),
});

export const advances = mysqlTable("advances", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  advanceDate: text("advance_date").notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const deductions = mysqlTable("deductions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  month: int("month").notNull(),
  year: int("year").notNull(),
  reason: text("reason"),
  createdAt: text("created_at").notNull(),
  createdBy: varchar("created_by", { length: 191 }),
});

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
  rawPunches: text("raw_punches"),
  deletedPunches: text("deleted_punches"),
  isManualEdit: boolean("is_manual_edit").notNull().default(false),
}, (table) => [
  uniqueIndex("attendance_employee_date_idx").on(table.employeeId, table.date),
]);

export const syncLocks = mysqlTable("sync_locks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  lockType: varchar("lock_type", { length: 50 }).notNull(),
  employeeId: varchar("employee_id", { length: 36 }),
  date: varchar("date", { length: 20 }),
  employeeCode: varchar("employee_code", { length: 100 }),
  createdAt: varchar("created_at", { length: 50 }).notNull(),
});

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

export const leaves = mysqlTable("leaves", {
  id: varchar("id", { length: 36 }).primaryKey(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isPaid: boolean("is_paid").notNull().default(true),
  targetType: text("target_type").notNull().default("all"),
  shiftValue: text("shift_value"),
  workshopId: varchar("workshop_id", { length: 36 }),
  employeeId: varchar("employee_id", { length: 36 }),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
});

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

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true }).extend({
  role: z.string().optional(),
  allowedShifts: z.string().nullable().optional(),
  allowedWorkshopIds: z.string().nullable().optional(),
});
export const insertCompanySchema = createInsertSchema(companies).pick({ name: true, description: true });
export const insertWorkshopSchema = createInsertSchema(workshops).pick({ name: true, description: true });
export const insertPositionSchema = createInsertSchema(positions).pick({ name: true, description: true });
export const insertWorkRuleSchema = createInsertSchema(workRules).pick({
  name: true, workStartTime: true, workEndTime: true,
  lateGraceMinutes: true, earlyArrivalGraceMinutes: true,
  earlyLeaveGraceMinutes: true, lateLeaveGraceMinutes: true,
  latePenaltyPerMinute: true, earlyLeavePenaltyPerMinute: true, absencePenalty: true, isDefault: true, is24hShift: true,
  isFlexibleShift: true, flexibleShiftHours: true,
});
export const insertEmployeeSchema = createInsertSchema(employees).pick({
  name: true, frenchName: true, employeeCode: true, cardNumber: true, positionId: true, workRuleId: true,
  companyId: true, workshopId: true, phone: true, shift: true,
  contractEndDate: true, nonRenewalDate: true, isActive: true, hourlyRate: true,
});
export const insertAttendanceSchema = createInsertSchema(attendanceRecords).pick({
  employeeId: true, date: true, checkIn: true, checkOut: true, status: true,
  lateMinutes: true, earlyLeaveMinutes: true, middleAbsenceMinutes: true, totalHours: true, penalty: true, notes: true,
  rawPunches: true, deletedPunches: true, isManualEdit: true,
});

export const insertSyncLockSchema = createInsertSchema(syncLocks).pick({
  lockType: true, employeeId: true, date: true, employeeCode: true, createdAt: true,
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
export type InsertSyncLock = z.infer<typeof insertSyncLockSchema>;
export type SyncLock = typeof syncLocks.$inferSelect;
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

export const insertLeaveSchema = createInsertSchema(leaves).pick({
  startDate: true, endDate: true, isPaid: true, targetType: true,
  shiftValue: true, workshopId: true, employeeId: true, notes: true, createdAt: true, createdBy: true,
});
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leaves.$inferSelect;

export const workScheduleOverrides = mysqlTable("work_schedule_overrides", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  dateFrom: text("date_from").notNull(),
  dateTo: text("date_to").notNull(),
  workRuleId: varchar("work_rule_id", { length: 36 }),
  workStartTime: text("work_start_time").notNull(),
  workEndTime: text("work_end_time").notNull(),
  isOvernight: boolean("is_overnight").notNull().default(false),
  notes: text("notes"),
  weeklyOffDays: text("weekly_off_days"),
});

export const grants = mysqlTable("grants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  amount: text("amount").notNull(),
  type: varchar("type", { length: 10 }).notNull().default("grant"),
  targetType: varchar("target_type", { length: 20 }).notNull().default("all"),
  shiftValue: text("shift_value"),
  workshopId: varchar("workshop_id", { length: 36 }),
  employeeIds: text("employee_ids"),
  excludedEmployeeIds: text("excluded_employee_ids"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
});

export const grantConditions = mysqlTable("grant_conditions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  grantId: varchar("grant_id", { length: 36 }).notNull(),
  conditionType: varchar("condition_type", { length: 30 }).notNull(),
  attendancePeriodType: text("attendance_period_type"),
  attendancePeriodValue: text("attendance_period_value"),
  absenceMode: varchar("absence_mode", { length: 10 }),
  daysThreshold: varchar("days_threshold", { length: 10 }),
  weekdayCount: varchar("weekday_count", { length: 10 }),
  weekdays: text("weekdays"),
  minutesThreshold: int("minutes_threshold"),
  violationsThreshold: int("violations_threshold"),
  effectType: varchar("effect_type", { length: 10 }).notNull(),
  effectAmount: text("effect_amount"),
});

export const insertGrantSchema = createInsertSchema(grants).pick({
  name: true, amount: true, type: true, targetType: true,
  shiftValue: true, workshopId: true, employeeIds: true, excludedEmployeeIds: true, createdAt: true, createdBy: true,
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

export const salaryPayments = mysqlTable("salary_payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 36 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  remainingBalance: decimal("remaining_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("salary_payments_emp_month_idx").on(table.employeeId, table.month),
]);

export const insertSalaryPaymentSchema = createInsertSchema(salaryPayments).pick({
  employeeId: true, month: true, amountPaid: true, remainingBalance: true, createdAt: true,
});
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;
export type SalaryPayment = typeof salaryPayments.$inferSelect;

export const insertEmployeeDebtSchema = createInsertSchema(employeeDebts).pick({
  employeeId: true, description: true, totalAmount: true, monthlyDeduction: true, remainingAmount: true, isActive: true, lastDeductedMonth: true, createdAt: true,
});
export type InsertEmployeeDebt = z.infer<typeof insertEmployeeDebtSchema>;
export type EmployeeDebt = typeof employeeDebts.$inferSelect;

export const insertAdvanceSchema = createInsertSchema(advances).pick({
  employeeId: true, amount: true, advanceDate: true, month: true, year: true, notes: true, createdAt: true,
});
export type InsertAdvance = z.infer<typeof insertAdvanceSchema>;
export type Advance = typeof advances.$inferSelect;

export const insertDeductionSchema = createInsertSchema(deductions).pick({
  employeeId: true, amount: true, month: true, year: true, reason: true, createdAt: true, createdBy: true,
});
export type InsertDeduction = z.infer<typeof insertDeductionSchema>;
export type Deduction = typeof deductions.$inferSelect;
