import { randomUUID } from "crypto";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { db } from "./db";
import * as schema from "../shared/schema-mysql";
import type {
  InsertUser, User,
  InsertCompany, Company,
  InsertWorkshop, Workshop,
  InsertPosition, Position,
  InsertWorkRule, WorkRule,
  InsertEmployee, Employee,
  InsertAttendance, AttendanceRecord,
  InsertDeviceSettings, DeviceSettings,
  InsertAppSettings, AppSettings,
  InsertActivityLog, ActivityLog,
  InsertFrozenArchive, FrozenArchive,
  InsertLockedRecord, LockedRecord,
  InsertLeave, Leave,
  InsertGrant, InsertGrantCondition, GrantCondition, GrantWithConditions,
  InsertWorkScheduleOverride, WorkScheduleOverride,
  InsertEmployeeDebt, EmployeeDebt,
  InsertAdvance, Advance,
  InsertDeduction, Deduction,
  SalaryPayment,
} from "@shared/schema";
import { pool } from "./db";
import type { IStorage } from "./storage";

const mysqlDb = db as MySql2Database<typeof schema>;

export class MysqlStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await mysqlDb.select().from(schema.users).where(eq(schema.users.id, id));
    return user as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await mysqlDb.select().from(schema.users).where(eq(schema.users.username, username));
    return user as User | undefined;
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    await mysqlDb.insert(schema.users).values({ id, username: data.username, password: data.password });
    const [result] = await mysqlDb.select().from(schema.users).where(eq(schema.users.id, id));
    return result as User;
  }

  async renameUser(oldUsername: string, newUsername: string): Promise<void> {
    await mysqlDb.update(schema.users)
      .set({ username: newUsername })
      .where(eq(schema.users.username, oldUsername));
  }

  async getCompanies(): Promise<Company[]> {
    return mysqlDb.select().from(schema.companies) as Promise<Company[]>;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [c] = await mysqlDb.select().from(schema.companies).where(eq(schema.companies.id, id));
    return c as Company | undefined;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const id = randomUUID();
    await mysqlDb.insert(schema.companies).values({ id, name: data.name, description: data.description ?? null });
    const [result] = await mysqlDb.select().from(schema.companies).where(eq(schema.companies.id, id));
    return result as Company;
  }

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company | undefined> {
    await mysqlDb.update(schema.companies).set(data).where(eq(schema.companies.id, id));
    const [result] = await mysqlDb.select().from(schema.companies).where(eq(schema.companies.id, id));
    return result as Company | undefined;
  }

  async deleteCompany(id: string): Promise<void> {
    await mysqlDb.delete(schema.companies).where(eq(schema.companies.id, id));
  }

  async getWorkshops(): Promise<Workshop[]> {
    return mysqlDb.select().from(schema.workshops) as Promise<Workshop[]>;
  }

  async getWorkshop(id: string): Promise<Workshop | undefined> {
    const [w] = await mysqlDb.select().from(schema.workshops).where(eq(schema.workshops.id, id));
    return w as Workshop | undefined;
  }

  async createWorkshop(data: InsertWorkshop): Promise<Workshop> {
    const id = randomUUID();
    await mysqlDb.insert(schema.workshops).values({ id, name: data.name, description: data.description ?? null });
    const [result] = await mysqlDb.select().from(schema.workshops).where(eq(schema.workshops.id, id));
    return result as Workshop;
  }

  async updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop | undefined> {
    await mysqlDb.update(schema.workshops).set(data).where(eq(schema.workshops.id, id));
    const [result] = await mysqlDb.select().from(schema.workshops).where(eq(schema.workshops.id, id));
    return result as Workshop | undefined;
  }

  async deleteWorkshop(id: string): Promise<void> {
    await mysqlDb.delete(schema.workshops).where(eq(schema.workshops.id, id));
  }

  async getPositions(): Promise<Position[]> {
    return mysqlDb.select().from(schema.positions) as Promise<Position[]>;
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const [pos] = await mysqlDb.select().from(schema.positions).where(eq(schema.positions.id, id));
    return pos as Position | undefined;
  }

  async createPosition(data: InsertPosition): Promise<Position> {
    const id = randomUUID();
    await mysqlDb.insert(schema.positions).values({ id, name: data.name, description: data.description ?? null });
    const [result] = await mysqlDb.select().from(schema.positions).where(eq(schema.positions.id, id));
    return result as Position;
  }

  async updatePosition(id: string, data: Partial<InsertPosition>): Promise<Position | undefined> {
    await mysqlDb.update(schema.positions).set(data).where(eq(schema.positions.id, id));
    const [result] = await mysqlDb.select().from(schema.positions).where(eq(schema.positions.id, id));
    return result as Position | undefined;
  }

  async deletePosition(id: string): Promise<void> {
    await mysqlDb.delete(schema.positions).where(eq(schema.positions.id, id));
  }

  async getWorkRules(): Promise<WorkRule[]> {
    return mysqlDb.select().from(schema.workRules) as Promise<WorkRule[]>;
  }

  async getWorkRule(id: string): Promise<WorkRule | undefined> {
    const [rule] = await mysqlDb.select().from(schema.workRules).where(eq(schema.workRules.id, id));
    return rule as WorkRule | undefined;
  }

  async createWorkRule(data: InsertWorkRule): Promise<WorkRule> {
    const id = randomUUID();
    await mysqlDb.insert(schema.workRules).values({
      id,
      name: data.name,
      workStartTime: data.workStartTime,
      workEndTime: data.workEndTime,
      lateGraceMinutes: data.lateGraceMinutes ?? 0,
      earlyArrivalGraceMinutes: data.earlyArrivalGraceMinutes ?? 0,
      earlyLeaveGraceMinutes: data.earlyLeaveGraceMinutes ?? 0,
      lateLeaveGraceMinutes: data.lateLeaveGraceMinutes ?? 0,
      latePenaltyPerMinute: data.latePenaltyPerMinute,
      earlyLeavePenaltyPerMinute: data.earlyLeavePenaltyPerMinute,
      absencePenalty: data.absencePenalty,
      isDefault: data.isDefault,
      is24hShift: data.is24hShift ?? false,
      checkoutEarliestTime: data.checkoutEarliestTime ?? null,
    });
    const [result] = await mysqlDb.select().from(schema.workRules).where(eq(schema.workRules.id, id));
    return result as WorkRule;
  }

  async updateWorkRule(id: string, data: Partial<InsertWorkRule>): Promise<WorkRule | undefined> {
    await mysqlDb.update(schema.workRules).set(data).where(eq(schema.workRules.id, id));
    const [result] = await mysqlDb.select().from(schema.workRules).where(eq(schema.workRules.id, id));
    return result as WorkRule | undefined;
  }

  async deleteWorkRule(id: string): Promise<void> {
    await mysqlDb.delete(schema.workRules).where(eq(schema.workRules.id, id));
  }

  async getEmployees(): Promise<Employee[]> {
    return mysqlDb.select().from(schema.employees) as Promise<Employee[]>;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [emp] = await mysqlDb.select().from(schema.employees).where(eq(schema.employees.id, id));
    return emp as Employee | undefined;
  }

  async getEmployeeByCode(code: string): Promise<Employee | undefined> {
    const [emp] = await mysqlDb.select().from(schema.employees).where(eq(schema.employees.employeeCode, code));
    return emp as Employee | undefined;
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    await mysqlDb.insert(schema.employees).values({
      id,
      name: data.name,
      frenchName: data.frenchName ?? null,
      employeeCode: data.employeeCode,
      cardNumber: data.cardNumber ?? null,
      positionId: data.positionId ?? null,
      workRuleId: data.workRuleId ?? null,
      companyId: data.companyId ?? null,
      workshopId: data.workshopId ?? null,
      phone: data.phone ?? null,
      shift: data.shift ?? "morning",
      contractEndDate: data.contractEndDate ?? null,
      nonRenewalDate: data.nonRenewalDate ?? null,
      isActive: data.isActive ?? true,
      hourlyRate: data.hourlyRate ?? "0",
    });
    const [result] = await mysqlDb.select().from(schema.employees).where(eq(schema.employees.id, id));
    return result as Employee;
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    await mysqlDb.update(schema.employees).set(data).where(eq(schema.employees.id, id));
    const [result] = await mysqlDb.select().from(schema.employees).where(eq(schema.employees.id, id));
    return result as Employee | undefined;
  }

  async deleteEmployee(id: string): Promise<void> {
    await mysqlDb.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.employeeId, id));
    await mysqlDb.delete(schema.advances).where(eq(schema.advances.employeeId, id));
    await mysqlDb.delete(schema.employeeDebts).where(eq(schema.employeeDebts.employeeId, id));
    try {
      await mysqlDb.delete(schema.leaves).where(eq(schema.leaves.employeeId, id));
    } catch { /* collation mismatch on some MySQL setups — non-fatal */ }
    await mysqlDb.delete(schema.employees).where(eq(schema.employees.id, id));
  }

  async getAttendanceById(id: string): Promise<AttendanceRecord | undefined> {
    const [record] = await mysqlDb.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, id));
    return record as AttendanceRecord | undefined;
  }

  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    return mysqlDb.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.date, date)) as Promise<AttendanceRecord[]>;
  }

  async getAttendanceByEmployee(employeeId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return mysqlDb.select().from(schema.attendanceRecords).where(
      and(
        eq(schema.attendanceRecords.employeeId, employeeId),
        gte(schema.attendanceRecords.date, startDate),
        lte(schema.attendanceRecords.date, endDate),
      ),
    ) as Promise<AttendanceRecord[]>;
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return mysqlDb.select().from(schema.attendanceRecords).where(
      and(
        gte(schema.attendanceRecords.date, startDate),
        lte(schema.attendanceRecords.date, endDate),
      ),
    ) as Promise<AttendanceRecord[]>;
  }

  async getAttendanceByEmployeeAndDate(employeeId: string, date: string): Promise<AttendanceRecord | undefined> {
    const [record] = await mysqlDb.select().from(schema.attendanceRecords).where(
      and(
        eq(schema.attendanceRecords.employeeId, employeeId),
        eq(schema.attendanceRecords.date, date),
      ),
    );
    return record as AttendanceRecord | undefined;
  }

  async createAttendance(data: InsertAttendance): Promise<AttendanceRecord> {
    const id = randomUUID();
    await mysqlDb.insert(schema.attendanceRecords).values({
      id,
      employeeId: data.employeeId,
      date: data.date,
      checkIn: data.checkIn ?? null,
      checkOut: data.checkOut ?? null,
      status: data.status ?? "present",
      lateMinutes: data.lateMinutes ?? 0,
      earlyLeaveMinutes: data.earlyLeaveMinutes ?? 0,
      middleAbsenceMinutes: data.middleAbsenceMinutes ?? 0,
      totalHours: data.totalHours ?? "0",
      penalty: data.penalty ?? "0",
      notes: data.notes ?? null,
      rawPunches: data.rawPunches ?? null,
      deletedPunches: data.deletedPunches ?? null,
    });
    const [result] = await mysqlDb.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, id));
    return result as AttendanceRecord;
  }

  async updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    await mysqlDb.update(schema.attendanceRecords).set(data).where(eq(schema.attendanceRecords.id, id));
    const [result] = await mysqlDb.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, id));
    return result as AttendanceRecord | undefined;
  }

  async deleteAttendance(id: string): Promise<void> {
    await mysqlDb.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, id));
  }

  async getDeviceSettings(): Promise<DeviceSettings[]> {
    return mysqlDb.select().from(schema.deviceSettings) as Promise<DeviceSettings[]>;
  }

  async getDeviceSetting(id: string): Promise<DeviceSettings | undefined> {
    const [setting] = await mysqlDb.select().from(schema.deviceSettings).where(eq(schema.deviceSettings.id, id));
    return setting as DeviceSettings | undefined;
  }

  async createDeviceSetting(data: InsertDeviceSettings): Promise<DeviceSettings> {
    const id = randomUUID();
    await mysqlDb.insert(schema.deviceSettings).values({
      id,
      name: data.name,
      ipAddress: data.ipAddress,
      port: data.port ?? 4370,
      isActive: data.isActive ?? true,
      lastSyncAt: data.lastSyncAt ?? null,
      workshopId: data.workshopId ?? null,
      serialNumber: data.serialNumber ?? null,
    });
    const [result] = await mysqlDb.select().from(schema.deviceSettings).where(eq(schema.deviceSettings.id, id));
    return result as DeviceSettings;
  }

  async updateDeviceSetting(id: string, data: Partial<InsertDeviceSettings>): Promise<DeviceSettings | undefined> {
    await mysqlDb.update(schema.deviceSettings).set(data).where(eq(schema.deviceSettings.id, id));
    const [result] = await mysqlDb.select().from(schema.deviceSettings).where(eq(schema.deviceSettings.id, id));
    return result as DeviceSettings | undefined;
  }

  async deleteDeviceSetting(id: string): Promise<void> {
    await mysqlDb.delete(schema.deviceSettings).where(eq(schema.deviceSettings.id, id));
  }

  async getAppSetting(key: string): Promise<AppSettings | undefined> {
    const [setting] = await mysqlDb.select().from(schema.appSettings).where(eq(schema.appSettings.key, key));
    return setting as AppSettings | undefined;
  }

  async setAppSetting(key: string, value: string): Promise<AppSettings> {
    const existing = await this.getAppSetting(key);
    if (existing) {
      await mysqlDb.update(schema.appSettings).set({ value }).where(eq(schema.appSettings.id, existing.id));
      const [result] = await mysqlDb.select().from(schema.appSettings).where(eq(schema.appSettings.id, existing.id));
      if (!result) throw new Error(`Failed to update app setting: ${key}`);
      return result as AppSettings;
    }
    const id = randomUUID();
    await mysqlDb.insert(schema.appSettings).values({ id, key, value });
    const [result] = await mysqlDb.select().from(schema.appSettings).where(eq(schema.appSettings.id, id));
    return result as AppSettings;
  }

  async initActivityLogs(): Promise<void> {
    const rawPool = pool as import("mysql2/promise").Pool;
    await rawPool.query(`CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36),
      username VARCHAR(191),
      method VARCHAR(10) NOT NULL,
      path TEXT NOT NULL,
      status_code INT NOT NULL DEFAULT 200,
      details TEXT,
      created_at VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(36),
      old_values TEXT,
      new_values TEXT,
      employee_name VARCHAR(191),
      employee_code VARCHAR(50),
      workshop_name VARCHAR(191),
      work_rule_name VARCHAR(191),
      record_date VARCHAR(20),
      is_reverted TINYINT(1) DEFAULT 0,
      reverted_at VARCHAR(50),
      reverted_by VARCHAR(191)
    )`);
    await rawPool.query(`CREATE TABLE IF NOT EXISTS locked_records (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      record_date VARCHAR(20) NOT NULL,
      locked_by VARCHAR(191),
      locked_at VARCHAR(50),
      activity_log_id VARCHAR(36)
    )`);
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    await mysqlDb.insert(schema.activityLogs).values({ id, ...data });
    const [result] = await mysqlDb.select().from(schema.activityLogs).where(eq(schema.activityLogs.id, id));
    return result as ActivityLog;
  }

  async getActivityLog(id: string): Promise<ActivityLog | undefined> {
    const [result] = await mysqlDb.select().from(schema.activityLogs).where(eq(schema.activityLogs.id, id));
    return result as ActivityLog | undefined;
  }

  async getActivityLogs(limit = 500): Promise<ActivityLog[]> {
    const results = await mysqlDb
      .select()
      .from(schema.activityLogs)
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit);
    return results as ActivityLog[];
  }

  async revertActivityLog(id: string, revertedBy: string): Promise<void> {
    const now = new Date().toISOString();
    await mysqlDb.update(schema.activityLogs)
      .set({ isReverted: 1, revertedAt: now, revertedBy })
      .where(eq(schema.activityLogs.id, id));
  }

  async deleteActivityLog(id: string): Promise<void> {
    await mysqlDb.delete(schema.activityLogs).where(eq(schema.activityLogs.id, id));
  }

  async isRecordLocked(employeeId: string, recordDate: string): Promise<boolean> {
    const results = await mysqlDb
      .select()
      .from(schema.lockedRecords)
      .where(and(
        eq(schema.lockedRecords.employeeId, employeeId),
        eq(schema.lockedRecords.recordDate, recordDate)
      ))
      .limit(1);
    return results.length > 0;
  }

  async lockRecord(data: InsertLockedRecord): Promise<LockedRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();
    await mysqlDb.insert(schema.lockedRecords).values({
      id,
      employeeId: data.employeeId,
      recordDate: data.recordDate,
      lockedBy: data.lockedBy ?? null,
      lockedAt: data.lockedAt ?? now,
      activityLogId: data.activityLogId ?? null,
    });
    const [result] = await mysqlDb.select().from(schema.lockedRecords).where(eq(schema.lockedRecords.id, id));
    return result as LockedRecord;
  }

  async getFrozenArchives(month: string): Promise<FrozenArchive[]> {
    const results = await mysqlDb
      .select()
      .from(schema.frozenArchives)
      .where(eq(schema.frozenArchives.month, month));
    return results as FrozenArchive[];
  }

  async getAllFrozenArchives(): Promise<FrozenArchive[]> {
    const results = await mysqlDb.select().from(schema.frozenArchives);
    return results as FrozenArchive[];
  }

  async getFrozenArchive(id: string): Promise<FrozenArchive | undefined> {
    const [result] = await mysqlDb.select().from(schema.frozenArchives).where(eq(schema.frozenArchives.id, id));
    return result as FrozenArchive | undefined;
  }

  async createFrozenArchive(data: InsertFrozenArchive): Promise<FrozenArchive> {
    const id = randomUUID();
    await mysqlDb.insert(schema.frozenArchives).values({ id, ...data });
    const [result] = await mysqlDb.select().from(schema.frozenArchives).where(eq(schema.frozenArchives.id, id));
    return result as FrozenArchive;
  }

  async deleteFrozenArchive(id: string): Promise<void> {
    await mysqlDb.delete(schema.frozenArchives).where(eq(schema.frozenArchives.id, id));
  }

  async getLeaves(): Promise<Leave[]> {
    const results = await mysqlDb.select().from(schema.leaves).orderBy(desc(schema.leaves.startDate));
    return results as Leave[];
  }

  async createLeave(data: InsertLeave): Promise<Leave> {
    const id = randomUUID();
    await mysqlDb.insert(schema.leaves).values({
      id,
      startDate: data.startDate,
      endDate: data.endDate,
      isPaid: data.isPaid ?? true,
      targetType: data.targetType ?? "all",
      shiftValue: data.shiftValue ?? null,
      workshopId: data.workshopId ?? null,
      employeeId: data.employeeId ?? null,
      notes: data.notes ?? null,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
    });
    const [result] = await mysqlDb.select().from(schema.leaves).where(eq(schema.leaves.id, id));
    return result as Leave;
  }

  async deleteLeave(id: string): Promise<void> {
    await mysqlDb.delete(schema.leaves).where(eq(schema.leaves.id, id));
  }

  async getGrants(): Promise<GrantWithConditions[]> {
    const grantList = await mysqlDb.select().from(schema.grants).orderBy(desc(schema.grants.createdAt));
    const condList = await mysqlDb.select().from(schema.grantConditions);
    return grantList.map(g => ({
      id: g.id,
      name: g.name,
      amount: g.amount,
      type: g.type,
      targetType: g.targetType,
      shiftValue: g.shiftValue ?? null,
      workshopId: g.workshopId ?? null,
      employeeIds: g.employeeIds ?? null,
      excludedEmployeeIds: (g as any).excludedEmployeeIds ?? null,
      createdAt: g.createdAt,
      createdBy: g.createdBy,
      conditions: condList
        .filter(c => c.grantId === g.id)
        .map(c => ({
          id: c.id,
          grantId: c.grantId,
          conditionType: c.conditionType,
          attendancePeriodType: c.attendancePeriodType ?? null,
          attendancePeriodValue: c.attendancePeriodValue ?? null,
          absenceMode: c.absenceMode ?? null,
          daysThreshold: c.daysThreshold ?? null,
          weekdayCount: c.weekdayCount ?? null,
          weekdays: c.weekdays ?? null,
          minutesThreshold: c.minutesThreshold ?? null,
          violationsThreshold: c.violationsThreshold ?? null,
          effectType: c.effectType,
          effectAmount: c.effectAmount ?? null,
        })),
    }));
  }

  async createGrant(data: InsertGrant, conditions: Omit<InsertGrantCondition, "grantId">[]): Promise<GrantWithConditions> {
    const id = randomUUID();
    await (mysqlDb.insert(schema.grants) as any).values({
      id,
      name: data.name,
      amount: data.amount,
      type: String(data.type ?? "grant"),
      targetType: String(data.targetType ?? "all"),
      shiftValue: data.shiftValue ?? null,
      workshopId: data.workshopId ?? null,
      employeeIds: data.employeeIds ?? null,
      excludedEmployeeIds: (data as any).excludedEmployeeIds ?? null,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
    });
    const [g] = await mysqlDb.select().from(schema.grants).where(eq(schema.grants.id, id));
    const builtConditions: GrantCondition[] = [];
    for (const c of conditions) {
      const cid = randomUUID();
      await mysqlDb.insert(schema.grantConditions).values({
        id: cid,
        grantId: id,
        conditionType: c.conditionType,
        attendancePeriodType: c.attendancePeriodType ?? null,
        attendancePeriodValue: c.attendancePeriodValue ?? null,
        absenceMode: c.absenceMode != null ? String(c.absenceMode) : null,
        daysThreshold: c.daysThreshold != null ? String(c.daysThreshold) : null,
        weekdayCount: c.weekdayCount != null ? String(c.weekdayCount) : null,
        weekdays: c.weekdays ?? null,
        minutesThreshold: c.minutesThreshold ?? null,
        violationsThreshold: c.violationsThreshold ?? null,
        effectType: c.effectType,
        effectAmount: c.effectAmount ?? null,
      });
      const [row] = await mysqlDb.select().from(schema.grantConditions).where(eq(schema.grantConditions.id, cid));
      builtConditions.push({
        id: row.id,
        grantId: row.grantId,
        conditionType: row.conditionType,
        attendancePeriodType: row.attendancePeriodType ?? null,
        attendancePeriodValue: row.attendancePeriodValue ?? null,
        absenceMode: row.absenceMode ?? null,
        daysThreshold: row.daysThreshold ?? null,
        weekdayCount: row.weekdayCount ?? null,
        weekdays: row.weekdays ?? null,
        minutesThreshold: row.minutesThreshold ?? null,
        violationsThreshold: row.violationsThreshold ?? null,
        effectType: row.effectType,
        effectAmount: row.effectAmount ?? null,
      });
    }
    return {
      id: g.id,
      name: g.name,
      amount: g.amount,
      type: g.type,
      targetType: g.targetType,
      shiftValue: g.shiftValue ?? null,
      workshopId: g.workshopId ?? null,
      employeeIds: g.employeeIds ?? null,
      excludedEmployeeIds: (g as any).excludedEmployeeIds ?? null,
      createdAt: g.createdAt,
      createdBy: g.createdBy,
      conditions: builtConditions,
    };
  }

  async updateGrant(id: string, data: Partial<InsertGrant>, conditions: Omit<InsertGrantCondition, "grantId">[]): Promise<GrantWithConditions> {
    const rawPool = pool as import("mysql2/promise").Pool;
    const sets: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) { sets.push("name=?"); params.push(data.name); }
    if (data.amount !== undefined) { sets.push("amount=?"); params.push(data.amount); }
    if (data.type !== undefined) { sets.push("type=?"); params.push(data.type); }
    if (data.targetType !== undefined) { sets.push("target_type=?"); params.push(data.targetType); }
    if ("shiftValue" in data) { sets.push("shift_value=?"); params.push(data.shiftValue ?? null); }
    if ("workshopId" in data) { sets.push("workshop_id=?"); params.push(data.workshopId ?? null); }
    if ("employeeIds" in data) { sets.push("employee_ids=?"); params.push(data.employeeIds ?? null); }
    if ("excludedEmployeeIds" in data) { sets.push("excluded_employee_ids=?"); params.push((data as any).excludedEmployeeIds ?? null); }
    if (sets.length > 0) {
      params.push(id);
      await rawPool.query(`UPDATE grants SET ${sets.join(",")} WHERE id=?`, params);
    }
    await mysqlDb.delete(schema.grantConditions).where(eq(schema.grantConditions.grantId, id));
    const builtConditions: GrantCondition[] = [];
    for (const c of conditions) {
      const cid = randomUUID();
      await mysqlDb.insert(schema.grantConditions).values({
        id: cid, grantId: id, conditionType: c.conditionType,
        attendancePeriodType: c.attendancePeriodType ?? null,
        attendancePeriodValue: c.attendancePeriodValue ?? null,
        absenceMode: c.absenceMode != null ? String(c.absenceMode) : null,
        daysThreshold: c.daysThreshold != null ? String(c.daysThreshold) : null,
        weekdayCount: c.weekdayCount != null ? String(c.weekdayCount) : null,
        weekdays: c.weekdays ?? null,
        minutesThreshold: c.minutesThreshold ?? null,
        violationsThreshold: c.violationsThreshold ?? null,
        effectType: c.effectType,
        effectAmount: c.effectAmount ?? null,
      });
      const [row] = await mysqlDb.select().from(schema.grantConditions).where(eq(schema.grantConditions.id, cid));
      builtConditions.push({
        id: row.id, grantId: row.grantId, conditionType: row.conditionType,
        attendancePeriodType: row.attendancePeriodType ?? null,
        attendancePeriodValue: row.attendancePeriodValue ?? null,
        absenceMode: row.absenceMode ?? null, daysThreshold: row.daysThreshold ?? null,
        weekdayCount: row.weekdayCount ?? null, weekdays: row.weekdays ?? null,
        minutesThreshold: row.minutesThreshold ?? null, violationsThreshold: row.violationsThreshold ?? null,
        effectType: row.effectType, effectAmount: row.effectAmount ?? null,
      });
    }
    const [g] = await mysqlDb.select().from(schema.grants).where(eq(schema.grants.id, id));
    return {
      id: g.id, name: g.name, amount: g.amount, type: g.type, targetType: g.targetType,
      shiftValue: g.shiftValue ?? null, workshopId: g.workshopId ?? null,
      employeeIds: g.employeeIds ?? null, excludedEmployeeIds: (g as any).excludedEmployeeIds ?? null,
      createdAt: g.createdAt, createdBy: g.createdBy, conditions: builtConditions,
    };
  }

  async deleteGrant(id: string): Promise<void> {
    await mysqlDb.delete(schema.grantConditions).where(eq(schema.grantConditions.grantId, id));
    await mysqlDb.delete(schema.grants).where(eq(schema.grants.id, id));
  }

  async getScheduleOverrides(): Promise<WorkScheduleOverride[]> {
    return mysqlDb.select().from(schema.workScheduleOverrides) as Promise<WorkScheduleOverride[]>;
  }

  async getScheduleOverride(id: string): Promise<WorkScheduleOverride | undefined> {
    const [row] = await mysqlDb.select().from(schema.workScheduleOverrides).where(eq(schema.workScheduleOverrides.id, id));
    return row as WorkScheduleOverride | undefined;
  }

  async createScheduleOverride(data: InsertWorkScheduleOverride): Promise<WorkScheduleOverride> {
    const id = randomUUID();
    await mysqlDb.insert(schema.workScheduleOverrides).values({
      id,
      name: data.name,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      workRuleId: data.workRuleId ?? null,
      workStartTime: data.workStartTime,
      workEndTime: data.workEndTime,
      isOvernight: data.isOvernight ?? false,
      notes: data.notes ?? null,
      weeklyOffDays: data.weeklyOffDays ?? null,
    });
    const [row] = await mysqlDb.select().from(schema.workScheduleOverrides).where(eq(schema.workScheduleOverrides.id, id));
    return row as WorkScheduleOverride;
  }

  async updateScheduleOverride(id: string, data: Partial<InsertWorkScheduleOverride>): Promise<WorkScheduleOverride | undefined> {
    await mysqlDb.update(schema.workScheduleOverrides).set(data).where(eq(schema.workScheduleOverrides.id, id));
    const [row] = await mysqlDb.select().from(schema.workScheduleOverrides).where(eq(schema.workScheduleOverrides.id, id));
    return row as WorkScheduleOverride | undefined;
  }

  async deleteScheduleOverride(id: string): Promise<void> {
    await mysqlDb.delete(schema.workScheduleOverrides).where(eq(schema.workScheduleOverrides.id, id));
  }

  async getDebtSkips(month: string): Promise<string[]> {
    const rawPool = pool as import("mysql2/promise").Pool;
    const [rows] = await rawPool.query(
      `SELECT employee_id FROM debt_skips WHERE month = ?`, [month]
    ) as [any[], any];
    return rows.map((r: any) => r.employee_id);
  }

  async addDebtSkip(employeeId: string, month: string): Promise<void> {
    const rawPool = pool as import("mysql2/promise").Pool;
    await rawPool.query(
      `INSERT IGNORE INTO debt_skips (id, employee_id, month, created_at) VALUES (UUID(), ?, ?, ?)`,
      [employeeId, month, new Date().toISOString()]
    );
  }

  async removeDebtSkip(employeeId: string, month: string): Promise<void> {
    const rawPool = pool as import("mysql2/promise").Pool;
    await rawPool.query(
      `DELETE FROM debt_skips WHERE employee_id = ? AND month = ?`,
      [employeeId, month]
    );
  }

  async getAttendanceScoreOverride(employeeId: string, month: string): Promise<number | null> {
    const rawPool = pool as import("mysql2/promise").Pool;
    const [rows] = await rawPool.query(
      `SELECT score FROM attendance_score_overrides WHERE employee_id = ? AND month = ?`,
      [employeeId, month]
    ) as [any[], any];
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return parseFloat(rows[0].score);
  }

  async getAttendanceScoreOverrides(month: string): Promise<Record<string, number>> {
    const rawPool = pool as import("mysql2/promise").Pool;
    const [rows] = await rawPool.query(
      `SELECT employee_id, score FROM attendance_score_overrides WHERE month = ?`,
      [month]
    ) as [any[], any];
    const result: Record<string, number> = {};
    if (Array.isArray(rows)) {
      for (const r of rows) result[r.employee_id] = parseFloat(r.score);
    }
    return result;
  }

  async setAttendanceScoreOverride(employeeId: string, month: string, score: number): Promise<void> {
    const rawPool = pool as import("mysql2/promise").Pool;
    await rawPool.query(
      `INSERT INTO attendance_score_overrides (id, employee_id, month, score, created_at)
       VALUES (UUID(), ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score)`,
      [employeeId, month, score, new Date().toISOString()]
    );
  }

  async deleteAttendanceScoreOverride(employeeId: string, month: string): Promise<void> {
    const rawPool = pool as import("mysql2/promise").Pool;
    await rawPool.query(
      `DELETE FROM attendance_score_overrides WHERE employee_id = ? AND month = ?`,
      [employeeId, month]
    );
  }

  async initPayrollTables(): Promise<void> {
    const rawPool = pool as import("mysql2/promise").Pool;
    // MySQL < 8.0 doesn't support ADD COLUMN IF NOT EXISTS; use information_schema check instead
    const [cols] = await rawPool.query(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='employees' AND COLUMN_NAME='base_salary'`
    ) as [any[], any];
    if (!Array.isArray(cols) || cols.length === 0) {
      await rawPool.query(`ALTER TABLE employees ADD COLUMN base_salary DECIMAL(12,2) DEFAULT 0`);
    } else if (cols[0].DATA_TYPE !== 'decimal') {
      await rawPool.query(`ALTER TABLE employees MODIFY COLUMN base_salary DECIMAL(12,2) DEFAULT 0`);
    }
    await rawPool.query(`CREATE TABLE IF NOT EXISTS employee_debts (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      description TEXT NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      monthly_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
      remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at VARCHAR(50) NOT NULL
    )`);
    await rawPool.query(`CREATE TABLE IF NOT EXISTS advances (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      advance_date VARCHAR(50) NOT NULL,
      month INT NOT NULL,
      year INT NOT NULL,
      notes TEXT,
      created_at VARCHAR(50) NOT NULL
    )`);
    // Migrate existing VARCHAR columns to DECIMAL if needed
    const [debtCols] = await rawPool.query(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='employee_debts' AND COLUMN_NAME IN ('total_amount','monthly_deduction','remaining_amount') AND DATA_TYPE != 'decimal'`
    ) as [any[], any];
    if (Array.isArray(debtCols) && debtCols.length > 0) {
      await rawPool.query(`ALTER TABLE employee_debts MODIFY COLUMN total_amount DECIMAL(12,2) NOT NULL DEFAULT 0, MODIFY COLUMN monthly_deduction DECIMAL(12,2) NOT NULL DEFAULT 0, MODIFY COLUMN remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0`);
    }
    // إضافة عمود last_deducted_month إن لم يكن موجوداً
    const [ldmCols] = await rawPool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='employee_debts' AND COLUMN_NAME='last_deducted_month'`
    ) as [any[], any];
    if (!Array.isArray(ldmCols) || ldmCols.length === 0) {
      await rawPool.query(`ALTER TABLE employee_debts ADD COLUMN last_deducted_month VARCHAR(7) NULL DEFAULT NULL`);
    }
    const [advCols] = await rawPool.query(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='advances' AND COLUMN_NAME='amount' AND DATA_TYPE != 'decimal'`
    ) as [any[], any];
    if (Array.isArray(advCols) && advCols.length > 0) {
      await rawPool.query(`ALTER TABLE advances MODIFY COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0`);
    }
    await rawPool.query(`CREATE TABLE IF NOT EXISTS salary_payments (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      month VARCHAR(7) NOT NULL,
      amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
      remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE KEY salary_payments_emp_month_idx (employee_id, month)
    )`);
    await rawPool.query(`CREATE TABLE IF NOT EXISTS debt_skips (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      month VARCHAR(7) NOT NULL,
      created_at VARCHAR(50) NOT NULL,
      UNIQUE KEY debt_skips_emp_month_idx (employee_id, month)
    )`);
    await rawPool.query(`CREATE TABLE IF NOT EXISTS attendance_score_overrides (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      month CHAR(7) NOT NULL,
      score DECIMAL(8,2) NOT NULL,
      created_at VARCHAR(50) NOT NULL,
      UNIQUE KEY uq_aso_emp_month (employee_id, month)
    )`);
    await rawPool.query(`CREATE TABLE IF NOT EXISTS deductions (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      month INT NOT NULL,
      year INT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      created_by VARCHAR(191)
    )`);
    // إضافة عمود remaining_balance إن لم يكن موجوداً (للجداول القديمة)
    const [spCols] = await rawPool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='salary_payments' AND COLUMN_NAME='remaining_balance'`
    ) as [any[], any];
    if (!Array.isArray(spCols) || spCols.length === 0) {
      await rawPool.query(`ALTER TABLE salary_payments ADD COLUMN remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0`);
    }
    // إضافة عمود excluded_employee_ids إلى جدول grants إن لم يكن موجوداً
    const [grantExcCols] = await rawPool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='grants' AND COLUMN_NAME='excluded_employee_ids'`
    ) as [any[], any];
    if (!Array.isArray(grantExcCols) || grantExcCols.length === 0) {
      await rawPool.query(`ALTER TABLE grants ADD COLUMN excluded_employee_ids TEXT NULL DEFAULT NULL`);
    }
  }

  async getEmployeeDebts(employeeId?: string): Promise<EmployeeDebt[]> {
    if (employeeId) {
      const rows = await mysqlDb.select().from(schema.employeeDebts).where(eq(schema.employeeDebts.employeeId, employeeId));
      return rows as EmployeeDebt[];
    }
    return mysqlDb.select().from(schema.employeeDebts) as Promise<EmployeeDebt[]>;
  }

  async getEmployeeDebt(id: string): Promise<EmployeeDebt | undefined> {
    const [row] = await mysqlDb.select().from(schema.employeeDebts).where(eq(schema.employeeDebts.id, id));
    return row as EmployeeDebt | undefined;
  }

  async createEmployeeDebt(data: InsertEmployeeDebt): Promise<EmployeeDebt> {
    const id = randomUUID();
    await mysqlDb.insert(schema.employeeDebts).values({
      id,
      employeeId: data.employeeId,
      description: data.description,
      totalAmount: data.totalAmount,
      monthlyDeduction: data.monthlyDeduction,
      remainingAmount: data.remainingAmount,
      isActive: data.isActive !== false,
      lastDeductedMonth: data.lastDeductedMonth ?? null,
      createdAt: data.createdAt,
    });
    const [row] = await mysqlDb.select().from(schema.employeeDebts).where(eq(schema.employeeDebts.id, id));
    return row as EmployeeDebt;
  }

  async updateEmployeeDebt(id: string, data: Partial<InsertEmployeeDebt>): Promise<EmployeeDebt | undefined> {
    const updateObj: Partial<typeof schema.employeeDebts.$inferInsert> = {};
    if (data.description !== undefined) updateObj.description = data.description;
    if (data.totalAmount !== undefined) updateObj.totalAmount = data.totalAmount;
    if (data.monthlyDeduction !== undefined) updateObj.monthlyDeduction = data.monthlyDeduction;
    if (data.remainingAmount !== undefined) updateObj.remainingAmount = data.remainingAmount;
    if (data.isActive !== undefined) updateObj.isActive = data.isActive;
    if (data.lastDeductedMonth !== undefined) updateObj.lastDeductedMonth = data.lastDeductedMonth;
    await mysqlDb.update(schema.employeeDebts).set(updateObj).where(eq(schema.employeeDebts.id, id));
    const [row] = await mysqlDb.select().from(schema.employeeDebts).where(eq(schema.employeeDebts.id, id));
    return row as EmployeeDebt | undefined;
  }

  async deleteEmployeeDebt(id: string): Promise<void> {
    await mysqlDb.delete(schema.employeeDebts).where(eq(schema.employeeDebts.id, id));
  }

  async getAdvances(employeeId?: string, month?: number, year?: number): Promise<Advance[]> {
    const conditions: any[] = [];
    if (employeeId) conditions.push(eq(schema.advances.employeeId, employeeId));
    if (month !== undefined) conditions.push(eq(schema.advances.month, month));
    if (year !== undefined) conditions.push(eq(schema.advances.year, year));
    if (conditions.length > 0) {
      const rows = await mysqlDb.select().from(schema.advances).where(and(...conditions));
      return rows as Advance[];
    }
    return mysqlDb.select().from(schema.advances) as Promise<Advance[]>;
  }

  async createAdvance(data: InsertAdvance): Promise<Advance> {
    const id = randomUUID();
    await mysqlDb.insert(schema.advances).values({
      id,
      employeeId: data.employeeId,
      amount: data.amount,
      advanceDate: data.advanceDate,
      month: data.month,
      year: data.year,
      notes: data.notes ?? null,
      createdAt: data.createdAt,
    });
    const [row] = await mysqlDb.select().from(schema.advances).where(eq(schema.advances.id, id));
    return row as Advance;
  }

  async getAdvance(id: string): Promise<Advance | undefined> {
    const [row] = await mysqlDb.select().from(schema.advances).where(eq(schema.advances.id, id));
    return row as Advance | undefined;
  }

  async updateAdvance(id: string, data: Partial<InsertAdvance>): Promise<Advance | undefined> {
    const updateObj: Partial<typeof schema.advances.$inferInsert> = {};
    if (data.employeeId !== undefined) updateObj.employeeId = data.employeeId;
    if (data.amount !== undefined) updateObj.amount = data.amount;
    if (data.advanceDate !== undefined) updateObj.advanceDate = data.advanceDate;
    if (data.month !== undefined) updateObj.month = data.month;
    if (data.year !== undefined) updateObj.year = data.year;
    if (data.notes !== undefined) updateObj.notes = data.notes;
    await mysqlDb.update(schema.advances).set(updateObj).where(eq(schema.advances.id, id));
    const [row] = await mysqlDb.select().from(schema.advances).where(eq(schema.advances.id, id));
    return row as Advance | undefined;
  }

  async deleteAdvance(id: string): Promise<void> {
    await mysqlDb.delete(schema.advances).where(eq(schema.advances.id, id));
  }

  async getDeductions(employeeId?: string, month?: number, year?: number): Promise<Deduction[]> {
    const conditions: any[] = [];
    if (employeeId) conditions.push(eq(schema.deductions.employeeId, employeeId));
    if (month !== undefined) conditions.push(eq(schema.deductions.month, month));
    if (year !== undefined) conditions.push(eq(schema.deductions.year, year));
    if (conditions.length > 0) {
      const rows = await mysqlDb.select().from(schema.deductions).where(and(...conditions));
      return rows as Deduction[];
    }
    return mysqlDb.select().from(schema.deductions) as Promise<Deduction[]>;
  }

  async createDeduction(data: InsertDeduction): Promise<Deduction> {
    const id = randomUUID();
    await mysqlDb.insert(schema.deductions).values({
      id,
      employeeId: data.employeeId,
      amount: data.amount,
      month: data.month,
      year: data.year,
      reason: data.reason ?? null,
      createdAt: data.createdAt,
      createdBy: data.createdBy ?? null,
    });
    const [row] = await mysqlDb.select().from(schema.deductions).where(eq(schema.deductions.id, id));
    return row as Deduction;
  }

  async deleteDeduction(id: string): Promise<void> {
    await mysqlDb.delete(schema.deductions).where(eq(schema.deductions.id, id));
  }

  async getSalaryPayments(month: string): Promise<SalaryPayment[]> {
    const rows = await mysqlDb.select().from(schema.salaryPayments).where(eq(schema.salaryPayments.month, month));
    return rows as SalaryPayment[];
  }

  async upsertSalaryPayment(employeeId: string, month: string, amountPaid: string, remainingBalance: string = "0"): Promise<SalaryPayment> {
    const existing = await mysqlDb.select().from(schema.salaryPayments)
      .where(and(eq(schema.salaryPayments.employeeId, employeeId), eq(schema.salaryPayments.month, month)));
    if (existing.length > 0) {
      await mysqlDb.update(schema.salaryPayments)
        .set({ amountPaid, remainingBalance })
        .where(eq(schema.salaryPayments.id, existing[0].id));
      return { ...existing[0], amountPaid, remainingBalance } as SalaryPayment;
    }
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await mysqlDb.insert(schema.salaryPayments).values({ id, employeeId, month, amountPaid, remainingBalance, createdAt });
    return { id, employeeId, month, amountPaid, remainingBalance, createdAt } as SalaryPayment;
  }
}
