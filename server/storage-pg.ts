import { randomUUID } from "crypto";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db } from "./db";
import * as schema from "../shared/schema";
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
  InsertGrant, Grant,
  InsertGrantCondition, GrantCondition,
  GrantWithConditions,
  InsertWorkScheduleOverride, WorkScheduleOverride,
  InsertEmployeeDebt, EmployeeDebt,
  InsertAdvance, Advance,
  SalaryPayment,
} from "@shared/schema";
import type { IStorage } from "./storage";

const pgDb = db as NodePgDatabase<typeof schema>;

export class PgStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await pgDb.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await pgDb.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.users).values({ id, ...data }).returning();
    return result;
  }

  async renameUser(oldUsername: string, newUsername: string): Promise<void> {
    await pgDb.update(schema.users)
      .set({ username: newUsername })
      .where(eq(schema.users.username, oldUsername));
  }

  async getCompanies(): Promise<Company[]> {
    return pgDb.select().from(schema.companies);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [c] = await pgDb.select().from(schema.companies).where(eq(schema.companies.id, id));
    return c;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.companies).values({ id, ...data }).returning();
    return result;
  }

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company | undefined> {
    const [result] = await pgDb.update(schema.companies).set(data).where(eq(schema.companies.id, id)).returning();
    return result;
  }

  async deleteCompany(id: string): Promise<void> {
    await pgDb.delete(schema.companies).where(eq(schema.companies.id, id));
  }

  async getWorkshops(): Promise<Workshop[]> {
    return pgDb.select().from(schema.workshops);
  }

  async getWorkshop(id: string): Promise<Workshop | undefined> {
    const [w] = await pgDb.select().from(schema.workshops).where(eq(schema.workshops.id, id));
    return w;
  }

  async createWorkshop(data: InsertWorkshop): Promise<Workshop> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.workshops).values({ id, ...data }).returning();
    return result;
  }

  async updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop | undefined> {
    const [result] = await pgDb.update(schema.workshops).set(data).where(eq(schema.workshops.id, id)).returning();
    return result;
  }

  async deleteWorkshop(id: string): Promise<void> {
    await pgDb.delete(schema.workshops).where(eq(schema.workshops.id, id));
  }

  async getPositions(): Promise<Position[]> {
    return pgDb.select().from(schema.positions);
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const [pos] = await pgDb.select().from(schema.positions).where(eq(schema.positions.id, id));
    return pos;
  }

  async createPosition(data: InsertPosition): Promise<Position> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.positions).values({ id, ...data }).returning();
    return result;
  }

  async updatePosition(id: string, data: Partial<InsertPosition>): Promise<Position | undefined> {
    const [result] = await pgDb.update(schema.positions).set(data).where(eq(schema.positions.id, id)).returning();
    return result;
  }

  async deletePosition(id: string): Promise<void> {
    await pgDb.delete(schema.positions).where(eq(schema.positions.id, id));
  }

  async getWorkRules(): Promise<WorkRule[]> {
    return pgDb.select().from(schema.workRules);
  }

  async getWorkRule(id: string): Promise<WorkRule | undefined> {
    const [rule] = await pgDb.select().from(schema.workRules).where(eq(schema.workRules.id, id));
    return rule;
  }

  async createWorkRule(data: InsertWorkRule): Promise<WorkRule> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.workRules).values({ id, ...data }).returning();
    return result;
  }

  async updateWorkRule(id: string, data: Partial<InsertWorkRule>): Promise<WorkRule | undefined> {
    const [result] = await pgDb.update(schema.workRules).set(data).where(eq(schema.workRules.id, id)).returning();
    return result;
  }

  async deleteWorkRule(id: string): Promise<void> {
    await pgDb.delete(schema.workRules).where(eq(schema.workRules.id, id));
  }

  async getEmployees(): Promise<Employee[]> {
    return pgDb.select().from(schema.employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [emp] = await pgDb.select().from(schema.employees).where(eq(schema.employees.id, id));
    return emp;
  }

  async getEmployeeByCode(code: string): Promise<Employee | undefined> {
    const [emp] = await pgDb.select().from(schema.employees).where(eq(schema.employees.employeeCode, code));
    return emp;
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.employees).values({ id, ...data }).returning();
    return result;
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [result] = await pgDb.update(schema.employees).set(data).where(eq(schema.employees.id, id)).returning();
    return result;
  }

  async deleteEmployee(id: string): Promise<void> {
    await pgDb.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.employeeId, id));
    await pgDb.delete(schema.employees).where(eq(schema.employees.id, id));
  }

  async getAttendanceById(id: string): Promise<AttendanceRecord | undefined> {
    const [record] = await pgDb.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, id));
    return record;
  }

  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    return pgDb.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.date, date));
  }

  async getAttendanceByEmployee(employeeId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return pgDb.select().from(schema.attendanceRecords).where(
      and(
        eq(schema.attendanceRecords.employeeId, employeeId),
        gte(schema.attendanceRecords.date, startDate),
        lte(schema.attendanceRecords.date, endDate),
      ),
    );
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return pgDb.select().from(schema.attendanceRecords).where(
      and(
        gte(schema.attendanceRecords.date, startDate),
        lte(schema.attendanceRecords.date, endDate),
      ),
    );
  }

  async getAttendanceByEmployeeAndDate(employeeId: string, date: string): Promise<AttendanceRecord | undefined> {
    const [record] = await pgDb.select().from(schema.attendanceRecords).where(
      and(
        eq(schema.attendanceRecords.employeeId, employeeId),
        eq(schema.attendanceRecords.date, date),
      ),
    );
    return record;
  }

  async createAttendance(data: InsertAttendance): Promise<AttendanceRecord> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.attendanceRecords).values({ id, ...data }).returning();
    return result;
  }

  async updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    const [result] = await pgDb.update(schema.attendanceRecords).set(data).where(eq(schema.attendanceRecords.id, id)).returning();
    return result;
  }

  async deleteAttendance(id: string): Promise<void> {
    await pgDb.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, id));
  }

  async getDeviceSettings(): Promise<DeviceSettings[]> {
    return pgDb.select().from(schema.deviceSettings);
  }

  async getDeviceSetting(id: string): Promise<DeviceSettings | undefined> {
    const [setting] = await pgDb.select().from(schema.deviceSettings).where(eq(schema.deviceSettings.id, id));
    return setting;
  }

  async createDeviceSetting(data: InsertDeviceSettings): Promise<DeviceSettings> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.deviceSettings).values({ id, ...data }).returning();
    return result;
  }

  async updateDeviceSetting(id: string, data: Partial<InsertDeviceSettings>): Promise<DeviceSettings | undefined> {
    const [result] = await pgDb.update(schema.deviceSettings).set(data).where(eq(schema.deviceSettings.id, id)).returning();
    return result;
  }

  async deleteDeviceSetting(id: string): Promise<void> {
    await pgDb.delete(schema.deviceSettings).where(eq(schema.deviceSettings.id, id));
  }

  async getAppSetting(key: string): Promise<AppSettings | undefined> {
    const [setting] = await pgDb.select().from(schema.appSettings).where(eq(schema.appSettings.key, key));
    return setting;
  }

  async setAppSetting(key: string, value: string): Promise<AppSettings> {
    const existing = await this.getAppSetting(key);
    if (existing) {
      const [result] = await pgDb.update(schema.appSettings).set({ value }).where(eq(schema.appSettings.id, existing.id)).returning();
      return result;
    }
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.appSettings).values({ id, key, value }).returning();
    return result;
  }

  async initActivityLogs(): Promise<void> {
    // PG schema is handled by db:push, no-op here
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const [result] = await pgDb.insert(schema.activityLogs).values({ id, ...data }).returning();
    return result;
  }

  async getActivityLogs(limit = 200): Promise<ActivityLog[]> {
    return pgDb
      .select()
      .from(schema.activityLogs)
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLog(id: string): Promise<ActivityLog | undefined> {
    const [result] = await pgDb.select().from(schema.activityLogs).where(eq(schema.activityLogs.id, id));
    return result;
  }

  async revertActivityLog(id: string, revertedBy: string): Promise<void> {
    await pgDb.update(schema.activityLogs)
      .set({ isReverted: 1, revertedAt: new Date().toISOString(), revertedBy })
      .where(eq(schema.activityLogs.id, id));
  }

  async deleteActivityLog(id: string): Promise<void> {
    await pgDb.delete(schema.activityLogs).where(eq(schema.activityLogs.id, id));
  }

  async isRecordLocked(employeeId: string, recordDate: string): Promise<boolean> {
    const results = await pgDb
      .select()
      .from(schema.lockedRecords)
      .where(and(eq(schema.lockedRecords.employeeId, employeeId), eq(schema.lockedRecords.recordDate, recordDate)))
      .limit(1);
    return results.length > 0;
  }

  async lockRecord(data: InsertLockedRecord): Promise<LockedRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const [result] = await pgDb.insert(schema.lockedRecords).values({
      id,
      employeeId: data.employeeId,
      recordDate: data.recordDate,
      lockedBy: data.lockedBy ?? null,
      lockedAt: data.lockedAt ?? now,
      activityLogId: data.activityLogId ?? null,
    }).returning();
    return result;
  }

  async getFrozenArchives(month: string): Promise<FrozenArchive[]> {
    const results = await pgDb.select().from(schema.frozenArchives).where(eq(schema.frozenArchives.month, month));
    return results as FrozenArchive[];
  }

  async getAllFrozenArchives(): Promise<FrozenArchive[]> {
    const results = await pgDb.select().from(schema.frozenArchives);
    return results as FrozenArchive[];
  }

  async getFrozenArchive(id: string): Promise<FrozenArchive | undefined> {
    const [result] = await pgDb.select().from(schema.frozenArchives).where(eq(schema.frozenArchives.id, id));
    return result as FrozenArchive | undefined;
  }

  async createFrozenArchive(data: InsertFrozenArchive): Promise<FrozenArchive> {
    const id = randomUUID();
    await pgDb.insert(schema.frozenArchives).values({ id, ...data });
    const [result] = await pgDb.select().from(schema.frozenArchives).where(eq(schema.frozenArchives.id, id));
    return result as FrozenArchive;
  }

  async deleteFrozenArchive(id: string): Promise<void> {
    await pgDb.delete(schema.frozenArchives).where(eq(schema.frozenArchives.id, id));
  }

  async getLeaves(): Promise<Leave[]> {
    const results = await pgDb.select().from(schema.leaves).orderBy(desc(schema.leaves.startDate));
    return results;
  }

  async createLeave(data: InsertLeave): Promise<Leave> {
    const [result] = await pgDb.insert(schema.leaves).values({
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
    }).returning();
    return result;
  }

  async deleteLeave(id: string): Promise<void> {
    await pgDb.delete(schema.leaves).where(eq(schema.leaves.id, id));
  }

  async getGrants(): Promise<GrantWithConditions[]> {
    const grantList = await pgDb.select().from(schema.grants).orderBy(desc(schema.grants.createdAt));
    const conditions = await pgDb.select().from(schema.grantConditions);
    return grantList.map(g => ({
      ...g,
      conditions: conditions.filter(c => c.grantId === g.id),
    }));
  }

  async createGrant(data: InsertGrant, conditions: Omit<InsertGrantCondition, "grantId">[]): Promise<GrantWithConditions> {
    const id = randomUUID();
    const [grant] = await pgDb.insert(schema.grants).values({
      id,
      name: data.name,
      amount: data.amount,
      type: data.type ?? "grant",
      targetType: data.targetType ?? "all",
      shiftValue: data.shiftValue ?? null,
      workshopId: data.workshopId ?? null,
      employeeIds: data.employeeIds ?? null,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
    }).returning();
    const condRows: GrantCondition[] = [];
    for (const c of conditions) {
      const cid = randomUUID();
      const [row] = await pgDb.insert(schema.grantConditions).values({
        id: cid,
        grantId: id,
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
      }).returning();
      condRows.push(row);
    }
    return { ...grant, conditions: condRows };
  }

  async deleteGrant(id: string): Promise<void> {
    await pgDb.delete(schema.grantConditions).where(eq(schema.grantConditions.grantId, id));
    await pgDb.delete(schema.grants).where(eq(schema.grants.id, id));
  }

  async getScheduleOverrides(): Promise<WorkScheduleOverride[]> {
    return pgDb.select().from(schema.workScheduleOverrides) as Promise<WorkScheduleOverride[]>;
  }

  async getScheduleOverride(id: string): Promise<WorkScheduleOverride | undefined> {
    const [row] = await pgDb.select().from(schema.workScheduleOverrides).where(eq(schema.workScheduleOverrides.id, id));
    return row as WorkScheduleOverride | undefined;
  }

  async createScheduleOverride(data: InsertWorkScheduleOverride): Promise<WorkScheduleOverride> {
    const id = randomUUID();
    const [row] = await pgDb.insert(schema.workScheduleOverrides).values({
      id,
      name: data.name,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      workRuleId: data.workRuleId ?? null,
      workStartTime: data.workStartTime,
      workEndTime: data.workEndTime,
      isOvernight: data.isOvernight ?? false,
      notes: data.notes ?? null,
    }).returning();
    return row as WorkScheduleOverride;
  }

  async updateScheduleOverride(id: string, data: Partial<InsertWorkScheduleOverride>): Promise<WorkScheduleOverride | undefined> {
    const [row] = await pgDb.update(schema.workScheduleOverrides).set(data).where(eq(schema.workScheduleOverrides.id, id)).returning();
    return row as WorkScheduleOverride | undefined;
  }

  async deleteScheduleOverride(id: string): Promise<void> {
    await pgDb.delete(schema.workScheduleOverrides).where(eq(schema.workScheduleOverrides.id, id));
  }

  // ====== Payroll — not implemented for Postgres (MySQL-only feature) ======
  async initPayrollTables(): Promise<void> { /* no-op: MySQL only */ }
  async getEmployeeDebts(_employeeId?: string): Promise<EmployeeDebt[]> { return []; }
  async getEmployeeDebt(_id: string): Promise<EmployeeDebt | undefined> { return undefined; }
  async createEmployeeDebt(_data: InsertEmployeeDebt): Promise<EmployeeDebt> { throw new Error("Not implemented for Postgres"); }
  async updateEmployeeDebt(_id: string, _data: Partial<InsertEmployeeDebt>): Promise<EmployeeDebt | undefined> { return undefined; }
  async deleteEmployeeDebt(_id: string): Promise<void> { /* no-op */ }
  async getAdvances(_employeeId?: string, _month?: number, _year?: number): Promise<Advance[]> { return []; }
  async getAdvance(_id: string): Promise<Advance | undefined> { return undefined; }
  async createAdvance(_data: InsertAdvance): Promise<Advance> { throw new Error("Not implemented for Postgres"); }
  async updateAdvance(_id: string, _data: Partial<InsertAdvance>): Promise<Advance | undefined> { return undefined; }
  async deleteAdvance(_id: string): Promise<void> { /* no-op */ }
  async getSalaryPayments(_month: string): Promise<SalaryPayment[]> { return []; }
  async upsertSalaryPayment(_employeeId: string, _month: string, _amountPaid: string, _remainingBalance?: string): Promise<SalaryPayment> { throw new Error("Not implemented for Postgres"); }
  async getDebtSkips(_month: string): Promise<string[]> { return []; }
  async addDebtSkip(_employeeId: string, _month: string): Promise<void> { /* no-op: MySQL only */ }
  async removeDebtSkip(_employeeId: string, _month: string): Promise<void> { /* no-op: MySQL only */ }
}
