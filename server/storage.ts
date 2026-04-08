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

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  renameUser(oldUsername: string, newUsername: string): Promise<void>;

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
  getAttendanceByEmployeeAndDate(employeeId: string, date: string): Promise<AttendanceRecord | undefined>;
  createAttendance(data: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined>;
  deleteAttendance(id: string): Promise<void>;

  getDeviceSettings(): Promise<DeviceSettings[]>;
  getDeviceSetting(id: string): Promise<DeviceSettings | undefined>;
  createDeviceSetting(data: InsertDeviceSettings): Promise<DeviceSettings>;
  updateDeviceSetting(id: string, data: Partial<InsertDeviceSettings>): Promise<DeviceSettings | undefined>;
  deleteDeviceSetting(id: string): Promise<void>;

  getAppSetting(key: string): Promise<AppSettings | undefined>;
  setAppSetting(key: string, value: string): Promise<AppSettings>;
}

import { IS_MYSQL } from "./db";

async function loadStorage(): Promise<IStorage> {
  if (IS_MYSQL) {
    const { MysqlStorage } = await import("./storage-mysql");
    return new MysqlStorage();
  }
  const { PgStorage } = await import("./storage-pg");
  return new PgStorage();
}

class LazyStorage implements IStorage {
  private _impl: IStorage | null = null;

  private async impl(): Promise<IStorage> {
    if (!this._impl) {
      this._impl = await loadStorage();
    }
    return this._impl;
  }

  getUser(id: string) { return this.impl().then(s => s.getUser(id)); }
  getUserByUsername(u: string) { return this.impl().then(s => s.getUserByUsername(u)); }
  createUser(d: InsertUser) { return this.impl().then(s => s.createUser(d)); }
  renameUser(o: string, n: string) { return this.impl().then(s => s.renameUser(o, n)); }

  getCompanies() { return this.impl().then(s => s.getCompanies()); }
  getCompany(id: string) { return this.impl().then(s => s.getCompany(id)); }
  createCompany(d: InsertCompany) { return this.impl().then(s => s.createCompany(d)); }
  updateCompany(id: string, d: Partial<InsertCompany>) { return this.impl().then(s => s.updateCompany(id, d)); }
  deleteCompany(id: string) { return this.impl().then(s => s.deleteCompany(id)); }

  getWorkshops() { return this.impl().then(s => s.getWorkshops()); }
  getWorkshop(id: string) { return this.impl().then(s => s.getWorkshop(id)); }
  createWorkshop(d: InsertWorkshop) { return this.impl().then(s => s.createWorkshop(d)); }
  updateWorkshop(id: string, d: Partial<InsertWorkshop>) { return this.impl().then(s => s.updateWorkshop(id, d)); }
  deleteWorkshop(id: string) { return this.impl().then(s => s.deleteWorkshop(id)); }

  getPositions() { return this.impl().then(s => s.getPositions()); }
  getPosition(id: string) { return this.impl().then(s => s.getPosition(id)); }
  createPosition(d: InsertPosition) { return this.impl().then(s => s.createPosition(d)); }
  updatePosition(id: string, d: Partial<InsertPosition>) { return this.impl().then(s => s.updatePosition(id, d)); }
  deletePosition(id: string) { return this.impl().then(s => s.deletePosition(id)); }

  getWorkRules() { return this.impl().then(s => s.getWorkRules()); }
  getWorkRule(id: string) { return this.impl().then(s => s.getWorkRule(id)); }
  createWorkRule(d: InsertWorkRule) { return this.impl().then(s => s.createWorkRule(d)); }
  updateWorkRule(id: string, d: Partial<InsertWorkRule>) { return this.impl().then(s => s.updateWorkRule(id, d)); }
  deleteWorkRule(id: string) { return this.impl().then(s => s.deleteWorkRule(id)); }

  getEmployees() { return this.impl().then(s => s.getEmployees()); }
  getEmployee(id: string) { return this.impl().then(s => s.getEmployee(id)); }
  getEmployeeByCode(code: string) { return this.impl().then(s => s.getEmployeeByCode(code)); }
  createEmployee(d: InsertEmployee) { return this.impl().then(s => s.createEmployee(d)); }
  updateEmployee(id: string, d: Partial<InsertEmployee>) { return this.impl().then(s => s.updateEmployee(id, d)); }

  getAttendanceById(id: string) { return this.impl().then(s => s.getAttendanceById(id)); }
  getAttendanceByDate(date: string) { return this.impl().then(s => s.getAttendanceByDate(date)); }
  getAttendanceByEmployee(empId: string, start: string, end: string) { return this.impl().then(s => s.getAttendanceByEmployee(empId, start, end)); }
  getAttendanceByDateRange(start: string, end: string) { return this.impl().then(s => s.getAttendanceByDateRange(start, end)); }
  getAttendanceByEmployeeAndDate(empId: string, date: string) { return this.impl().then(s => s.getAttendanceByEmployeeAndDate(empId, date)); }
  createAttendance(d: InsertAttendance) { return this.impl().then(s => s.createAttendance(d)); }
  updateAttendance(id: string, d: Partial<InsertAttendance>) { return this.impl().then(s => s.updateAttendance(id, d)); }
  deleteAttendance(id: string) { return this.impl().then(s => s.deleteAttendance(id)); }

  getDeviceSettings() { return this.impl().then(s => s.getDeviceSettings()); }
  getDeviceSetting(id: string) { return this.impl().then(s => s.getDeviceSetting(id)); }
  createDeviceSetting(d: InsertDeviceSettings) { return this.impl().then(s => s.createDeviceSetting(d)); }
  updateDeviceSetting(id: string, d: Partial<InsertDeviceSettings>) { return this.impl().then(s => s.updateDeviceSetting(id, d)); }
  deleteDeviceSetting(id: string) { return this.impl().then(s => s.deleteDeviceSetting(id)); }

  getAppSetting(key: string) { return this.impl().then(s => s.getAppSetting(key)); }
  setAppSetting(key: string, value: string) { return this.impl().then(s => s.setAppSetting(key, value)); }
}

export const storage: IStorage = new LazyStorage();
