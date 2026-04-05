import { randomUUID } from "crypto";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, IS_MYSQL } from "./db";
import * as pgSchema from "../shared/schema";
import * as mysqlSchema from "../shared/schema-mysql";
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

const s = IS_MYSQL ? mysqlSchema : pgSchema;
const {
  users, companies, workshops, positions, workRules,
  employees, attendanceRecords, deviceSettings, appSettings,
} = s as typeof pgSchema;

async function insertAndReturn<T>(table: any, data: any): Promise<T> {
  const id = randomUUID();
  const record = { id, ...data };
  await db.insert(table).values(record);
  const [result] = await db.select().from(table).where(eq(table.id, id));
  return result as T;
}

async function updateAndReturn<T>(table: any, id: string, data: any): Promise<T | undefined> {
  await db.update(table).set(data).where(eq(table.id, id));
  const [result] = await db.select().from(table).where(eq(table.id, id));
  return result as T | undefined;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(data: InsertCompany): Promise<Company>;
  updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<void>;

  getWorkshops(): Promise<Workshop[]>;
  getWorkshop(id: string): Promise<Workshop | undefined>;
  createWorkshop(data: InsertWorkshop): Promise<Workshop>;
  updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop | undefined>;
  deleteWorkshop(id: string): Promise<void>;

  getPositions(): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  createPosition(data: InsertPosition): Promise<Position>;
  updatePosition(id: string, data: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: string): Promise<void>;

  getWorkRules(): Promise<WorkRule[]>;
  getWorkRule(id: string): Promise<WorkRule | undefined>;
  createWorkRule(data: InsertWorkRule): Promise<WorkRule>;
  updateWorkRule(id: string, data: Partial<InsertWorkRule>): Promise<WorkRule | undefined>;
  deleteWorkRule(id: string): Promise<void>;

  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByCode(code: string): Promise<Employee | undefined>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined>;

  getAttendanceById(id: string): Promise<AttendanceRecord | undefined>;
  getAttendanceByDate(date: string): Promise<AttendanceRecord[]>;
  getAttendanceByEmployee(employeeId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]>;
  getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]>;
  createAttendance(data: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined>;

  getDeviceSettings(): Promise<DeviceSettings[]>;
  getDeviceSetting(id: string): Promise<DeviceSettings | undefined>;
  createDeviceSetting(data: InsertDeviceSettings): Promise<DeviceSettings>;
  updateDeviceSetting(id: string, data: Partial<InsertDeviceSettings>): Promise<DeviceSettings | undefined>;
  deleteDeviceSetting(id: string): Promise<void>;

  getAppSetting(key: string): Promise<AppSettings | undefined>;
  setAppSetting(key: string, value: string): Promise<AppSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    return insertAndReturn<User>(users, data);
  }

  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [c] = await db.select().from(companies).where(eq(companies.id, id));
    return c;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    return insertAndReturn<Company>(companies, data);
  }

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company | undefined> {
    return updateAndReturn<Company>(companies, id, data);
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  async getWorkshops(): Promise<Workshop[]> {
    return db.select().from(workshops);
  }

  async getWorkshop(id: string): Promise<Workshop | undefined> {
    const [w] = await db.select().from(workshops).where(eq(workshops.id, id));
    return w;
  }

  async createWorkshop(data: InsertWorkshop): Promise<Workshop> {
    return insertAndReturn<Workshop>(workshops, data);
  }

  async updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop | undefined> {
    return updateAndReturn<Workshop>(workshops, id, data);
  }

  async deleteWorkshop(id: string): Promise<void> {
    await db.delete(workshops).where(eq(workshops.id, id));
  }

  async getPositions(): Promise<Position[]> {
    return db.select().from(positions);
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const [pos] = await db.select().from(positions).where(eq(positions.id, id));
    return pos;
  }

  async createPosition(data: InsertPosition): Promise<Position> {
    return insertAndReturn<Position>(positions, data);
  }

  async updatePosition(id: string, data: Partial<InsertPosition>): Promise<Position | undefined> {
    return updateAndReturn<Position>(positions, id, data);
  }

  async deletePosition(id: string): Promise<void> {
    await db.delete(positions).where(eq(positions.id, id));
  }

  async getWorkRules(): Promise<WorkRule[]> {
    return db.select().from(workRules);
  }

  async getWorkRule(id: string): Promise<WorkRule | undefined> {
    const [rule] = await db.select().from(workRules).where(eq(workRules.id, id));
    return rule;
  }

  async createWorkRule(data: InsertWorkRule): Promise<WorkRule> {
    return insertAndReturn<WorkRule>(workRules, data);
  }

  async updateWorkRule(id: string, data: Partial<InsertWorkRule>): Promise<WorkRule | undefined> {
    return updateAndReturn<WorkRule>(workRules, id, data);
  }

  async deleteWorkRule(id: string): Promise<void> {
    await db.delete(workRules).where(eq(workRules.id, id));
  }

  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.id, id));
    return emp;
  }

  async getEmployeeByCode(code: string): Promise<Employee | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.employeeCode, code));
    return emp;
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    return insertAndReturn<Employee>(employees, data);
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    return updateAndReturn<Employee>(employees, id, data);
  }

  async getAttendanceById(id: string): Promise<AttendanceRecord | undefined> {
    const [record] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id));
    return record;
  }

  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    return db.select().from(attendanceRecords).where(eq(attendanceRecords.date, date));
  }

  async getAttendanceByEmployee(employeeId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return db.select().from(attendanceRecords).where(
      and(
        eq(attendanceRecords.employeeId, employeeId),
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      )
    );
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return db.select().from(attendanceRecords).where(
      and(
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      )
    );
  }

  async createAttendance(data: InsertAttendance): Promise<AttendanceRecord> {
    return insertAndReturn<AttendanceRecord>(attendanceRecords, data);
  }

  async updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    return updateAndReturn<AttendanceRecord>(attendanceRecords, id, data);
  }

  async getDeviceSettings(): Promise<DeviceSettings[]> {
    return db.select().from(deviceSettings);
  }

  async getDeviceSetting(id: string): Promise<DeviceSettings | undefined> {
    const [setting] = await db.select().from(deviceSettings).where(eq(deviceSettings.id, id));
    return setting;
  }

  async createDeviceSetting(data: InsertDeviceSettings): Promise<DeviceSettings> {
    return insertAndReturn<DeviceSettings>(deviceSettings, data);
  }

  async updateDeviceSetting(id: string, data: Partial<InsertDeviceSettings>): Promise<DeviceSettings | undefined> {
    return updateAndReturn<DeviceSettings>(deviceSettings, id, data);
  }

  async deleteDeviceSetting(id: string): Promise<void> {
    await db.delete(deviceSettings).where(eq(deviceSettings.id, id));
  }

  async getAppSetting(key: string): Promise<AppSettings | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting;
  }

  async setAppSetting(key: string, value: string): Promise<AppSettings> {
    const existing = await this.getAppSetting(key);
    if (existing) {
      return updateAndReturn<AppSettings>(appSettings, existing.id, { value }) as Promise<AppSettings>;
    }
    return insertAndReturn<AppSettings>(appSettings, { key, value });
  }
}

export const storage = new DatabaseStorage();
