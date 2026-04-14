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
  deleteEmployee(id: string): Promise<void>;

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

  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;
  getActivityLog(id: string): Promise<ActivityLog | undefined>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  revertActivityLog(id: string, revertedBy: string): Promise<void>;
  deleteActivityLog(id: string): Promise<void>;
  initActivityLogs(): Promise<void>;

  isRecordLocked(employeeId: string, recordDate: string): Promise<boolean>;
  lockRecord(data: InsertLockedRecord): Promise<LockedRecord>;

  getFrozenArchives(month: string): Promise<FrozenArchive[]>;
  getAllFrozenArchives(): Promise<FrozenArchive[]>;
  getFrozenArchive(id: string): Promise<FrozenArchive | undefined>;
  createFrozenArchive(data: InsertFrozenArchive): Promise<FrozenArchive>;
  deleteFrozenArchive(id: string): Promise<void>;

  getLeaves(): Promise<Leave[]>;
  createLeave(data: InsertLeave): Promise<Leave>;
  deleteLeave(id: string): Promise<void>;

  getGrants(): Promise<GrantWithConditions[]>;
  createGrant(data: InsertGrant, conditions: Omit<InsertGrantCondition, "grantId">[]): Promise<GrantWithConditions>;
  deleteGrant(id: string): Promise<void>;

  getScheduleOverrides(): Promise<WorkScheduleOverride[]>;
  getScheduleOverride(id: string): Promise<WorkScheduleOverride | undefined>;
  createScheduleOverride(data: InsertWorkScheduleOverride): Promise<WorkScheduleOverride>;
  updateScheduleOverride(id: string, data: Partial<InsertWorkScheduleOverride>): Promise<WorkScheduleOverride | undefined>;
  deleteScheduleOverride(id: string): Promise<void>;

  getEmployeeDebts(employeeId?: string): Promise<EmployeeDebt[]>;
  getEmployeeDebt(id: string): Promise<EmployeeDebt | undefined>;
  createEmployeeDebt(data: InsertEmployeeDebt): Promise<EmployeeDebt>;
  updateEmployeeDebt(id: string, data: Partial<InsertEmployeeDebt>): Promise<EmployeeDebt | undefined>;
  deleteEmployeeDebt(id: string): Promise<void>;

  getAdvances(employeeId?: string, month?: number, year?: number): Promise<Advance[]>;
  getAdvance(id: string): Promise<Advance | undefined>;
  createAdvance(data: InsertAdvance): Promise<Advance>;
  updateAdvance(id: string, data: Partial<InsertAdvance>): Promise<Advance | undefined>;
  deleteAdvance(id: string): Promise<void>;

  getSalaryPayments(month: string): Promise<SalaryPayment[]>;
  upsertSalaryPayment(employeeId: string, month: string, amountPaid: string, remainingBalance?: string): Promise<SalaryPayment>;

  initPayrollTables(): Promise<void>;
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
  deleteEmployee(id: string) { return this.impl().then(s => s.deleteEmployee(id)); }

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

  createActivityLog(d: InsertActivityLog) { return this.impl().then(s => s.createActivityLog(d)); }
  getActivityLog(id: string) { return this.impl().then(s => s.getActivityLog(id)); }
  getActivityLogs(limit?: number) { return this.impl().then(s => s.getActivityLogs(limit)); }
  revertActivityLog(id: string, by: string) { return this.impl().then(s => s.revertActivityLog(id, by)); }
  deleteActivityLog(id: string) { return this.impl().then(s => s.deleteActivityLog(id)); }
  initActivityLogs() { return this.impl().then(s => s.initActivityLogs()); }

  isRecordLocked(empId: string, date: string) { return this.impl().then(s => s.isRecordLocked(empId, date)); }
  lockRecord(d: InsertLockedRecord) { return this.impl().then(s => s.lockRecord(d)); }

  getFrozenArchives(month: string) { return this.impl().then(s => s.getFrozenArchives(month)); }
  getAllFrozenArchives() { return this.impl().then(s => s.getAllFrozenArchives()); }
  getFrozenArchive(id: string) { return this.impl().then(s => s.getFrozenArchive(id)); }
  createFrozenArchive(d: InsertFrozenArchive) { return this.impl().then(s => s.createFrozenArchive(d)); }
  deleteFrozenArchive(id: string) { return this.impl().then(s => s.deleteFrozenArchive(id)); }

  getLeaves() { return this.impl().then(s => s.getLeaves()); }
  createLeave(d: InsertLeave) { return this.impl().then(s => s.createLeave(d)); }
  deleteLeave(id: string) { return this.impl().then(s => s.deleteLeave(id)); }

  getGrants() { return this.impl().then(s => s.getGrants()); }
  createGrant(d: InsertGrant, c: Omit<InsertGrantCondition, "grantId">[]) { return this.impl().then(s => s.createGrant(d, c)); }
  deleteGrant(id: string) { return this.impl().then(s => s.deleteGrant(id)); }

  getScheduleOverrides() { return this.impl().then(s => s.getScheduleOverrides()); }
  getScheduleOverride(id: string) { return this.impl().then(s => s.getScheduleOverride(id)); }
  createScheduleOverride(d: InsertWorkScheduleOverride) { return this.impl().then(s => s.createScheduleOverride(d)); }
  updateScheduleOverride(id: string, d: Partial<InsertWorkScheduleOverride>) { return this.impl().then(s => s.updateScheduleOverride(id, d)); }
  deleteScheduleOverride(id: string) { return this.impl().then(s => s.deleteScheduleOverride(id)); }

  getEmployeeDebts(employeeId?: string) { return this.impl().then(s => s.getEmployeeDebts(employeeId)); }
  getEmployeeDebt(id: string) { return this.impl().then(s => s.getEmployeeDebt(id)); }
  createEmployeeDebt(d: InsertEmployeeDebt) { return this.impl().then(s => s.createEmployeeDebt(d)); }
  updateEmployeeDebt(id: string, d: Partial<InsertEmployeeDebt>) { return this.impl().then(s => s.updateEmployeeDebt(id, d)); }
  deleteEmployeeDebt(id: string) { return this.impl().then(s => s.deleteEmployeeDebt(id)); }

  getAdvances(employeeId?: string, month?: number, year?: number) { return this.impl().then(s => s.getAdvances(employeeId, month, year)); }
  getAdvance(id: string) { return this.impl().then(s => s.getAdvance(id)); }
  createAdvance(d: InsertAdvance) { return this.impl().then(s => s.createAdvance(d)); }
  updateAdvance(id: string, data: Partial<InsertAdvance>) { return this.impl().then(s => s.updateAdvance(id, data)); }
  deleteAdvance(id: string) { return this.impl().then(s => s.deleteAdvance(id)); }

  getSalaryPayments(month: string) { return this.impl().then(s => s.getSalaryPayments(month)); }
  upsertSalaryPayment(empId: string, month: string, amount: string, remaining?: string) { return this.impl().then(s => s.upsertSalaryPayment(empId, month, amount, remaining)); }

  initPayrollTables() { return this.impl().then(s => s.initPayrollTables()); }
}

export const storage: IStorage = new LazyStorage();
