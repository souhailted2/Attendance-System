import { randomUUID } from "crypto";
import { eq, and, gte, lte } from "drizzle-orm";
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
}
