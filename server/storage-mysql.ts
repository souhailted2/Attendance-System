import { randomUUID } from "crypto";
import { eq, and, gte, lte } from "drizzle-orm";
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
} from "@shared/schema";
import type { IStorage } from "./storage";

const mysqlDb = db as MySql2Database<typeof schema>;

async function insertAndFetch<T>(
  table: Parameters<typeof mysqlDb.insert>[0],
  selectTable: Parameters<ReturnType<typeof mysqlDb.select>["from"]>[0],
  idCol: Parameters<typeof eq>[0],
  data: Record<string, unknown>,
): Promise<T> {
  const id = randomUUID();
  await mysqlDb.insert(table).values({ id, ...data } as Parameters<ReturnType<typeof mysqlDb.insert>["values"]>[0]);
  const [result] = await mysqlDb.select().from(selectTable).where(eq(idCol, id));
  return result as T;
}

async function updateAndFetch<T>(
  table: Parameters<typeof mysqlDb.update>[0],
  selectTable: Parameters<ReturnType<typeof mysqlDb.select>["from"]>[0],
  idCol: Parameters<typeof eq>[0],
  id: string,
  data: Record<string, unknown>,
): Promise<T | undefined> {
  await mysqlDb.update(table).set(data as Parameters<ReturnType<typeof mysqlDb.update>["set"]>[0]).where(eq(idCol, id));
  const [result] = await mysqlDb.select().from(selectTable).where(eq(idCol, id));
  return result as T | undefined;
}

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
    return insertAndFetch<User>(schema.users, schema.users, schema.users.id, data);
  }

  async getCompanies(): Promise<Company[]> {
    return mysqlDb.select().from(schema.companies) as Promise<Company[]>;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [c] = await mysqlDb.select().from(schema.companies).where(eq(schema.companies.id, id));
    return c as Company | undefined;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    return insertAndFetch<Company>(schema.companies, schema.companies, schema.companies.id, data);
  }

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company | undefined> {
    return updateAndFetch<Company>(schema.companies, schema.companies, schema.companies.id, id, data);
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
    return insertAndFetch<Workshop>(schema.workshops, schema.workshops, schema.workshops.id, data);
  }

  async updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop | undefined> {
    return updateAndFetch<Workshop>(schema.workshops, schema.workshops, schema.workshops.id, id, data);
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
    return insertAndFetch<Position>(schema.positions, schema.positions, schema.positions.id, data);
  }

  async updatePosition(id: string, data: Partial<InsertPosition>): Promise<Position | undefined> {
    return updateAndFetch<Position>(schema.positions, schema.positions, schema.positions.id, id, data);
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
    return insertAndFetch<WorkRule>(schema.workRules, schema.workRules, schema.workRules.id, data);
  }

  async updateWorkRule(id: string, data: Partial<InsertWorkRule>): Promise<WorkRule | undefined> {
    return updateAndFetch<WorkRule>(schema.workRules, schema.workRules, schema.workRules.id, id, data);
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
    return insertAndFetch<Employee>(schema.employees, schema.employees, schema.employees.id, data);
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    return updateAndFetch<Employee>(schema.employees, schema.employees, schema.employees.id, id, data);
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

  async createAttendance(data: InsertAttendance): Promise<AttendanceRecord> {
    return insertAndFetch<AttendanceRecord>(schema.attendanceRecords, schema.attendanceRecords, schema.attendanceRecords.id, data);
  }

  async updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    return updateAndFetch<AttendanceRecord>(schema.attendanceRecords, schema.attendanceRecords, schema.attendanceRecords.id, id, data);
  }

  async getDeviceSettings(): Promise<DeviceSettings[]> {
    return mysqlDb.select().from(schema.deviceSettings) as Promise<DeviceSettings[]>;
  }

  async getDeviceSetting(id: string): Promise<DeviceSettings | undefined> {
    const [setting] = await mysqlDb.select().from(schema.deviceSettings).where(eq(schema.deviceSettings.id, id));
    return setting as DeviceSettings | undefined;
  }

  async createDeviceSetting(data: InsertDeviceSettings): Promise<DeviceSettings> {
    return insertAndFetch<DeviceSettings>(schema.deviceSettings, schema.deviceSettings, schema.deviceSettings.id, data);
  }

  async updateDeviceSetting(id: string, data: Partial<InsertDeviceSettings>): Promise<DeviceSettings | undefined> {
    return updateAndFetch<DeviceSettings>(schema.deviceSettings, schema.deviceSettings, schema.deviceSettings.id, id, data);
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
      const updated = await updateAndFetch<AppSettings>(
        schema.appSettings, schema.appSettings, schema.appSettings.id, existing.id, { value },
      );
      if (!updated) throw new Error(`Failed to update app setting: ${key}`);
      return updated;
    }
    return insertAndFetch<AppSettings>(schema.appSettings, schema.appSettings, schema.appSettings.id, { key, value });
  }
}
