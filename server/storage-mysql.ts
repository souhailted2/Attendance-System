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
    });
    const [result] = await mysqlDb.select().from(schema.employees).where(eq(schema.employees.id, id));
    return result as Employee;
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    await mysqlDb.update(schema.employees).set(data).where(eq(schema.employees.id, id));
    const [result] = await mysqlDb.select().from(schema.employees).where(eq(schema.employees.id, id));
    return result as Employee | undefined;
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
      totalHours: data.totalHours ?? "0",
      penalty: data.penalty ?? "0",
      notes: data.notes ?? null,
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
      created_at VARCHAR(50) NOT NULL
    )`);
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    await mysqlDb.insert(schema.activityLogs).values({ id, ...data });
    const [result] = await mysqlDb.select().from(schema.activityLogs).where(eq(schema.activityLogs.id, id));
    return result as ActivityLog;
  }

  async getActivityLogs(limit = 200): Promise<ActivityLog[]> {
    const results = await mysqlDb
      .select()
      .from(schema.activityLogs)
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit);
    return results as ActivityLog[];
  }
}
