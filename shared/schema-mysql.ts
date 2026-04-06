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
  wage: text("wage").default("0"),
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

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertCompanySchema = createInsertSchema(companies).pick({ name: true, description: true });
export const insertWorkshopSchema = createInsertSchema(workshops).pick({ name: true, description: true });
export const insertPositionSchema = createInsertSchema(positions).pick({ name: true, description: true });
export const insertWorkRuleSchema = createInsertSchema(workRules).pick({
  name: true, workStartTime: true, workEndTime: true, lateGraceMinutes: true,
  latePenaltyPerMinute: true, earlyLeavePenaltyPerMinute: true, absencePenalty: true, isDefault: true,
});
export const insertEmployeeSchema = createInsertSchema(employees).pick({
  name: true, employeeCode: true, cardNumber: true, positionId: true, workRuleId: true,
  companyId: true, workshopId: true, phone: true, wage: true, shift: true,
  contractEndDate: true, nonRenewalDate: true, isActive: true,
});
export const insertAttendanceSchema = createInsertSchema(attendanceRecords).pick({
  employeeId: true, date: true, checkIn: true, checkOut: true, status: true,
  lateMinutes: true, earlyLeaveMinutes: true, totalHours: true, penalty: true, notes: true,
});
export const insertDeviceSettingsSchema = createInsertSchema(deviceSettings).pick({
  name: true, ipAddress: true, port: true, isActive: true, lastSyncAt: true, workshopId: true, serialNumber: true,
});
export const insertAppSettingsSchema = createInsertSchema(appSettings).pick({ key: true, value: true });

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
