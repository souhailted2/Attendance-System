import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import {
  users, positions, workRules, employees, attendanceRecords, deviceSettings, appSettings,
  companies, workshops,
  type InsertUser, type User,
  type InsertCompany, type Company,
  type InsertWorkshop, type Workshop,
  type InsertPosition, type Position,
  type InsertWorkRule, type WorkRule,
  type InsertEmployee, type Employee,
  type InsertAttendance, type AttendanceRecord,
  type InsertDeviceSettings, type DeviceSettings,
  type InsertAppSettings, type AppSettings,
} from "@shared/schema";

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
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [c] = await db.select().from(companies).where(eq(companies.id, id));
    return c;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const [c] = await db.insert(companies).values(data).returning();
    return c;
  }

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company | undefined> {
    const [c] = await db.update(companies).set(data).where(eq(companies.id, id)).returning();
    return c;
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
    const [w] = await db.insert(workshops).values(data).returning();
    return w;
  }

  async updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop | undefined> {
    const [w] = await db.update(workshops).set(data).where(eq(workshops.id, id)).returning();
    return w;
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
    const [pos] = await db.insert(positions).values(data).returning();
    return pos;
  }

  async updatePosition(id: string, data: Partial<InsertPosition>): Promise<Position | undefined> {
    const [pos] = await db.update(positions).set(data).where(eq(positions.id, id)).returning();
    return pos;
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
    const [rule] = await db.insert(workRules).values(data).returning();
    return rule;
  }

  async updateWorkRule(id: string, data: Partial<InsertWorkRule>): Promise<WorkRule | undefined> {
    const [rule] = await db.update(workRules).set(data).where(eq(workRules.id, id)).returning();
    return rule;
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
    const [emp] = await db.insert(employees).values(data).returning();
    return emp;
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [emp] = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return emp;
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
    const [record] = await db.insert(attendanceRecords).values(data).returning();
    return record;
  }

  async updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    const [record] = await db.update(attendanceRecords).set(data).where(eq(attendanceRecords.id, id)).returning();
    return record;
  }

  async getDeviceSettings(): Promise<DeviceSettings[]> {
    return db.select().from(deviceSettings);
  }

  async getDeviceSetting(id: string): Promise<DeviceSettings | undefined> {
    const [setting] = await db.select().from(deviceSettings).where(eq(deviceSettings.id, id));
    return setting;
  }

  async createDeviceSetting(data: InsertDeviceSettings): Promise<DeviceSettings> {
    const [setting] = await db.insert(deviceSettings).values(data).returning();
    return setting;
  }

  async updateDeviceSetting(id: string, data: Partial<InsertDeviceSettings>): Promise<DeviceSettings | undefined> {
    const [setting] = await db.update(deviceSettings).set(data).where(eq(deviceSettings.id, id)).returning();
    return setting;
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
      const [updated] = await db.update(appSettings).set({ value }).where(eq(appSettings.key, key)).returning();
      return updated;
    }
    const [created] = await db.insert(appSettings).values({ key, value }).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
