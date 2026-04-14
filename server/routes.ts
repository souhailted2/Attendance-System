import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import ExcelJS from "exceljs";

// تمديد نوع الجلسة ليشمل معرّف المستخدم واسم المستخدم
declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
  }
}

// middleware: حماية مسارات API
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // السماح لمسارات المصادقة والوكيل بالعبور
  if (
    req.path === "/api/login" ||
    req.path === "/api/logout" ||
    req.path === "/api/auth/me" ||
    req.path.startsWith("/agent/")
  ) {
    return next();
  }
  if (!req.session.userId) {
    return res.status(401).json({ message: "غير مصرح، يرجى تسجيل الدخول" });
  }
  next();
}
import { insertCompanySchema, insertWorkshopSchema, insertPositionSchema, insertWorkRuleSchema, insertEmployeeSchema, insertDeviceSettingsSchema, type InsertEmployee, type InsertAttendance } from "@shared/schema";
import multer from "multer";
import { testConnection, syncAttendanceLogs, clearDeviceLogs } from "./zk-service";
import archiver from "archiver";
import { getZkAgentJs, getAgentPackageJson, getMdbAgentJs, getMdbPackageJson } from "./agent-content";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const AGENT_API_KEY_SETTING = "agent_api_key";

function generateApiKey(): string {
  return randomBytes(32).toString("hex");
}

function calculateAttendanceDetails(checkIn: string | null, checkOut: string | null, workStartTime: string, workEndTime: string, lateGraceMinutes: number, latePenaltyPerMinute: string, earlyLeavePenaltyPerMinute: string, absencePenalty: string, status: string, checkoutEarliestTime?: string | null) {
  let lateMinutes = 0;
  let earlyLeaveMinutes = 0;
  let totalHours = 0;
  let penalty = 0;

  if (status === "absent") {
    penalty = parseFloat(absencePenalty) || 0;
    return { lateMinutes, earlyLeaveMinutes, totalHours, penalty, status };
  }

  if (status === "leave") {
    return { lateMinutes: 0, earlyLeaveMinutes: 0, totalHours: 0, penalty: 0, status };
  }

  if (status === "rest") {
    return { lateMinutes: 0, earlyLeaveMinutes: 0, totalHours: 0, penalty: 0, status };
  }

  if (checkIn && workStartTime) {
    const [checkH, checkM] = checkIn.split(":").map(Number);
    const [startH, startM] = workStartTime.split(":").map(Number);
    const checkMinutes = checkH * 60 + checkM;
    const startMinutes = startH * 60 + startM;
    const diff = checkMinutes - startMinutes;
    if (diff > lateGraceMinutes) {
      lateMinutes = diff;
      status = "late";
    }
  }

  if (checkOut) {
    // إذا كان هناك أقرب وقت مسموح للخروج، يُحسب الخروج المبكر منه بدلاً من نهاية الدوام
    const refEndTime = checkoutEarliestTime || workEndTime;
    const [checkH, checkM] = checkOut.split(":").map(Number);
    const [endH, endM] = refEndTime.split(":").map(Number);
    const checkMinutes = checkH * 60 + checkM;
    const endMinutes = endH * 60 + endM;
    if (checkMinutes < endMinutes) {
      earlyLeaveMinutes = endMinutes - checkMinutes;
    }
  }

  if (checkIn && checkOut) {
    const [inH, inM] = checkIn.split(":").map(Number);
    const [outH, outM] = checkOut.split(":").map(Number);
    totalHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 100) / 100;
  }

  penalty = (lateMinutes > 0 ? lateMinutes * (parseFloat(latePenaltyPerMinute) || 0) : 0) +
    (earlyLeaveMinutes > 0 ? earlyLeaveMinutes * (parseFloat(earlyLeavePenaltyPerMinute) || 0) : 0);

  return { lateMinutes, earlyLeaveMinutes, totalHours: Math.max(0, totalHours), penalty, status };
}

async function getWorkRuleForEmployee(employeeId: string) {
  const employee = await storage.getEmployee(employeeId);
  if (!employee) return null;
  let workRule = employee.workRuleId ? await storage.getWorkRule(employee.workRuleId) : null;
  if (!workRule) {
    const rules = await storage.getWorkRules();
    workRule = rules.find(r => r.isDefault) || null;
  }
  return workRule;
}

// SSE — إشعار فوري عند وصول حركة جديدة
const sseClients = new Set<import("express").Response>();

function notifyAttendanceUpdate() {
  for (const client of sseClients) {
    try { client.write("data: update\n\n"); } catch { sseClients.delete(client); }
  }
}

// حساب دقائق الغياب الوسيطة: مجموع الفجوات بين أزواج البصمات التي تتجاوز مدة السماح
// مثال: [08:00, 10:00, 10:40, 12:00] → فجوة 40 دقيقة > 15 → middleAbsenceMinutes = 40
// shiftStartMin: وقت بداية الوردية بالدقائق (اختياري) — الفجوات قبل بداية الوردية لا تُحتسب غياباً
const MIDDLE_ABSENCE_GRACE_MINUTES = 15;
function calculateMiddleAbsenceMinutes(
  filteredTimes: string[],
  graceMinutes: number = MIDDLE_ABSENCE_GRACE_MINUTES,
  shiftStartMin: number | null = null
): number {
  if (filteredTimes.length <= 2) return 0;
  let totalAbsence = 0;
  // الأزواج: (t[0],t[1]), (t[2],t[3])... الفجوات: t[1]→t[2], t[3]→t[4]...
  for (let i = 1; i + 1 < filteredTimes.length; i += 2) {
    const outTime = filteredTimes[i];
    const inTime  = filteredTimes[i + 1];
    const [outH, outM] = outTime.split(":").map(Number);
    const [inH,  inM ] = inTime.split(":").map(Number);
    const outMin = outH * 60 + outM;
    const inMin  = inH * 60 + inM;

    // إذا كانت الفجوة تنتهي قبل أو عند بداية الوردية → ساعات إضافية قبل الوردية → لا تُحسب غياباً
    if (shiftStartMin !== null && inMin <= shiftStartMin) continue;

    // إذا بدأت الفجوة عند نافذة بداية الوردية (±5/+15 دقيقة) → بصمة تأكيد إلزامية ZKTeco وليست خروجاً
    // مثال: [14:21, 15:47, 23:45] وردية 15:45 → 15:47 هي مسح التأكيد الإلزامي عند بداية الوردية
    // قياسات حقيقية: بصمات التأكيد بفارق [0, +13 دقيقة]؛ الغيابات الحقيقية بفارق ≤ -74 دقيقة
    const RESCAN_BEFORE = 5;
    const RESCAN_AFTER  = 15;
    if (shiftStartMin !== null &&
        outMin >= shiftStartMin - RESCAN_BEFORE &&
        outMin <= shiftStartMin + RESCAN_AFTER) continue;

    // إذا بدأت الفجوة قبل الوردية لكنها تمتد داخلها → نقلّص البداية لوقت الوردية
    const effectiveOutMin = (shiftStartMin !== null && outMin < shiftStartMin) ? shiftStartMin : outMin;

    const gapMin = inMin - effectiveOutMin;
    if (gapMin > graceMinutes) {
      totalAbsence += gapMin;
    }
  }
  return totalAbsence;
}

// فلترة البصمات المتكررة: إزالة أي بصمة في خلال N دقيقة من السابقة
function filterDuplicateSwipes(times: string[], minGapMinutes: number): string[] {
  const result: string[] = [];
  for (const t of times) {
    if (result.length === 0) { result.push(t); continue; }
    const prev = result[result.length - 1];
    const [ph, pm] = prev.split(":").map(Number);
    const [th, tm] = t.split(":").map(Number);
    if ((th * 60 + tm) - (ph * 60 + pm) >= minGapMinutes) result.push(t);
  }
  return result;
}

// الحصول على أيام الراحة الفعلية لموظف في تاريخ معين
// يأخذ بعين الاعتبار الجداول الاستثنائية (رمضان وغيره) التي قد تُغيّر أيام الراحة
function getEffectiveWeeklyOffDays(
  date: string,
  workRuleId: string | null | undefined,
  overrides: { dateFrom: string; dateTo: string; workRuleId?: string | null; weeklyOffDays?: string | null }[],
  globalOffDays: number[]
): number[] {
  for (const ov of overrides) {
    if (date < ov.dateFrom || date > ov.dateTo) continue;
    if (ov.workRuleId && ov.workRuleId !== workRuleId) continue;
    if (ov.weeklyOffDays) {
      try { return JSON.parse(ov.weeklyOffDays); } catch { /* continue to global */ }
    }
  }
  return globalOffDays;
}

// تحويل وقت "HH:MM" إلى دقائق منذ منتصف الليل (مشترك لجميع المسارات)
function timeToMinGlobal(t: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function getYesterday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function processAttendanceLogs(
  logs: Array<{ uid: string; date: string; times: string[] }>,
  allEmployees: Awaited<ReturnType<typeof storage.getEmployees>>,
  workshopId: string | null | undefined,
  sourceName: string
): Promise<{ imported: number; skipped: number; duplicates: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  let duplicates = 0;
  const errors: string[] = [];

  const eligibleEmployees = workshopId
    ? allEmployees.filter(e => e.workshopId === workshopId)
    : allEmployees;

  const workshops = workshopId ? await storage.getWorkshops() : [];
  const workshopName = workshopId ? (workshops.find(w => w.id === workshopId)?.name || "الورشة") : null;

  for (const entry of logs) {
    const employee =
      eligibleEmployees.find(e => e.employeeCode === entry.uid) ||
      eligibleEmployees.find(e => e.cardNumber   === entry.uid);
    if (!employee) {
      if (workshopId) {
        errors.push(`رقم المستخدم ${entry.uid} غير مسجل في ${workshopName}`);
      } else {
        errors.push(`رقم المستخدم ${entry.uid} غير مطابق لأي موظف`);
      }
      skipped++;
      continue;
    }

    const workRule = await getWorkRuleForEmployee(employee.id);
    entry.times.sort();
    const filteredTimes = filterDuplicateSwipes(entry.times, 5);
    const checkIn = filteredTimes[0] || null;
    const checkOut = filteredTimes.length > 1 ? filteredTimes[filteredTimes.length - 1] : null;

    // تحويل وقت بداية الوردية إلى دقائق لتجاهل الفجوات الواقعة قبلها
    const shiftStartMinForCalc = workRule?.workStartTime ? timeToMinGlobal(workRule.workStartTime) : null;
    const middleAbsenceMinutes = calculateMiddleAbsenceMinutes(filteredTimes, MIDDLE_ABSENCE_GRACE_MINUTES, shiftStartMinForCalc);

    // ===== معالجة خاصة لنظام المناوبة 24 ساعة =====
    if (workRule?.is24hShift) {
      const yesterday = getYesterday(entry.date);
      const pendingYesterday = await storage.getAttendanceByEmployeeAndDate(employee.id, yesterday);

      if (pendingYesterday && pendingYesterday.checkIn && !pendingYesterday.checkOut) {
        // البصمة الحالية تُغلق مناوبة الأمس
        const closeTime = filteredTimes[0] || null;
        try {
          await storage.updateAttendance(pendingYesterday.id, {
            checkOut: closeTime,
            totalHours: "24",
            status: "present",
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            penalty: "0",
          });
        } catch (e: any) {
          errors.push(`${employee.name} - إغلاق مناوبة ${yesterday}: ${e.message}`);
        }
        // إنشاء يوم راحة لليوم الحالي إذا لم يكن موجوداً
        const restToday = await storage.getAttendanceByEmployeeAndDate(employee.id, entry.date);
        if (!restToday) {
          try {
            await storage.createAttendance({
              employeeId: employee.id,
              date: entry.date,
              checkIn: null,
              checkOut: null,
              status: "rest",
              notes: "يوم راحة — مناوبة 24 ساعة",
              lateMinutes: 0,
              earlyLeaveMinutes: 0,
              middleAbsenceMinutes: 0,
              totalHours: "0",
              penalty: "0",
            });
          } catch (e: any) {
            errors.push(`${employee.name} - يوم الراحة ${entry.date}: ${e.message}`);
          }
        }
        imported++;
        continue;
      } else {
        // بصمة جديدة = بداية مناوبة جديدة
        const newCheckIn = filteredTimes[0] || null;
        const existing24h = await storage.getAttendanceByEmployeeAndDate(employee.id, entry.date);
        if (existing24h) {
          if (existing24h.status === "rest") {
            // لا تُعدّل أيام الراحة
            duplicates++;
          } else if (newCheckIn && newCheckIn !== existing24h.checkIn) {
            try {
              await storage.updateAttendance(existing24h.id, {
                checkIn: newCheckIn,
                checkOut: null,
                totalHours: "0",
                status: "present",
              });
              imported++;
            } catch (e: any) {
              errors.push(`${employee.name} - ${entry.date}: ${e.message}`);
              skipped++;
            }
          } else {
            duplicates++;
          }
        } else {
          try {
            await storage.createAttendance({
              employeeId: employee.id,
              date: entry.date,
              checkIn: newCheckIn,
              checkOut: null,
              status: "present",
              notes: `مزامنة من: ${sourceName}`,
              lateMinutes: 0,
              earlyLeaveMinutes: 0,
              middleAbsenceMinutes: 0,
              totalHours: "0",
              penalty: "0",
            });
            imported++;
          } catch (e: any) {
            errors.push(`${employee.name} - ${entry.date}: ${e.message}`);
            skipped++;
          }
        }
        continue;
      }
    }
    // ===== نهاية معالجة المناوبة 24 ساعة =====

    let attendanceData: any = {
      employeeId: employee.id,
      date: entry.date,
      checkIn,
      checkOut,
      status: "present",
      notes: `مزامنة من: ${sourceName}`,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      middleAbsenceMinutes,
      totalHours: "0",
      penalty: "0",
      rawPunches: JSON.stringify(filteredTimes),
    };

    if (workRule) {
      const calc = calculateAttendanceDetails(
        checkIn, checkOut,
        workRule.workStartTime, workRule.workEndTime,
        workRule.lateGraceMinutes,
        workRule.latePenaltyPerMinute,
        workRule.earlyLeavePenaltyPerMinute,
        workRule.absencePenalty,
        "present",
        workRule.checkoutEarliestTime
      );
      attendanceData.lateMinutes = calc.lateMinutes;
      attendanceData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
      attendanceData.totalHours = String(calc.totalHours);
      attendanceData.penalty = String(calc.penalty);
      attendanceData.status = calc.status;
    }

    // ابحث عن سجل موجود أولاً (بدل الاعتماد على خطأ التكرار)
    const existing = await storage.getAttendanceByEmployeeAndDate(employee.id, entry.date);

    if (existing) {
      // استعادة البصمات الخام الموجودة مسبقاً للدمج الصحيح
      let existingPunches: string[] = [];
      try {
        const rp = (existing as any).rawPunches;
        if (rp) existingPunches = JSON.parse(rp);
      } catch { existingPunches = []; }

      // دمج البصمات الجديدة مع الموجودة (rawPunches إن وُجدت، وإلا checkIn/checkOut)
      const baseTimes = existingPunches.length > 0
        ? existingPunches
        : [existing.checkIn, existing.checkOut].filter(Boolean) as string[];

      // استعادة البصمات المحذوفة يدوياً لاستثنائها من الدمج
      let manuallyDeleted: string[] = [];
      try {
        const dp = (existing as any).deletedPunches;
        if (dp) manuallyDeleted = JSON.parse(dp);
      } catch { manuallyDeleted = []; }

      const allTimes = filterDuplicateSwipes(
        [...new Set([...baseTimes, ...entry.times])]
          .filter(t => !manuallyDeleted.includes(t))
          .sort(),
        5
      );

      const newCheckIn  = allTimes[0] || null;
      const newCheckOut = allTimes.length > 1 ? allTimes[allTimes.length - 1] : null;
      const newMiddleAbsenceMinutes = calculateMiddleAbsenceMinutes(allTimes, MIDDLE_ABSENCE_GRACE_MINUTES, shiftStartMinForCalc);
      const newRawPunches = JSON.stringify(allTimes);
      const existingRaw = (existing as any).rawPunches ?? null;

      const existingMiddle = (existing as { middleAbsenceMinutes?: number }).middleAbsenceMinutes ?? 0;
      if (newCheckOut !== existing.checkOut || newCheckIn !== existing.checkIn || newMiddleAbsenceMinutes !== existingMiddle || newRawPunches !== existingRaw) {
        let updateData: any = { checkIn: newCheckIn, checkOut: newCheckOut, middleAbsenceMinutes: newMiddleAbsenceMinutes, rawPunches: newRawPunches, deletedPunches: (existing as any).deletedPunches ?? null };
        if (workRule) {
          const calc = calculateAttendanceDetails(
            newCheckIn, newCheckOut,
            workRule.workStartTime, workRule.workEndTime,
            workRule.lateGraceMinutes,
            workRule.latePenaltyPerMinute,
            workRule.earlyLeavePenaltyPerMinute,
            workRule.absencePenalty,
            "present",
            workRule.checkoutEarliestTime
          );
          updateData.lateMinutes = calc.lateMinutes;
          updateData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
          updateData.totalHours = String(calc.totalHours);
          updateData.penalty = String(calc.penalty);
          updateData.status = calc.status;
        }
        try {
          await storage.updateAttendance(existing.id, updateData);
          imported++;
        } catch (updateErr: any) {
          errors.push(`${employee.name} - ${entry.date}: ${updateErr.message}`);
          skipped++;
        }
      } else {
        duplicates++;
      }
    } else {
      // إنشاء سجل جديد
      try {
        await storage.createAttendance(attendanceData);
        imported++;
      } catch (e: any) {
        errors.push(`${employee.name} - ${entry.date}: ${e.message}`);
        skipped++;
      }
    }
  }

  return { imported, skipped, duplicates, errors };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ====== مسارات المصادقة ======

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      req.session.userId = user.id;
      req.session.username = user.username;
      res.json({ id: user.id, username: user.username });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "غير مصرح" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "غير مصرح" });
    res.json({ id: user.id, username: user.username });
  });

  // حماية جميع مسارات API
  app.use("/api", requireAuth);

  // تسجيل النشاطات (POST/PUT/PATCH/DELETE) — سجلات الحضور اليدوية لها تسجيل تفصيلي خاص بها
  const SKIP_LOG_PATHS = ["/api/login", "/api/logout", "/api/auth/me", "/api/archive-action"];
  const SKIP_LOG_PREFIXES = ["/api/activity-logs"];
  const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
  app.use((req: Request, res: Response, next: NextFunction) => {
    // تجاهل مسارات الحضور اليدوية — تُعالج بتسجيل تفصيلي داخل كل route handler
    const isAttendanceCRUD =
      (req.method === "POST" && req.path === "/api/attendance") ||
      ((req.method === "PATCH" || req.method === "DELETE") && /^\/api\/attendance\/[^/]+$/.test(req.path));
    const isActivityLogPath = SKIP_LOG_PREFIXES.some(prefix => req.path === prefix || req.path.startsWith(prefix + "/"));
    if (!WRITE_METHODS.includes(req.method) || !req.path.startsWith("/api/") || SKIP_LOG_PATHS.includes(req.path) || isAttendanceCRUD || isActivityLogPath) {
      return next();
    }
    res.on("finish", () => {
      storage.createActivityLog({
        userId: req.session?.userId ?? null,
        username: req.session?.username ?? (req.path.startsWith("/api/agent/") ? "agent" : null),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        details: null,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    });
    next();
  });

  // دالة مساعدة: تسجيل نشاط حضور تفصيلي
  async function logAttendanceAction(opts: {
    req: Request;
    method: string;
    statusCode: number;
    entityId: string;
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    workshopName: string;
    workRuleName: string;
    recordDate: string;
    oldValues?: { checkIn: string | null; checkOut: string | null; status: string };
    newValues?: { checkIn: string | null; checkOut: string | null; status: string };
    details?: string;
  }) {
    await storage.createActivityLog({
      userId: opts.req.session?.userId ?? null,
      username: opts.req.session?.username ?? null,
      method: opts.method,
      path: opts.req.path,
      statusCode: opts.statusCode,
      details: opts.details ?? null,
      createdAt: new Date().toISOString(),
      entityType: "attendance",
      entityId: opts.entityId,
      oldValues: opts.oldValues ? JSON.stringify(opts.oldValues) : null,
      newValues: opts.newValues ? JSON.stringify(opts.newValues) : null,
      employeeName: opts.employeeName,
      employeeCode: opts.employeeCode,
      workshopName: opts.workshopName,
      workRuleName: opts.workRuleName,
      recordDate: opts.recordDate,
      isReverted: 0,
    }).catch(() => {});
  }

  // سجل النشاطات — يسمح فقط لـ bachir tedjani
  app.get("/api/activity-logs", async (req, res) => {
    if (req.session.username !== "owner") {
      return res.status(403).json({ message: "غير مصرح بالوصول" });
    }
    const logs = await storage.getActivityLogs(500);
    res.json(logs);
  });

  // إرجاع تعديل حضور (المالك فقط) — يُعيد القيم القديمة ويقفل السجل
  app.post("/api/activity-logs/:id/revert", async (req, res) => {
    if (req.session.username !== "owner") {
      return res.status(403).json({ message: "غير مصرح بالوصول" });
    }
    try {
      const log = await storage.getActivityLog(req.params.id);
      if (!log) return res.status(404).json({ message: "السجل غير موجود" });
      if (log.entityType !== "attendance") return res.status(400).json({ message: "لا يمكن إرجاع هذا النوع من السجلات" });
      if (log.isReverted === 1) return res.status(400).json({ message: "تم إرجاع هذا التعديل مسبقاً" });
      if (!log.oldValues || !log.entityId) return res.status(400).json({ message: "لا توجد قيم قديمة لاسترجاعها" });

      const oldVals = JSON.parse(log.oldValues) as { checkIn: string | null; checkOut: string | null; status: string };
      const existing = await storage.getAttendanceById(log.entityId);
      if (!existing) return res.status(404).json({ message: "سجل الحضور غير موجود" });

      // إعادة الحساب الكامل باستخدام قاعدة العمل لضمان اتساق البيانات
      const revertWorkRule = await getWorkRuleForEmployee(existing.employeeId);
      const revertData: Partial<InsertAttendance> = {
        checkIn: oldVals.checkIn,
        checkOut: oldVals.checkOut,
        status: oldVals.status,
        middleAbsenceMinutes: 0,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        totalHours: "0",
        penalty: "0",
      };
      if (revertWorkRule) {
        const calc = calculateAttendanceDetails(
          oldVals.checkIn, oldVals.checkOut,
          revertWorkRule.workStartTime, revertWorkRule.workEndTime,
          revertWorkRule.lateGraceMinutes,
          revertWorkRule.latePenaltyPerMinute,
          revertWorkRule.earlyLeavePenaltyPerMinute,
          revertWorkRule.absencePenalty,
          oldVals.status,
          revertWorkRule.checkoutEarliestTime
        );
        revertData.lateMinutes = calc.lateMinutes;
        revertData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
        revertData.totalHours = String(calc.totalHours);
        revertData.penalty = String(calc.penalty);
        revertData.status = calc.status;
      }
      await storage.updateAttendance(log.entityId, revertData);

      // قفل السجل لمنع attendence من إعادة التعديل
      await storage.lockRecord({
        employeeId: existing.employeeId,
        recordDate: existing.date,
        lockedBy: req.session.username,
        lockedAt: new Date().toISOString(),
        activityLogId: log.id,
      });

      // وسم سجل النشاط كـ "مُرجَع"
      await storage.revertActivityLog(log.id, req.session.username);

      notifyAttendanceUpdate();
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // حذف سجل نشاط — المسؤول فقط
  app.delete("/api/activity-logs/:id", async (req, res) => {
    if (req.session.username !== "owner") {
      return res.status(403).json({ message: "غير مصرح بالوصول" });
    }
    try {
      const log = await storage.getActivityLog(req.params.id);
      if (!log) return res.status(404).json({ message: "السجل غير موجود" });
      await storage.deleteActivityLog(req.params.id);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // تسجيل عملية أرشيف مع وصف عربي مفصّل — يستخدمه نظام تأكيد التغييرات
  app.post("/api/archive-action", async (req, res) => {
    if (req.session.username !== "owner") {
      return res.status(403).json({ message: "غير مصرح بالوصول" });
    }
    const { description } = req.body;
    if (!description || typeof description !== "string") {
      return res.status(400).json({ message: "الوصف مطلوب" });
    }
    await storage.createActivityLog({
      userId: req.session?.userId ?? null,
      username: req.session?.username ?? null,
      method: "ACTION",
      path: "/api/archive-action",
      statusCode: 200,
      details: description,
      createdAt: new Date().toISOString(),
    }).catch(() => {});
    res.json({ ok: true });
  });

  app.get("/api/companies", async (_req, res) => {
    const data = await storage.getCompanies();
    res.json(data);
  });

  app.post("/api/companies", async (req, res) => {
    const parsed = insertCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const company = await storage.createCompany(parsed.data);
    res.json(company);
  });

  app.patch("/api/companies/:id", async (req, res) => {
    const partial = insertCompanySchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ message: partial.error.message });
    const company = await storage.updateCompany(req.params.id, partial.data);
    if (!company) return res.status(404).json({ message: "Not found" });
    res.json(company);
  });

  app.delete("/api/companies/:id", async (req, res) => {
    await storage.deleteCompany(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/workshops", async (_req, res) => {
    const data = await storage.getWorkshops();
    res.json(data);
  });

  app.post("/api/workshops", async (req, res) => {
    const parsed = insertWorkshopSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const workshop = await storage.createWorkshop(parsed.data);
    res.json(workshop);
  });

  app.patch("/api/workshops/:id", async (req, res) => {
    const partial = insertWorkshopSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ message: partial.error.message });
    const workshop = await storage.updateWorkshop(req.params.id, partial.data);
    if (!workshop) return res.status(404).json({ message: "Not found" });
    res.json(workshop);
  });

  app.delete("/api/workshops/:id", async (req, res) => {
    await storage.deleteWorkshop(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/positions", async (_req, res) => {
    const data = await storage.getPositions();
    res.json(data);
  });

  app.post("/api/positions", async (req, res) => {
    const parsed = insertPositionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const pos = await storage.createPosition(parsed.data);
    res.json(pos);
  });

  app.patch("/api/positions/:id", async (req, res) => {
    const partial = insertPositionSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ message: partial.error.message });
    const pos = await storage.updatePosition(req.params.id, partial.data);
    if (!pos) return res.status(404).json({ message: "Not found" });
    res.json(pos);
  });

  app.delete("/api/positions/:id", async (req, res) => {
    await storage.deletePosition(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/work-rules", async (_req, res) => {
    const data = await storage.getWorkRules();
    res.json(data);
  });

  app.post("/api/work-rules", async (req, res) => {
    const parsed = insertWorkRuleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const rule = await storage.createWorkRule(parsed.data);
    res.json(rule);
  });

  app.patch("/api/work-rules/:id", async (req, res) => {
    const partial = insertWorkRuleSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ message: partial.error.message });
    const rule = await storage.updateWorkRule(req.params.id, partial.data);
    if (!rule) return res.status(404).json({ message: "Not found" });
    res.json(rule);
  });

  app.delete("/api/work-rules/:id", async (req, res) => {
    await storage.deleteWorkRule(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/employees", async (_req, res) => {
    const data = await storage.getEmployees();
    res.json(data);
  });

  app.post("/api/employees", async (req, res) => {
    const parsed = insertEmployeeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const emp = await storage.createEmployee(parsed.data);
    res.json(emp);
  });

  app.patch("/api/employees/:id", async (req, res) => {
    const partial = insertEmployeeSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ message: partial.error.message });
    const emp = await storage.updateEmployee(req.params.id, partial.data);
    if (!emp) return res.status(404).json({ message: "Not found" });
    res.json(emp);
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const emp = await storage.getEmployee(req.params.id);
      if (!emp) return res.status(404).json({ message: "الموظف غير موجود" });
      await storage.deleteEmployee(req.params.id);
      res.json({ message: "تم حذف الموظف بنجاح" });
    } catch (err) {
      console.error("[delete-employee] ERROR:", err);
      res.status(500).json({ message: "خطأ في الخادم أثناء حذف الموظف" });
    }
  });

  app.patch("/api/employees/:id/hourly-rate", async (req, res) => {
    try {
      if (req.session.username !== "owner") return res.status(403).json({ message: "غير مصرح — المالك فقط" });
      const { hourlyRate } = req.body;
      if (hourlyRate === null || hourlyRate === undefined || hourlyRate === "") return res.status(400).json({ message: "hourlyRate مطلوب" });
      const emp = await storage.updateEmployee(req.params.id, { hourlyRate: String(hourlyRate) });
      if (!emp) return res.status(404).json({ message: "Not found" });
      res.json(emp);
    } catch (err) {
      console.error("[hourly-rate] ERROR:", err);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/stats/weekly", async (req, res) => {
    try {
      const today = new Date();
      const days: { date: string; day: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        days.push({ date: dateStr, day: dayNames[d.getDay()] });
      }
      const startDate = days[0].date;
      const endDate = days[days.length - 1].date;
      const [records, allEmployees] = await Promise.all([
        storage.getAttendanceByDateRange(startDate, endDate),
        storage.getEmployees(),
      ]);
      const activeCount = allEmployees.filter((e) => e.isActive !== false).length;
      const result = days.map(({ date, day }) => {
        const dayRecords = records.filter((r) => r.date === date);
        const present = dayRecords.filter((r) => r.status === "present").length;
        const late = dayRecords.filter((r) => r.status === "late").length;
        const absent = Math.max(0, activeCount - present - late);
        return { date, day, present, late, absent };
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "خطأ في جلب الإحصائيات" });
    }
  });

  app.get("/api/stats/monthly-summary", async (_req, res) => {
    try {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const todayStr = now.toISOString().slice(0, 10);

      const lastWeekDate = new Date(now);
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      const lastWeekStr = lastWeekDate.toISOString().slice(0, 10);

      const [allEmployees, monthRecords, lastWeekRecords] = await Promise.all([
        storage.getEmployees(),
        storage.getAttendanceByDateRange(monthStart, todayStr),
        storage.getAttendanceByDate(lastWeekStr),
      ]);

      const activeEmployees = allEmployees.filter((e) => e.isActive !== false);

      const lateCountMap: Record<string, number> = {};
      for (const r of monthRecords) {
        if (r.status === "late") {
          lateCountMap[r.employeeId] = (lateCountMap[r.employeeId] || 0) + 1;
        }
      }

      const topLate = Object.entries(lateCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([employeeId, lateDays]) => {
          const emp = allEmployees.find((e) => e.id === employeeId);
          return { employeeId, name: emp?.name || "—", lateDays };
        });

      const lastWeekPresent = lastWeekRecords.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;
      const lastWeekRate =
        activeEmployees.length > 0
          ? Math.round((lastWeekPresent / activeEmployees.length) * 100)
          : 0;

      const todayRecords = await storage.getAttendanceByDate(todayStr);
      const workshops = await storage.getWorkshops();
      const workshopRates = workshops
        .map((ws) => {
          const wsEmps = activeEmployees.filter((e) => e.workshopId === ws.id);
          if (wsEmps.length === 0) return null;
          const wsEmpIds = new Set(wsEmps.map((e) => e.id));
          const present = todayRecords.filter(
            (r) => wsEmpIds.has(r.employeeId) && (r.status === "present" || r.status === "late")
          ).length;
          const rate = Math.round((present / wsEmps.length) * 100);
          return { workshopId: ws.id, name: ws.name, present, total: wsEmps.length, rate };
        })
        .filter(Boolean);

      res.json({ topLate, lastWeekRate, lastWeekPresent, totalActive: activeEmployees.length, workshopRates });
    } catch (err: any) {
      res.status(500).json({ message: "خطأ في جلب الإحصائيات الشهرية" });
    }
  });

  // Monthly trend endpoint — آخر N أشهر (present rate + absent rate)
  app.get("/api/stats/monthly-trend", async (req, res) => {
    try {
      const months = Math.min(12, Math.max(1, parseInt(req.query.months as string) || 6));
      const workshopId = req.query.workshopId as string | undefined;
      const workRuleId = req.query.workRuleId as string | undefined;

      const [allEmployees, offDaySetting] = await Promise.all([
        storage.getEmployees(),
        storage.getAppSetting("weeklyOffDays"),
      ]);

      const weeklyOffDays: number[] = offDaySetting ? JSON.parse(offDaySetting.value) : [];

      let filteredEmps = allEmployees.filter((e) => e.isActive !== false);
      if (workshopId) filteredEmps = filteredEmps.filter((e) => e.workshopId === workshopId);
      if (workRuleId) filteredEmps = filteredEmps.filter((e) => e.workRuleId === workRuleId);
      const empIds = new Set(filteredEmps.map((e) => e.id));
      const totalActive = filteredEmps.length;

      const now = new Date();
      const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

      const todayStr = now.toISOString().slice(0, 10);

      // Build date ranges for all months (cap current month at today to exclude future days)
      const ranges = Array.from({ length: months }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const fullLastDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
        // For the current (or future) month, cap at today so future days don't deflate the rate
        const lastDay = fullLastDay > todayStr ? todayStr : fullLastDay;
        // Count only working days up to lastDay
        const capDay = parseInt(lastDay.slice(8));
        let workingDays = 0;
        for (let day = 1; day <= capDay; day++) {
          const dow = new Date(year, month, day).getDay();
          if (!weeklyOffDays.includes(dow)) workingDays++;
        }
        return { firstDay, lastDay, label: `${arabicMonths[month]} ${year}`, workingDays };
      });

      const monthlyRecords = await Promise.all(
        ranges.map((r) => storage.getAttendanceByDateRange(r.firstDay, r.lastDay))
      );

      const results = ranges.map((r, i) => {
        const recs = monthlyRecords[i].filter((rec) => empIds.has(rec.employeeId));
        const presentCount = recs.filter((rec) => rec.status === "present" || rec.status === "late").length;
        const totalPossible = totalActive * r.workingDays;
        const presentRate = totalPossible > 0 ? Math.min(100, Math.round((presentCount / totalPossible) * 100)) : 0;
        const absentRate = Math.max(0, 100 - presentRate);
        return { label: r.label, presentRate, absentRate };
      });

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // SSE endpoint — يستمع المتصفح هنا لأي حركة جديدة
  app.get("/api/attendance/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write("data: connected\n\n");
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
  });

  app.get("/api/attendance", async (req, res) => {
    const date = req.query.date as string;
    if (!date) return res.status(400).json({ message: "Date required" });
    const data = await storage.getAttendanceByDate(date);

    // إعادة حساب middle_absence_minutes من raw_punches عند كل استعلام
    // يمنع أي قيم قديمة مخزّنة من الظهور (خاصة بعد تعديلات مباشرة على البيانات)
    const [allEmployees, allWorkRules] = await Promise.all([
      storage.getEmployees(),
      storage.getWorkRules(),
    ]);
    const empMap = new Map(allEmployees.map((e: any) => [e.id, e]));
    const ruleMap = new Map(allWorkRules.map((r: any) => [r.id, r]));
    const defaultRule = allWorkRules.find((r: any) => r.isDefault) ?? null;

    const fixed = (data as any[]).map((rec: any) => {
      let punches: string[] = [];
      try { if (rec.rawPunches) punches = JSON.parse(rec.rawPunches); } catch {}
      if (punches.length <= 2) return { ...rec, middleAbsenceMinutes: 0 };
      const emp = empMap.get(rec.employeeId) as any;
      const rule: any = (emp?.workRuleId ? ruleMap.get(emp.workRuleId) : null) ?? defaultRule;
      const shiftStartMin = rule?.workStartTime ? timeToMinGlobal(rule.workStartTime) : null;
      const recomputed = calculateMiddleAbsenceMinutes(punches, MIDDLE_ABSENCE_GRACE_MINUTES, shiftStartMin);
      return { ...rec, middleAbsenceMinutes: recomputed };
    });

    res.json(fixed);
  });

  // دالة مساعدة: هل الشهر مجمّد لهذا الموظف؟
  async function isMonthFrozenForEmployee(employeeId: string, date: string): Promise<boolean> {
    const employee = await storage.getEmployee(employeeId);
    if (!employee || !employee.workshopId || !employee.workRuleId) return false;
    const month = date.slice(0, 7); // YYYY-MM
    const archives = await storage.getFrozenArchives(month);
    return archives.some(
      (a) => a.workshopId === employee.workshopId && a.workRuleId === employee.workRuleId
    );
  }

  app.post("/api/attendance", async (req, res) => {
    try {
      const { employeeId, date, checkIn, checkOut, status, notes } = req.body;
      if (!employeeId || !date) return res.status(400).json({ message: "employeeId and date are required" });

      const employee = await storage.getEmployee(employeeId);
      if (!employee) return res.status(404).json({ message: "Employee not found" });

      // تعديل التقارير مقصور على المالك فقط
      if (req.session.username !== "owner") {
        return res.status(403).json({ message: "صلاحية تعديل التقارير متاحة للمالك فقط" });
      }

      // منع التعديل إذا كان الشهر مجمّداً في الأرشيف
      if (await isMonthFrozenForEmployee(employeeId, date)) {
        return res.status(423).json({ message: "هذا الشهر محفوظ في الأرشيف ولا يمكن التعديل عليه" });
      }

      const workRule = await getWorkRuleForEmployee(employeeId);

      const manualPunches = [checkIn, checkOut].filter(Boolean) as string[];
      let attendanceData: any = {
        employeeId, date,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: status || "present",
        notes: notes || null,
        lateMinutes: 0, earlyLeaveMinutes: 0, middleAbsenceMinutes: 0, totalHours: "0", penalty: "0",
        rawPunches: manualPunches.length > 0 ? JSON.stringify(manualPunches) : null,
      };

      if (workRule) {
        const calc = calculateAttendanceDetails(
          checkIn || null, checkOut || null,
          workRule.workStartTime, workRule.workEndTime,
          workRule.lateGraceMinutes,
          workRule.latePenaltyPerMinute,
          workRule.earlyLeavePenaltyPerMinute,
          workRule.absencePenalty,
          status || "present",
          workRule.checkoutEarliestTime
        );
        attendanceData.lateMinutes = calc.lateMinutes;
        attendanceData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
        attendanceData.totalHours = String(calc.totalHours);
        attendanceData.penalty = String(calc.penalty);
        attendanceData.status = calc.status;
      }

      const record = await storage.createAttendance(attendanceData);
      notifyAttendanceUpdate();

      // تسجيل تفصيلي
      const allWorkshops = await storage.getWorkshops();
      const workshop = allWorkshops.find(w => w.id === employee.workshopId);
      logAttendanceAction({
        req, method: "POST", statusCode: 200, entityId: record.id,
        employeeId: employee.id, employeeName: employee.name, employeeCode: employee.employeeCode,
        workshopName: workshop?.name ?? "—", workRuleName: workRule?.name ?? "—",
        recordDate: date,
        newValues: { checkIn: record.checkIn, checkOut: record.checkOut, status: record.status },
      });

      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    try {
      const existingRecords = await storage.getAttendanceById(req.params.id);
      if (!existingRecords) return res.status(404).json({ message: "Record not found" });

      const { checkIn, checkOut, status, notes, removePunchIndex } = req.body;
      const employeeId = existingRecords.employeeId;

      // تعديل التقارير مقصور على المالك فقط
      if (req.session.username !== "owner") {
        return res.status(403).json({ message: "صلاحية تعديل التقارير متاحة للمالك فقط" });
      }

      // منع التعديل إذا كان الشهر مجمّداً في الأرشيف
      if (await isMonthFrozenForEmployee(employeeId, existingRecords.date)) {
        return res.status(423).json({ message: "هذا الشهر محفوظ في الأرشيف ولا يمكن التعديل عليه" });
      }

      const workRule = await getWorkRuleForEmployee(employeeId);

      // ===== حذف بصمة وسطى من rawPunches =====
      if (removePunchIndex !== undefined) {
        const punchIdx = Number(removePunchIndex);
        if (!Number.isInteger(punchIdx) || isNaN(punchIdx)) {
          return res.status(400).json({ message: "index البصمة غير صالح" });
        }
        let rawArr: string[] = [];
        try {
          const rp = (existingRecords as any).rawPunches;
          if (rp) rawArr = JSON.parse(rp);
        } catch { rawArr = []; }

        // التحقق: يجب أن يكون index وسطياً (ليس الأول ولا الأخير)
        if (rawArr.length < 3 || punchIdx <= 0 || punchIdx >= rawArr.length - 1) {
          return res.status(400).json({ message: "لا يمكن حذف هذه البصمة" });
        }

        // حذف البصمة وإعادة الحساب
        const deletedTime = rawArr[punchIdx];
        const newRawArr = rawArr.filter((_, i) => i !== punchIdx);
        const newRawPunches = JSON.stringify(newRawArr);
        const newCheckIn  = newRawArr[0] || null;
        const newCheckOut = newRawArr.length > 1 ? newRawArr[newRawArr.length - 1] : null;
        const shiftStartMinP = workRule?.workStartTime ? timeToMinGlobal(workRule.workStartTime) : null;
        const newMiddleAbs = newRawArr.length >= 2
          ? calculateMiddleAbsenceMinutes(newRawArr, MIDDLE_ABSENCE_GRACE_MINUTES, shiftStartMinP)
          : 0;

        // إضافة الوقت المحذوف لقائمة deletedPunches لمنع عودته عند المزامنة
        let deletedArr: string[] = [];
        try {
          const dp = (existingRecords as any).deletedPunches;
          if (dp) deletedArr = JSON.parse(dp);
        } catch { deletedArr = []; }
        if (!deletedArr.includes(deletedTime)) {
          deletedArr.push(deletedTime);
        }

        const punchUpdateData: Partial<InsertAttendance> = {
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          rawPunches: newRawPunches,
          middleAbsenceMinutes: newMiddleAbs,
          deletedPunches: JSON.stringify(deletedArr),
        };

        if (workRule) {
          const calc = calculateAttendanceDetails(
            newCheckIn, newCheckOut,
            workRule.workStartTime, workRule.workEndTime,
            workRule.lateGraceMinutes,
            workRule.latePenaltyPerMinute,
            workRule.earlyLeavePenaltyPerMinute,
            workRule.absencePenalty,
            existingRecords.status ?? "present",
            workRule.checkoutEarliestTime
          );
          punchUpdateData.lateMinutes = calc.lateMinutes;
          punchUpdateData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
          punchUpdateData.totalHours = String(calc.totalHours);
          punchUpdateData.penalty = String(calc.penalty);
          punchUpdateData.status = calc.status;
        }

        const updatedRecord = await storage.updateAttendance(req.params.id, punchUpdateData);
        if (!updatedRecord) return res.status(404).json({ message: "Not found" });

        const empPunch = await storage.getEmployee(employeeId);
        const wsListP = await storage.getWorkshops();
        logAttendanceAction({
          req, method: "PATCH", statusCode: 200, entityId: existingRecords.id,
          employeeId, employeeName: empPunch?.name ?? "—", employeeCode: empPunch?.employeeCode ?? "—",
          workshopName: wsListP.find(w => w.id === empPunch?.workshopId)?.name ?? "—",
          workRuleName: workRule?.name ?? "—",
          recordDate: existingRecords.date,
          oldValues: { checkIn: existingRecords.checkIn, checkOut: existingRecords.checkOut, status: existingRecords.status },
          newValues: { checkIn: newCheckIn, checkOut: newCheckOut, status: existingRecords.status, notes: `حُذفت البصمة الوسيطة: ${rawArr[punchIdx]}` },
        });

        notifyAttendanceUpdate();
        return res.json(updatedRecord);
      }
      // ===== نهاية حذف البصمة الوسطى =====

      const finalStatus = status || existingRecords.status;
      // يوم الراحة: نُصفّر الأوقات والحسابات بشكل قاطع
      const isRestStatus = finalStatus === "rest";
      const finalCheckIn = isRestStatus ? null : (checkIn !== undefined ? (checkIn || null) : existingRecords.checkIn);
      const finalCheckOut = isRestStatus ? null : (checkOut !== undefined ? (checkOut || null) : existingRecords.checkOut);

      // نُعيد الغياب الوسيط إلى 0 فقط عند تغيير الأوقات فعلياً (لا مجرد وجود الحقل في الطلب)
      const timesChanged =
        (checkIn !== undefined && (checkIn || null) !== existingRecords.checkIn) ||
        (checkOut !== undefined && (checkOut || null) !== existingRecords.checkOut);
      // إعادة بناء rawPunches عند تغيير الأوقات أو تحويل إلى يوم راحة
      let newRawPunches: string | null = (existingRecords as any).rawPunches ?? null;
      if (isRestStatus) {
        newRawPunches = null;
      } else if (timesChanged) {
        let existingRawArr: string[] = [];
        try {
          const rp = (existingRecords as any).rawPunches;
          if (rp) existingRawArr = JSON.parse(rp);
        } catch { existingRawArr = []; }
        let newRawArr: string[];
        if (existingRawArr.length >= 2) {
          // الاحتفاظ بالبصمات الوسطى وتحديث أول بصمة وآخر بصمة فقط
          const middle = existingRawArr.slice(1, -1);
          newRawArr = [
            ...(finalCheckIn ? [finalCheckIn] : []),
            ...middle,
            ...(finalCheckOut ? [finalCheckOut] : []),
          ];
        } else {
          newRawArr = [finalCheckIn, finalCheckOut].filter(Boolean) as string[];
        }
        newRawPunches = newRawArr.length > 0 ? JSON.stringify(newRawArr) : null;
      }

      // إعادة حساب الغياب الوسيط من rawPunches الناتجة إن تغيرت الأوقات
      let finalMiddleAbsenceMinutes: number = existingRecords.middleAbsenceMinutes ?? 0;
      if (isRestStatus) {
        finalMiddleAbsenceMinutes = 0;
      } else if (timesChanged) {
        const punchesForCalc: string[] = newRawPunches ? (() => { try { return JSON.parse(newRawPunches); } catch { return []; } })() : [];
        const patchShiftStartMin = workRule?.workStartTime ? timeToMinGlobal(workRule.workStartTime) : null;
        finalMiddleAbsenceMinutes = punchesForCalc.length >= 2
          ? calculateMiddleAbsenceMinutes(punchesForCalc, MIDDLE_ABSENCE_GRACE_MINUTES, patchShiftStartMin)
          : 0;
      }

      const updateData: Partial<InsertAttendance> = {
        checkIn: finalCheckIn,
        checkOut: finalCheckOut,
        status: finalStatus,
        notes: notes !== undefined ? notes : existingRecords.notes,
        middleAbsenceMinutes: finalMiddleAbsenceMinutes,
        rawPunches: newRawPunches,
      };

      if (isRestStatus) {
        // يوم راحة: نُصفّر كل الحسابات
        updateData.lateMinutes = 0;
        updateData.earlyLeaveMinutes = 0;
        updateData.totalHours = "0";
        updateData.penalty = "0";
      } else if (workRule) {
        const calc = calculateAttendanceDetails(
          finalCheckIn, finalCheckOut,
          workRule.workStartTime, workRule.workEndTime,
          workRule.lateGraceMinutes,
          workRule.latePenaltyPerMinute,
          workRule.earlyLeavePenaltyPerMinute,
          workRule.absencePenalty,
          finalStatus,
          workRule.checkoutEarliestTime
        );
        updateData.lateMinutes = calc.lateMinutes;
        updateData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
        updateData.totalHours = String(calc.totalHours);
        updateData.penalty = String(calc.penalty);
        updateData.status = calc.status;
      }

      const record = await storage.updateAttendance(req.params.id, updateData);
      if (!record) return res.status(404).json({ message: "Not found" });

      // تسجيل تفصيلي
      const employee = await storage.getEmployee(employeeId);
      const allWorkshops2 = await storage.getWorkshops();
      const workshop2 = allWorkshops2.find(w => w.id === employee?.workshopId);
      logAttendanceAction({
        req, method: "PATCH", statusCode: 200, entityId: existingRecords.id,
        employeeId, employeeName: employee?.name ?? "—", employeeCode: employee?.employeeCode ?? "—",
        workshopName: workshop2?.name ?? "—", workRuleName: workRule?.name ?? "—",
        recordDate: existingRecords.date,
        oldValues: { checkIn: existingRecords.checkIn, checkOut: existingRecords.checkOut, status: existingRecords.status },
        newValues: { checkIn: record.checkIn, checkOut: record.checkOut, status: record.status },
      });

      notifyAttendanceUpdate();
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/attendance/:id", async (req, res) => {
    try {
      const existing = await storage.getAttendanceById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Record not found" });

      // تعديل التقارير مقصور على المالك فقط
      if (req.session.username !== "owner") {
        return res.status(403).json({ message: "صلاحية تعديل التقارير متاحة للمالك فقط" });
      }

      // منع الحذف إذا كان الشهر مجمّداً في الأرشيف
      if (await isMonthFrozenForEmployee(existing.employeeId, existing.date)) {
        return res.status(423).json({ message: "هذا الشهر محفوظ في الأرشيف ولا يمكن التعديل عليه" });
      }

      // تسجيل تفصيلي قبل الحذف
      const empDel = await storage.getEmployee(existing.employeeId);
      const allWorkshopsDel = await storage.getWorkshops();
      const workshopDel = allWorkshopsDel.find(w => w.id === empDel?.workshopId);
      const workRuleDel = await getWorkRuleForEmployee(existing.employeeId);

      await storage.deleteAttendance(req.params.id);

      logAttendanceAction({
        req, method: "DELETE", statusCode: 200, entityId: existing.id,
        employeeId: existing.employeeId, employeeName: empDel?.name ?? "—", employeeCode: empDel?.employeeCode ?? "—",
        workshopName: workshopDel?.name ?? "—", workRuleName: workRuleDel?.name ?? "—",
        recordDate: existing.date,
        oldValues: { checkIn: existing.checkIn, checkOut: existing.checkOut, status: existing.status },
      });

      notifyAttendanceUpdate();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/monthly", async (req, res) => {
    try {
      const month = req.query.month as string;
      const year = req.query.year as string;
      if (!month || !year) return res.status(400).json({ message: "Month and year required" });

      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const allEmployees = await storage.getEmployees();
      const allPositions = await storage.getPositions();
      const allCompanies = await storage.getCompanies();
      const allWorkshops = await storage.getWorkshops();
      const records = await storage.getAttendanceByDateRange(startDate, endDate);

      const report = allEmployees.filter(e => e.isActive).map(emp => {
        const empRecords = records.filter(r => r.employeeId === emp.id);
        const position = allPositions.find(p => p.id === emp.positionId);
        const company = allCompanies.find(c => c.id === emp.companyId);
        const workshop = allWorkshops.find(w => w.id === emp.workshopId);

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          positionName: position?.name || "",
          companyId: emp.companyId || "",
          companyName: company?.name || "",
          workshopId: emp.workshopId || "",
          workshopName: workshop?.name || "",
          shift: emp.shift || "",
          totalDays: empRecords.length,
          presentDays: empRecords.filter(r => r.status === "present").length,
          lateDays: empRecords.filter(r => r.status === "late").length,
          absentDays: empRecords.filter(r => r.status === "absent").length,
          leaveDays: empRecords.filter(r => r.status === "leave").length,
          totalHours: empRecords.reduce((sum, r) => sum + parseFloat(r.totalHours || "0"), 0),
          totalLateMinutes: empRecords.reduce((sum, r) => sum + r.lateMinutes, 0),
          totalPenalty: empRecords.reduce((sum, r) => sum + parseFloat(r.penalty || "0"), 0),
        };
      });

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/range", async (req, res) => {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;
      const workRuleId = req.query.workRuleId as string | undefined;
      const workshopId = req.query.workshopId as string | undefined;
      const employeeId = req.query.employeeId as string | undefined;

      if (!from || !to) return res.status(400).json({ message: "from and to dates required" });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
        return res.status(400).json({ message: "dates must be in YYYY-MM-DD format" });
      if (from > to) return res.status(400).json({ message: "from date must be before or equal to to date" });

      const todayStr = new Date().toISOString().slice(0, 10);

      // توحيد كل الأشهر على 30 يوم
      const fromDate = new Date(from + "T00:00:00");
      const toDate = new Date(to + "T00:00:00");
      let monthBonus = 0;          // تعديل النقاط (فيفري فقط)
      let isFullMonth = false;     // هل النطاق شهر كامل؟
      let isFullMonth31 = false;   // هل الشهر 31 يوم؟

      if (
        fromDate.getMonth() === toDate.getMonth() &&
        fromDate.getFullYear() === toDate.getFullYear()
      ) {
        const year = fromDate.getFullYear();
        const month = fromDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        if (fromDate.getDate() === 1 && toDate.getDate() === daysInMonth) {
          isFullMonth = true;
          if (daysInMonth === 28 || daysInMonth === 29) {
            // فيفري: نعدّل النقاط لأعلى (+1 أو +2)
            monthBonus = 30 - daysInMonth;
          } else if (daysInMonth === 31) {
            // شهر 31 يوم: اليوم 31 يُعالج على مستوى السجل (حضر=0، غاب=-1)
            isFullMonth31 = true;
            monthBonus = 0;
          }
          // 30 يوم: لا تغيير
        }
      }

      // جلب كل البيانات بالتوازي بدل التتابع
      const [allEmployees, allWorkshops, allWorkRules, records, offDaySetting, allLeavesRange, allOverrides] = await Promise.all([
        storage.getEmployees(),
        storage.getWorkshops(),
        storage.getWorkRules(),
        storage.getAttendanceByDateRange(from, to),
        storage.getAppSetting("weeklyOffDays"),
        storage.getLeaves(),
        storage.getScheduleOverrides(),
      ]);

      // فلترة الجداول الخاصة النشطة ضمن نطاق التاريخ المطلوب
      const activeOverrides = allOverrides.filter(
        ov => ov.dateFrom <= to && ov.dateTo >= from
      );

      const weeklyOffDays: number[] = offDaySetting ? JSON.parse(offDaySetting.value) : [];

      // Build full date range list
      const allDatesInRange: string[] = [];
      const curDate = new Date(from + "T00:00:00");
      const endDate = new Date(to + "T00:00:00");
      while (curDate <= endDate) {
        allDatesInRange.push(curDate.toISOString().slice(0, 10));
        curDate.setDate(curDate.getDate() + 1);
      }
      // (holidayDateSet مزالة — أيام الراحة تُحسب per-employee باستخدام getEffectiveWeeklyOffDays)

      // بناء Map لبحث O(1) بدل filter O(N×M) لكل موظف
      const recordsByEmployee = new Map<string, typeof records>();
      for (const rec of records) {
        const list = recordsByEmployee.get(rec.employeeId);
        if (list) list.push(rec);
        else recordsByEmployee.set(rec.employeeId, [rec]);
      }

      let filteredEmployees = allEmployees.filter(e => e.isActive);
      if (workRuleId) filteredEmployees = filteredEmployees.filter(e => e.workRuleId === workRuleId);
      if (workshopId) filteredEmployees = filteredEmployees.filter(e => e.workshopId === workshopId);
      if (employeeId) filteredEmployees = filteredEmployees.filter(e => e.id === employeeId);

      // بناء Map للورشات وقواعد العمل للبحث السريع
      const workshopsMap = new Map(allWorkshops.map(w => [w.id, w]));
      const workRulesMap = new Map(allWorkRules.map(r => [r.id, r]));
      const defaultRule = allWorkRules.find(r => r.isDefault) ?? allWorkRules[0];

      // دالة: بناء مجموعة تواريخ العطل غير المدفوعة لموظف معين (ضمن نطاق التاريخ)
      function buildUnpaidLeaveDates(emp: typeof allEmployees[0]): Set<string> {
        const s = new Set<string>();
        for (const lv of allLeavesRange) {
          if (lv.isPaid) continue;
          const applies =
            lv.targetType === "all" ||
            (lv.targetType === "shift" && (emp.shift || "morning") === lv.shiftValue) ||
            (lv.targetType === "workshop" && emp.workshopId === lv.workshopId) ||
            (lv.targetType === "employee" && emp.id === lv.employeeId);
          if (!applies) continue;
          const lvStart = lv.startDate > from ? lv.startDate : from;
          const lvEnd = lv.endDate < to ? lv.endDate : to;
          let d = new Date(lvStart + "T00:00:00");
          const dEnd = new Date(lvEnd + "T00:00:00");
          while (d <= dEnd) { s.add(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
        }
        return s;
      }

      const report = filteredEmployees.map(emp => {
        const workRule = workRulesMap.get(emp.workRuleId ?? "") ?? defaultRule;
        const workshop = workshopsMap.get(emp.workshopId ?? "");
        const empRecords = recordsByEmployee.get(emp.id) ?? [];

        // أيام الراحة الفعلية للموظف (تراعي الجداول الاستثنائية كرمضان)
        const isEmpHoliday = (date: string): boolean => {
          const dow = new Date(date + "T00:00:00").getDay();
          return getEffectiveWeeklyOffDays(date, emp.workRuleId, activeOverrides, weeklyOffDays).includes(dow);
        };

        let totalWorkDayMinutes = 480;
        if (workRule) {
          if (workRule.is24hShift) {
            totalWorkDayMinutes = 1440; // 24 ساعة
          } else {
            const [startH, startM] = workRule.workStartTime.split(":").map(Number);
            const [endH, endM] = workRule.workEndTime.split(":").map(Number);
            totalWorkDayMinutes = Math.max(1, (endH * 60 + endM) - (startH * 60 + startM));
          }
        }

        const earlyArrivalGrace = workRule?.earlyArrivalGraceMinutes ?? 0;
        const lateArrivalGrace = workRule?.lateGraceMinutes ?? 0;
        const earlyLeaveGrace = workRule?.earlyLeaveGraceMinutes ?? 0;
        const lateLeaveGrace = workRule?.lateLeaveGraceMinutes ?? 0;

        function timeToMin(t: string | null): number | null {
          if (!t) return null;
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        }

        const workStartMin = timeToMin(workRule?.workStartTime ?? "08:00")!;
        const workEndMin = timeToMin(workRule?.workEndTime ?? "16:00")!;

        function normalizeTime(rawTime: string | null, canonicalTime: string, graceBeforeMin: number, graceAfterMin: number): string {
          if (!rawTime) return canonicalTime;
          const rawTotal = timeToMin(rawTime)!;
          const canonTotal = timeToMin(canonicalTime)!;
          const diff = rawTotal - canonTotal;
          if (diff >= -graceBeforeMin && diff <= graceAfterMin) return canonicalTime;
          return rawTime;
        }

        let attendanceScore = 0;
        const dailyRecords = empRecords.map(rec => {
          // فحص إن كان هناك جدول خاص نشط لهذا اليوم ولقاعدة عمل الموظف
          const dayOverride = activeOverrides.find(ov =>
            rec.date >= ov.dateFrom && rec.date <= ov.dateTo &&
            (!ov.workRuleId || ov.workRuleId === emp.workRuleId)
          );

          // أوقات العمل الفعلية: من الجدول الخاص إن وُجد، وإلا من قاعدة العمل
          const effectiveStartTime = dayOverride?.workStartTime ?? workRule?.workStartTime ?? "08:00";
          const effectiveEndTime   = dayOverride?.workEndTime   ?? workRule?.workEndTime   ?? "16:00";
          const effectiveStartMin  = timeToMin(effectiveStartTime)!;
          let   effectiveEndMin    = timeToMin(effectiveEndTime)!;
          if (dayOverride?.isOvernight && effectiveEndMin <= effectiveStartMin) {
            effectiveEndMin += 24 * 60;
          }
          const effectiveTotalWorkDayMin = dayOverride
            ? Math.max(1, effectiveEndMin - effectiveStartMin)
            : totalWorkDayMinutes;

          const normalizedCheckIn = normalizeTime(
            rec.checkIn, effectiveStartTime, earlyArrivalGrace, lateArrivalGrace,
          );
          const normalizedCheckOut = normalizeTime(
            rec.checkOut, effectiveEndTime, earlyLeaveGrace, lateLeaveGrace,
          );

          let checkInMin = timeToMin(rec.checkIn);
          let checkOutMin = timeToMin(rec.checkOut);

          // كشف البيانات المقلوبة للمناوبات الليلية:
          // إذا كان checkIn (≈05:00) قبل بداية الجدول (22:00) وcheckOut (≈22:00) بعدها
          // → الجهاز خزّن الدخول والخروج معكوسَين → نعكسهما للحساب فقط (دون تغيير قاعدة البيانات هنا)
          if (dayOverride?.isOvernight && checkInMin !== null && checkOutMin !== null) {
            const SWAP_TOLERANCE = 60;
            if (checkInMin < effectiveStartMin && checkOutMin >= (effectiveStartMin - SWAP_TOLERANCE)) {
              const morningExit = checkInMin;          // 05:xx → هذا هو وقت الخروج الحقيقي
              checkInMin  = checkOutMin;               // 22:xx → هذا هو وقت الدخول الحقيقي
              checkOutMin = morningExit + 24 * 60;    // 05:xx+24h = وقت الخروج بالأبعاد المطلقة
            }
          }

          // للمناوبات الليلية (جدول خاص): إذا كان خروج الموظف بعد منتصف الليل يُعدَّل إلى أبعاد مطلقة
          if (dayOverride?.isOvernight && checkOutMin !== null && checkOutMin < effectiveStartMin) {
            checkOutMin += 24 * 60;
          }

          // [تصليح] كشف عام للخروج الليلي بدون جدول خاص:
          // إذا كان checkOut أصغر من checkIn فهذا يعني الخروج بعد منتصف الليل (اليوم التالي)
          // مثال: دخول 22:11 وخروج 04:59 → 04:59 < 22:11 → نضيف 24h لـ checkOutMin
          if (!dayOverride && checkInMin !== null && checkOutMin !== null && checkOutMin < checkInMin) {
            checkOutMin += 24 * 60;
          }

          // حساب التأخير والخروج المبكر من الإحداثيات (للعرض والساعات الإضافية)
          const rawLateMinutes = checkInMin !== null
            ? Math.max(0, checkInMin - effectiveStartMin)
            : 0;
          const checkoutEarliestMin = !dayOverride && workRule?.checkoutEarliestTime
            ? timeToMin(workRule.checkoutEarliestTime)
            : null;
          const earlyLeaveRefMin = checkoutEarliestMin ?? effectiveEndMin;
          const rawEarlyLeaveMinutes = checkOutMin !== null
            ? Math.max(0, earlyLeaveRefMin - checkOutMin)
            : 0;

          // [تصليح] للنقاط: استخدم القيم المُخزَّنة عند غياب الجدول الخاص
          // (القيم المُخزَّنة حُسبت بالجدول الصحيح وقت التسجيل)
          // عند وجود جدول خاص نحسب من الإحداثيات الزمنية (سلوك صحيح حالياً)
          let effectiveLateMinutes: number;
          let effectiveEarlyLeaveMinutes: number;
          if (dayOverride) {
            effectiveLateMinutes = Math.max(0, rawLateMinutes - lateArrivalGrace);
            effectiveEarlyLeaveMinutes = Math.max(0, rawEarlyLeaveMinutes - earlyLeaveGrace);
          } else {
            effectiveLateMinutes = Math.max(0, (rec.lateMinutes ?? 0) - lateArrivalGrace);
            effectiveEarlyLeaveMinutes = Math.max(0, (rec.earlyLeaveMinutes ?? 0) - earlyLeaveGrace);
          }

          // إعادة حساب الغياب الوسيطي من البصمات الخام مع مراعاة وقت بداية الوردية
          // هذا يُصحح السجلات المُخزَّنة قبل تطبيق الإصلاح (الفجوات قبل الوردية لا تُحسب غياباً)
          let middleAbsenceMin: number;
          if ((rec as any).rawPunches) {
            try {
              const rawPunchArr = JSON.parse((rec as any).rawPunches) as string[];
              middleAbsenceMin = calculateMiddleAbsenceMinutes(rawPunchArr, MIDDLE_ABSENCE_GRACE_MINUTES, effectiveStartMin);
            } catch {
              middleAbsenceMin = rec.middleAbsenceMinutes ?? 0;
            }
          } else {
            middleAbsenceMin = rec.middleAbsenceMinutes ?? 0;
          }

          let dailyScore = 0;
          if (rec.status === "absent") {
            dailyScore = 0;
          } else if (rec.status === "leave") {
            dailyScore = 1;
          } else if (rec.status === "rest") {
            dailyScore = 1;
          } else if (workRule?.is24hShift && (rec.status === "present" || rec.status === "late") && Number(rec.totalHours || 0) >= 20) {
            dailyScore = 2;
          } else {
            dailyScore = Math.max(0, 1 - (effectiveLateMinutes + effectiveEarlyLeaveMinutes + middleAbsenceMin) / effectiveTotalWorkDayMin);
          }
          const roundedScore = Math.round(dailyScore * 100) / 100;
          attendanceScore += roundedScore;

          const earlyGraceCutoff = effectiveStartMin - earlyArrivalGrace;
          const earlyOT = (checkInMin !== null && checkInMin < earlyGraceCutoff)
            ? effectiveStartMin - checkInMin : 0;
          const lateOT = (checkOutMin !== null && checkOutMin > effectiveEndMin + lateLeaveGrace)
            ? checkOutMin - effectiveEndMin : 0;
          const overtimeHours = Math.round((earlyOT + lateOT) / 60 * 10) / 10;

          return {
            attendanceId: rec.id,
            date: rec.date,
            checkIn: rec.checkIn,
            checkOut: rec.checkOut,
            normalizedCheckIn,
            normalizedCheckOut,
            status: rec.status,
            lateMinutes: rawLateMinutes,
            earlyLeaveMinutes: rawEarlyLeaveMinutes,
            effectiveLateMinutes,
            effectiveEarlyLeaveMinutes,
            middleAbsenceMinutes: middleAbsenceMin,
            totalHours: rec.totalHours,
            dailyScore: roundedScore,
            pending: rec.checkIn !== null && rec.checkOut === null,
            overtimeHours,
          };
        });

        // --- Holiday injection ---
        // Override existing records on holiday dates, and add synthetic records for missing dates
        // عمال المناوبة 24 ساعة يعملون حتى في أيام العطلة — لا تُطبَّق عليهم العطلة الأسبوعية
        for (const date of (workRule?.is24hShift ? [] : allDatesInRange.filter(isEmpHoliday))) {
          const existing = dailyRecords.find(r => r.date === date);
          if (existing) {
            // Override status and score; keep checkIn/checkOut for reference
            existing.status = "holiday";
            existing.dailyScore = 1.00;
            existing.lateMinutes = 0;
            existing.earlyLeaveMinutes = 0;
            existing.effectiveLateMinutes = 0;
            existing.effectiveEarlyLeaveMinutes = 0;
            // كل دقيقة عمل في يوم العطلة = ساعة إضافية كاملة
            if (existing.checkIn && existing.checkOut) {
              const [inH, inM] = existing.checkIn.split(":").map(Number);
              const [outH, outM] = existing.checkOut.split(":").map(Number);
              const workedMin = (outH * 60 + outM) - (inH * 60 + inM);
              existing.overtimeHours = workedMin > 0 ? Math.round(workedMin / 60 * 10) / 10 : 0;
            } else {
              existing.overtimeHours = 0;
            }
          } else {
            // Inject synthetic holiday record — skip future dates
            if (date > todayStr) continue;
            dailyRecords.push({
              attendanceId: null,
              date,
              checkIn: null,
              checkOut: null,
              normalizedCheckIn: null,
              normalizedCheckOut: null,
              status: "holiday",
              lateMinutes: 0,
              earlyLeaveMinutes: 0,
              effectiveLateMinutes: 0,
              effectiveEarlyLeaveMinutes: 0,
              totalHours: null,
              dailyScore: 1.00,
              pending: false,
              overtimeHours: 0,
            });
          }
        }
        // --- Absent injection for missing working days ---
        // For every day in the report range that is NOT a holiday and has no record → inject absent (0.00)
        for (const date of allDatesInRange) {
          if (isEmpHoliday(date)) continue;
          if (date > todayStr) continue;
          const hasRecord = dailyRecords.some(r => r.date === date);
          if (!hasRecord) {
            dailyRecords.push({
              attendanceId: null,
              date,
              checkIn: null,
              checkOut: null,
              normalizedCheckIn: null,
              normalizedCheckOut: null,
              status: "absent",
              lateMinutes: 0,
              earlyLeaveMinutes: 0,
              effectiveLateMinutes: 0,
              effectiveEarlyLeaveMinutes: 0,
              totalHours: null,
              dailyScore: 0.00,
              pending: false,
              overtimeHours: 0,
            });
          }
        }

        // --- Paid leave injection: الإجازات المدفوعة (عيد الفطر، عيد الأضحى...) تُصحح الغياب إلى نقطة 1 ---
        for (const lv of allLeavesRange) {
          if (!lv.isPaid) continue;
          const lvApplies =
            lv.targetType === "all" ||
            (lv.targetType === "shift" && (emp.shift || "morning") === lv.shiftValue) ||
            (lv.targetType === "workshop" && emp.workshopId === lv.workshopId) ||
            (lv.targetType === "employee" && emp.id === lv.employeeId);
          if (!lvApplies) continue;
          if (lv.startDate > to || lv.endDate < from) continue;

          const lvFrom = lv.startDate > from ? lv.startDate : from;
          const lvTo   = lv.endDate   < to   ? lv.endDate   : to;
          let d = new Date(lvFrom + "T00:00:00");
          const dEnd = new Date(lvTo + "T00:00:00");
          while (d <= dEnd) {
            const dateStr = d.toISOString().slice(0, 10);
            if (dateStr <= todayStr) {
              const existing = dailyRecords.find(r => r.date === dateStr);
              if (existing) {
                if (existing.status === "absent") {
                  existing.status   = "leave";
                  existing.dailyScore = 1.00;
                }
                // حاضر / متأخر / عطلة → لا تغيير (الموظف عمل في يوم الإجازة)
              } else {
                dailyRecords.push({
                  attendanceId: null, date: dateStr,
                  checkIn: null, checkOut: null,
                  normalizedCheckIn: null, normalizedCheckOut: null,
                  status: "leave",
                  lateMinutes: 0, earlyLeaveMinutes: 0,
                  effectiveLateMinutes: 0, effectiveEarlyLeaveMinutes: 0,
                  totalHours: null, dailyScore: 1.00,
                  pending: false, overtimeHours: 0,
                });
              }
            }
            d.setDate(d.getDate() + 1);
          }
        }

        // Re-sort by date after injection
        dailyRecords.sort((a, b) => a.date.localeCompare(b.date));

        // --- قاعدة اليوم 31 (شهر 31 يوم): حضر=0.00 ، غاب=-1.00 ---
        if (isFullMonth31) {
          const day31Str = from.slice(0, 7) + "-31"; // YYYY-MM-31
          const rec31 = dailyRecords.find(r => r.date === day31Str);
          if (rec31) {
            if (rec31.status === "absent") {
              rec31.dailyScore = -1.00;
            } else {
              // حاضر أو عطلة → لا يكسب شيئاً
              rec31.dailyScore = 0.00;
            }
          }
        }

        // --- خصم العطلة الأسبوعية عند الغياب ---
        // لكل يوم غياب في الأسبوع → خصم 0.5 من نقاط العطلة (الأخيرة أولاً)
        // أيام العطلة غير المدفوعة لا تُسبب هذا الخصم
        {
          const empUnpaidLeaveDates = buildUnpaidLeaveDates(emp);
          function getWeekStart(dateStr: string): string {
            const d = new Date(dateStr + "T00:00:00");
            d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); // رجوع للسبت (بداية الأسبوع الفعلي)
            return d.toISOString().slice(0, 10);
          }
          const holidaysByWeek = new Map<string, typeof dailyRecords[0][]>();
          for (const rec of dailyRecords) {
            if (rec.status === "holiday") {
              const wk = getWeekStart(rec.date);
              if (!holidaysByWeek.has(wk)) holidaysByWeek.set(wk, []);
              holidaysByWeek.get(wk)!.push(rec);
            }
          }
          for (const [wk, holidays] of holidaysByWeek) {
            const absenceCount = dailyRecords.filter(
              r => getWeekStart(r.date) === wk && r.status === "absent" && !empUnpaidLeaveDates.has(r.date)
            ).length;
            if (absenceCount === 0) continue;
            let toDeduct = absenceCount * 0.5;
            for (const holiday of [...holidays].sort((a, b) => b.date.localeCompare(a.date))) {
              if (toDeduct <= 0) break;
              const deduct = Math.min(toDeduct, holiday.dailyScore);
              holiday.dailyScore = Math.round((holiday.dailyScore - deduct) * 100) / 100;
              toDeduct = Math.round((toDeduct - deduct) * 100) / 100;
            }
          }
        }

        // Recompute attendanceScore from final dailyRecords
        attendanceScore = dailyRecords.reduce((s, r) => s + r.dailyScore, 0);

        const holidayDays = dailyRecords.filter(r => r.status === "holiday").length;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          workshopId: emp.workshopId || "",
          workshopName: workshop?.name || "",
          workRuleId: emp.workRuleId || "",
          hourlyRate: emp.hourlyRate || "0",
          totalDays: dailyRecords.length,
          presentDays: dailyRecords.filter(r => r.status === "present").length,
          lateDays: dailyRecords.filter(r => r.status === "late").length,
          absentDays: dailyRecords.filter(r => r.status === "absent").length,
          leaveDays: dailyRecords.filter(r => r.status === "leave").length,
          holidayDays,
          totalLateMinutes: dailyRecords.reduce((s, r) => s + r.lateMinutes, 0),
          totalHours: empRecords.reduce((s, r) => s + parseFloat(r.totalHours || "0"), 0),
          attendanceScore: Math.round(attendanceScore * 100) / 100,
          monthBonus,
          normalizedTotalDays: isFullMonth ? 30 : undefined,
          dailyRecords,
        };
      });

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/device-settings", async (_req, res) => {
    const data = await storage.getDeviceSettings();
    res.json(data);
  });

  app.post("/api/device-settings", async (req, res) => {
    const parsed = insertDeviceSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const setting = await storage.createDeviceSetting(parsed.data);
    res.json(setting);
  });

  app.patch("/api/device-settings/:id", async (req, res) => {
    const partial = insertDeviceSettingsSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ message: partial.error.message });
    const setting = await storage.updateDeviceSetting(req.params.id, partial.data);
    if (!setting) return res.status(404).json({ message: "Not found" });
    res.json(setting);
  });

  app.delete("/api/device-settings/:id", async (req, res) => {
    await storage.deleteDeviceSetting(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/device-settings/:id/test", async (req, res) => {
    try {
      const setting = await storage.getDeviceSetting(req.params.id);
      if (!setting) return res.status(404).json({ message: "Not found" });

      const result = await testConnection(setting.ipAddress, setting.port);
      res.json(result);
    } catch (error: any) {
      res.json({ success: false, message: `خطأ غير متوقع: ${error.message}` });
    }
  });

  app.post("/api/device-settings/:id/sync", async (req, res) => {
    try {
      const setting = await storage.getDeviceSetting(req.params.id);
      if (!setting) return res.status(404).json({ message: "Not found" });

      const result = await syncAttendanceLogs(setting.ipAddress, setting.port);
      if (!result.success) {
        return res.json({ imported: 0, skipped: 0, duplicates: 0, total: 0, errors: [result.message], message: result.message });
      }

      const allEmployees = await storage.getEmployees();

      const logsByUser = new Map<string, { date: string; times: string[] }[]>();
      for (const log of result.logs) {
        const uid = String(log.oduid);
        const d = log.odtimestamp;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

        if (!logsByUser.has(uid)) logsByUser.set(uid, []);
        const userLogs = logsByUser.get(uid)!;
        let dayEntry = userLogs.find(d => d.date === dateStr);
        if (!dayEntry) {
          dayEntry = { date: dateStr, times: [] };
          userLogs.push(dayEntry);
        }
        dayEntry.times.push(timeStr);
      }

      const flatLogs: Array<{ uid: string; date: string; times: string[] }> = [];
      for (const [uid, dayEntries] of logsByUser) {
        for (const dayEntry of dayEntries) {
          flatLogs.push({ uid, date: dayEntry.date, times: dayEntry.times });
        }
      }

      const { imported, skipped, duplicates, errors } = await processAttendanceLogs(
        flatLogs,
        allEmployees,
        setting.workshopId,
        setting.name
      );

      await storage.updateDeviceSetting(setting.id, { lastSyncAt: new Date().toISOString() });

      res.json({
        imported,
        skipped,
        duplicates,
        total: result.logs.length,
        errors,
        message: `تمت المزامنة: ${imported} سجل جديد، ${duplicates} مكرر، ${skipped} متخطى`,
      });
    } catch (error: any) {
      res.status(500).json({ message: `خطأ في المزامنة: ${error.message}` });
    }
  });

  app.post("/api/device-settings/:id/clear-logs", async (req, res) => {
    try {
      const setting = await storage.getDeviceSetting(req.params.id);
      if (!setting) return res.status(404).json({ message: "Not found" });

      const result = await clearDeviceLogs(setting.ipAddress, setting.port);
      res.json(result);
    } catch (error: any) {
      res.json({ success: false, message: `خطأ: ${error.message}` });
    }
  });

  // Weekly off days settings
  app.get("/api/settings/weekly-off-days", async (_req, res) => {
    try {
      const setting = await storage.getAppSetting("weeklyOffDays");
      const days: number[] = setting ? JSON.parse(setting.value) : [];
      res.json({ days });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/settings/weekly-off-days", async (req, res) => {
    try {
      const { days } = req.body;
      if (!Array.isArray(days) || days.some(d => typeof d !== "number" || d < 0 || d > 6))
        return res.status(400).json({ message: "days must be an array of integers 0–6" });
      await storage.setAppSetting("weeklyOffDays", JSON.stringify(days));
      res.json({ days });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Agent API key management
  app.get("/api/settings/agent-key", async (_req, res) => {
    try {
      const setting = await storage.getAppSetting(AGENT_API_KEY_SETTING);
      res.json({ key: setting?.value || null });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/settings/agent-key/generate", async (_req, res) => {
    try {
      const newKey = generateApiKey();
      await storage.setAppSetting(AGENT_API_KEY_SETTING, newKey);
      res.json({ key: newKey });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Agent push attendance endpoint
  app.post("/api/agent/push-attendance", async (req, res) => {
    try {
      const { deviceName, workshopId, logs } = req.body;
      if (!Array.isArray(logs)) {
        return res.status(400).json({ message: "البيانات المرسلة غير صحيحة - logs يجب أن يكون مصفوفة" });
      }

      // Validate each log entry shape
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const timePattern = /^\d{2}:\d{2}$/;
      for (let i = 0; i < logs.length; i++) {
        const item = logs[i];
        if (!item || typeof item !== "object") {
          return res.status(400).json({ message: `العنصر رقم ${i + 1} في logs غير صالح` });
        }
        if (typeof item.uid !== "string" || !item.uid.trim()) {
          return res.status(400).json({ message: `العنصر رقم ${i + 1}: uid مطلوب ويجب أن يكون نصاً` });
        }
        if (typeof item.date !== "string" || !datePattern.test(item.date)) {
          return res.status(400).json({ message: `العنصر رقم ${i + 1}: date يجب أن يكون بصيغة YYYY-MM-DD` });
        }
        if (!Array.isArray(item.times) || item.times.some((t: any) => typeof t !== "string" || !timePattern.test(t))) {
          return res.status(400).json({ message: `العنصر رقم ${i + 1}: times يجب أن يكون مصفوفة من أوقات بصيغة HH:MM` });
        }
      }

      // logs format: [{ uid, date, times }] where times is array of HH:MM strings
      const allEmployees = await storage.getEmployees();

      const { imported, skipped, duplicates, errors } = await processAttendanceLogs(
        logs,
        allEmployees,
        workshopId || null,
        deviceName || "Agent"
      );

      // إشعار فوري لجميع المتصفحات المتصلة عند استيراد حركات جديدة
      if (imported > 0) notifyAttendanceUpdate();

      res.json({
        imported,
        skipped,
        duplicates,
        total: logs.length,
        errors,
        message: `تم استيراد ${imported} سجل، ${duplicates} مكرر، ${skipped} متخطى`,
      });
    } catch (error: any) {
      res.status(500).json({ message: `خطأ في استيراد البيانات: ${error.message}` });
    }
  });

  app.post("/api/agent/push-employees", async (req, res) => {
    try {
      const { employees } = req.body;
      if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ message: "employees يجب أن يكون مصفوفة غير فارغة" });
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;

      function isGarbledName(name: string): boolean {
        if (!name) return true;
        const arabicChars = (name.match(/[\u0600-\u06FF]/g) || []).length;
        const totalChars = name.replace(/\s/g, "").length;
        if (totalChars === 0) return true;
        const questionMarks = (name.match(/[?﹖？]/g) || []).length;
        if (questionMarks / totalChars > 0.3) return true;
        const strangeChars = (name.match(/[^\u0000-\u007F\u0600-\u06FF\s\d\-_.]/g) || []).length;
        if (strangeChars > 0 && arabicChars === 0) return true;
        return false;
      }

      for (const emp of employees) {
        const code       = String(emp.code       || "").trim();
        const name       = String(emp.name       || "").trim();
        const cardNumber = emp.cardNumber ? String(emp.cardNumber).trim() : null;
        if (!code || !name) { skipped++; continue; }

        const existing = await storage.getEmployeeByCode(code);
        if (existing) {
          const updateData: Partial<InsertEmployee> = {};
          if (isGarbledName(existing.name) && !isGarbledName(name)) {
            updateData.name = name;
          }
          const normalizedIncoming = cardNumber || null;
          const normalizedExisting = existing.cardNumber || null;
          if (normalizedIncoming !== null && normalizedIncoming !== normalizedExisting) {
            updateData.cardNumber = normalizedIncoming;
          }
          if (Object.keys(updateData).length > 0) {
            await storage.updateEmployee(existing.id, updateData);
            updated++;
          } else {
            skipped++;
          }
          continue;
        }

        await storage.createEmployee({
          name,
          employeeCode: code,
          cardNumber: cardNumber || null,
          positionId: null,
          workRuleId: null,
          companyId: null,
          workshopId: null,
          phone: null,
          shift: "morning",
          contractEndDate: null,
          nonRenewalDate: null,
          isActive: true,
        });
        created++;
      }

      res.json({
        created,
        updated,
        skipped,
        message: `أُنشئ ${created} موظف جديد، حُدِّث ${updated}، ${skipped} بدون تغيير`,
      });
    } catch (error: any) {
      res.status(500).json({ message: `خطأ في مزامنة الموظفين: ${error.message}` });
    }
  });

  app.get("/api/agent/download-package", async (req, res) => {
    try {
      const deviceIds = req.query.deviceIds
        ? String(req.query.deviceIds).split(",").map(s => s.trim()).filter(Boolean)
        : [];

      const apiKeySetting = await storage.getAppSetting(AGENT_API_KEY_SETTING);
      if (!apiKeySetting?.value) {
        return res.status(400).json({ message: "لا يوجد مفتاح API. أنشئ مفتاحاً أولاً من صفحة Agent المصنع." });
      }
      const apiKey = apiKeySetting.value;

      const allDevices = await storage.getDeviceSettings();
      const selectedDevices = deviceIds.length > 0
        ? allDevices.filter(d => deviceIds.includes(d.id))
        : allDevices;

      if (selectedDevices.length === 0) {
        return res.status(400).json({ message: "لا توجد أجهزة محددة. أضف جهازاً من صفحة أجهزة البصمة أولاً." });
      }

      const serverUrl = "https://allal.alllal.com";

      const devicesEnvLine = selectedDevices
        .map(d => {
          const safeName = d.name.replace(/[,:\r\n]/g, "-");
          return `${d.ipAddress}:${d.port}:${safeName}${d.workshopId ? `:${d.workshopId}` : ""}`;
        })
        .join(",");

      const envContent = [
        `# عنوان السيرفر`,
        `SERVER_URL=${serverUrl}`,
        ``,
        `# مفتاح API للتحقق من الهوية`,
        `AGENT_API_KEY=${apiKey}`,
        ``,
        `# أجهزة البصمة (IP:PORT:الاسم:workshopId)`,
        `DEVICES=${devicesEnvLine}`,
        ``,
        `# مهلة الاتصال بالجهاز بالميلي ثانية`,
        `TIMEOUT_MS=10000`,
        ``,
        `# فترة المزامنة التلقائية بالدقائق (مع --watch)`,
        `INTERVAL_MINUTES=30`,
      ].join("\r\n");

      const runBat = [
        `@echo off`,
        `chcp 65001 > nul`,
        `echo ===================================`,
        `echo    نظام مزامنة البصمة - ZK Agent`,
        `echo ===================================`,
        `echo.`,
        ``,
        `where node >nul 2>&1`,
        `if errorlevel 1 (`,
        `  echo خطأ: Node.js غير مثبت.`,
        `  echo حمّل Node.js من: https://nodejs.org`,
        `  pause`,
        `  exit /b 1`,
        `)`,
        ``,
        `echo جارٍ تثبيت الحزم...`,
        `npm install --loglevel=error`,
        `if errorlevel 1 (`,
        `  echo فشل تثبيت الحزم`,
        `  pause`,
        `  exit /b 1`,
        `)`,
        ``,
        `echo.`,
        `echo جارٍ مزامنة سجلات الحضور...`,
        `node zk-agent.js`,
        `echo.`,
        `echo انتهت المزامنة. اضغط أي مفتاح للإغلاق.`,
        `pause`,
      ].join("\r\n");

      const deviceList = selectedDevices
        .map((d, i) => `  ${i + 1}. ${d.name} (${d.ipAddress}:${d.port})`)
        .join("\r\n");

      const instructions = [
        `نظام مزامنة الحضور - تعليمات التثبيت`,
        `=====================================`,
        ``,
        `الأجهزة المُضمَّنة في هذه الحزمة:`,
        deviceList,
        ``,
        `خطوات التثبيت:`,
        ``,
        `الخطوة 1: تثبيت Node.js`,
        `  - حمّل Node.js من: https://nodejs.org/ar/download`,
        `  - اختر النسخة LTS`,
        `  - ثبّتها مع الإعدادات الافتراضية`,
        ``,
        `الخطوة 2: تشغيل المزامنة`,
        `  - انقر مرتين على ملف: run.bat`,
        `  - سيتصل البرنامج بأجهزة البصمة ويرسل البيانات للموقع`,
        ``,
        `الخطوة 3 (اختياري): مزامنة تلقائية`,
        `  - لتشغيل البرنامج تلقائياً كل 30 دقيقة شغّل الأمر:`,
        `      node zk-agent.js --watch`,
        ``,
        `للمساعدة: تواصل مع مدير النظام`,
      ].join("\r\n");

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="zk-agent.zip"`);

      const zip = archiver("zip", { zlib: { level: 6 } });
      zip.on("error", (err) => {
        if (!res.headersSent) {
          res.status(500).json({ message: `خطأ في ضغط الحزمة: ${err.message}` });
        } else {
          res.destroy(err);
        }
      });
      zip.pipe(res);

      zip.append(getZkAgentJs(), { name: "zk-agent.js" });
      zip.append(getAgentPackageJson(), { name: "package.json" });
      zip.append(envContent, { name: ".env" });
      zip.append(runBat, { name: "run.bat" });
      zip.append(instructions, { name: "تعليمات.txt" });

      await zip.finalize();
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ message: `خطأ في إنشاء الحزمة: ${error.message}` });
      }
    }
  });

  app.get("/api/agent/download-mdb-package", async (req, res) => {
    try {
      const apiKeySetting = await storage.getAppSetting(AGENT_API_KEY_SETTING);
      if (!apiKeySetting?.value) {
        return res.status(400).json({ message: "لا يوجد مفتاح API. أنشئ مفتاحاً أولاً من صفحة Agent المصنع." });
      }
      const apiKey = apiKeySetting.value;
      const serverUrl = "https://allal.alllal.com";

      const envContent = [
        `# عنوان الموقع`,
        `SERVER_URL=${serverUrl}`,
        ``,
        `# مفتاح API للتحقق من الهوية`,
        `AGENT_API_KEY=${apiKey}`,
        ``,
        `# مسار ملف قاعدة بيانات ZKTeco`,
        `DB_PATH=C:\\Program Files (x86)\\ZKTeco\\ZKTeco\\att2000.mdb`,
        ``,
        `# عدد الأيام الماضية لمزامنتها في أول تشغيل`,
        `DAYS_BACK=30`,
        ``,
        `# مزامنة الموظفين تلقائياً من جهاز البصمة (true/false)`,
        `SYNC_EMPLOYEES=true`,
        ``,
        `# فترة المزامنة التلقائية بالدقائق (مع --watch)`,
        `INTERVAL_MINUTES=30`,
      ].join("\r\n");

      const runBat = [
        `@echo off`,
        `chcp 65001 > nul`,
        `echo ============================================`,
        `echo    نظام مزامنة الحضور - ZKTeco MDB Agent`,
        `echo ============================================`,
        `echo.`,
        ``,
        `where node >nul 2>&1`,
        `if errorlevel 1 (`,
        `  echo خطأ: Node.js غير مثبت.`,
        `  echo حمّل Node.js من: https://nodejs.org`,
        `  pause`,
        `  exit /b 1`,
        `)`,
        ``,
        `if not exist node_modules (`,
        `  echo جارٍ تثبيت المكتبات...`,
        `  npm install --loglevel=error`,
        `  if errorlevel 1 (`,
        `    echo فشل تثبيت المكتبات`,
        `    pause`,
        `    exit /b 1`,
        `  )`,
        `)`,
        ``,
        `echo.`,
        `echo جارٍ قراءة بيانات ZKTeco ومزامنتها...`,
        `node mdb-agent.js`,
        `echo.`,
        `echo انتهت المزامنة. اضغط أي مفتاح للإغلاق.`,
        `pause`,
      ].join("\r\n");

      const watchBat = [
        `@echo off`,
        `chcp 65001 > nul`,
        `echo ============================================`,
        `echo    مزامنة تلقائية كل 30 دقيقة`,
        `echo ============================================`,
        `echo.`,
        ``,
        `where node >nul 2>&1`,
        `if errorlevel 1 (`,
        `  echo خطأ: Node.js غير مثبت.`,
        `  pause`,
        `  exit /b 1`,
        `)`,
        ``,
        `if not exist node_modules (`,
        `  npm install --loglevel=error`,
        `)`,
        ``,
        `echo اضغط Ctrl+C لإيقاف المزامنة التلقائية.`,
        `echo.`,
        `node mdb-agent.js --watch`,
        `pause`,
      ].join("\r\n");

      const autoBat = [
        `@echo off`,
        `chcp 65001 > nul`,
        `echo ════════════════════════════════════════════`,
        `echo    مراقبة تلقائية - مزامنة فورية عند أي تغيير`,
        `echo ════════════════════════════════════════════`,
        `echo.`,
        `echo سيتم رصد ملف ZKTeco تلقائياً.`,
        `echo عند أي تغيير (حضور جديد - موظف جديد - تعديل) ستبدأ المزامنة فوراً.`,
        `echo.`,
        ``,
        `where node >nul 2>&1`,
        `if errorlevel 1 (`,
        `  echo خطأ: Node.js غير مثبت.`,
        `  echo حمّل Node.js من: https://nodejs.org`,
        `  pause`,
        `  exit /b 1`,
        `)`,
        ``,
        `if not exist node_modules (`,
        `  echo جارٍ تثبيت المكتبات...`,
        `  npm install --loglevel=error`,
        `)`,
        ``,
        `echo اضغط Ctrl+C لإيقاف المراقبة.`,
        `echo.`,
        `node mdb-agent.js --auto`,
        `pause`,
      ].join("\r\n");

      const instructions = [
        `نظام مزامنة الحضور - ZKTeco MDB Agent`,
        `========================================`,
        ``,
        `هذا البرنامج يقرأ بيانات الحضور مباشرة من قاعدة بيانات برنامج ZKTeco`,
        `الموجودة في: C:\\Program Files (x86)\\ZKTeco\\ZKTeco\\att2000.mdb`,
        ``,
        `المتطلبات:`,
        `  - Windows 7 أو أحدث`,
        `  - برنامج ZKTeco مثبّت على نفس الجهاز`,
        `  - Node.js مثبّت (https://nodejs.org)`,
        ``,
        `خطوات التثبيت:`,
        ``,
        `الخطوة 1: تثبيت Node.js`,
        `  - حمّل Node.js من: https://nodejs.org/ar/download`,
        `  - اختر النسخة LTS وثبّتها بالإعدادات الافتراضية`,
        ``,
        `الخطوة 2: تشغيل المزامنة`,
        `  - انقر مرتين على: run.bat`,
        `  - سيقرأ البرنامج بيانات الحضور ويرسلها للموقع`,
        ``,
        `الخطوة 3 (مراقبة تلقائية - موصى به):`,
        `  - انقر مرتين على: auto.bat  ← الأفضل`,
        `  - سيراقب الملف باستمرار ويزامن فوراً عند أي تغيير`,
        `  - يكتشف: حضور جديد، موظف جديد، تعديل الاسم، تغيير رقم البطاقة`,
        ``,
        `الخطوة 3 (بديل - مزامنة كل 30 دقيقة):`,
        `  - انقر مرتين على: watch.bat`,
        ``,
        `ملاحظات:`,
        `  - إذا كان مسار ملف قاعدة البيانات مختلفاً، عدّل DB_PATH في ملف .env`,
        `  - عند أول تشغيل سيُنشئ البرنامج الموظفين تلقائياً في النظام`,
        `  - سجلات الحضور السابقة (30 يوم) ستُرسل في أول تشغيل`,
        ``,
        `للمساعدة: تواصل مع مدير النظام`,
      ].join("\r\n");

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="mdb-agent.zip"`);

      const zip = archiver("zip", { zlib: { level: 6 } });
      zip.on("error", (err) => {
        if (!res.headersSent) {
          res.status(500).json({ message: `خطأ في ضغط الحزمة: ${err.message}` });
        } else {
          res.destroy(err);
        }
      });
      zip.pipe(res);

      zip.append(getMdbAgentJs(),    { name: "mdb-agent.js" });
      zip.append(getMdbPackageJson(), { name: "package.json" });
      zip.append(envContent,          { name: ".env" });
      zip.append(runBat,              { name: "run.bat" });
      zip.append(autoBat,             { name: "auto.bat" });
      zip.append(watchBat,            { name: "watch.bat" });
      zip.append(instructions,        { name: "تعليمات.txt" });

      await zip.finalize();
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ message: `خطأ في إنشاء الحزمة: ${error.message}` });
      }
    }
  });

  app.post("/api/import/attendance", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const content = req.file.buffer.toString("utf-8");
      const lines = content.split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) return res.status(400).json({ message: "الملف فارغ أو لا يحتوي على بيانات" });

      const header = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase());

      const codeIdx = header.findIndex(h => ["employee_code", "employeecode", "code", "id", "no"].includes(h));
      const dateIdx = header.findIndex(h => ["date", "التاريخ", "تاريخ"].includes(h));
      const checkInIdx = header.findIndex(h => ["check_in", "checkin", "time_in", "in"].includes(h));
      const checkOutIdx = header.findIndex(h => ["check_out", "checkout", "time_out", "out"].includes(h));

      if (codeIdx === -1 || dateIdx === -1) {
        return res.status(400).json({
          message: "الملف لا يحتوي على الأعمدة المطلوبة",
          detectedColumns: header,
        });
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map(c => c.trim());
        const code = cols[codeIdx];
        const date = cols[dateIdx];
        const checkIn = checkInIdx !== -1 ? cols[checkInIdx] : null;
        const checkOut = checkOutIdx !== -1 ? cols[checkOutIdx] : null;

        if (!code || !date) { skipped++; continue; }

        const employee = await storage.getEmployeeByCode(code);
        if (!employee) {
          errors.push(`سطر ${i + 1}: الموظف برقم ${code} غير موجود`);
          skipped++;
          continue;
        }

        const workRule = await getWorkRuleForEmployee(employee.id);

        const importedPunches = [checkIn, checkOut].filter(Boolean) as string[];
        let attendanceData: any = {
          employeeId: employee.id,
          date,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          status: "present",
          notes: "مستورد من ملف",
          lateMinutes: 0, earlyLeaveMinutes: 0, middleAbsenceMinutes: 0, totalHours: "0", penalty: "0",
          rawPunches: importedPunches.length > 0 ? JSON.stringify(importedPunches) : null,
        };

        if (workRule) {
          const calc = calculateAttendanceDetails(
            checkIn || null, checkOut || null,
            workRule.workStartTime, workRule.workEndTime,
            workRule.lateGraceMinutes,
            workRule.latePenaltyPerMinute,
            workRule.earlyLeavePenaltyPerMinute,
            workRule.absencePenalty,
            "present",
            workRule.checkoutEarliestTime
          );
          attendanceData.lateMinutes = calc.lateMinutes;
          attendanceData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
          attendanceData.totalHours = String(calc.totalHours);
          attendanceData.penalty = String(calc.penalty);
          attendanceData.status = calc.status;
        }

        try {
          await storage.createAttendance(attendanceData);
          imported++;
        } catch (e: any) {
          errors.push(`سطر ${i + 1}: ${e.message}`);
          skipped++;
        }
      }

      res.json({ imported, skipped, errors, message: `تم استيراد ${imported} سجل بنجاح` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── استقبال بيانات الحضور من الوكيل المحلي (Local Agent) ──────────────────
  app.post("/api/sync/local-agent", async (req, res) => {
    try {
      const { serialNumber, deviceName, logs } = req.body as {
        serialNumber?: string;
        deviceName?: string;
        logs: Array<{ uid: string; timestamp: string; status?: string }>;
      };

      if (!logs || !Array.isArray(logs) || logs.length === 0) {
        return res.status(400).json({ message: "لا توجد سجلات للمعالجة" });
      }

      // البحث عن الجهاز بالرقم التسلسلي
      const devices = await storage.getDeviceSettings();
      const device = serialNumber
        ? devices.find(d => d.serialNumber === serialNumber)
        : null;

      // تحويل السجلات لصيغة processAttendanceLogs
      const grouped = new Map<string, Map<string, string[]>>();
      for (const log of logs) {
        const uid = String(log.uid).trim();
        if (!uid || !log.timestamp) continue;
        const dt = new Date(log.timestamp);
        if (isNaN(dt.getTime())) continue;
        const date = dt.toISOString().split("T")[0];
        const time = dt.toTimeString().substring(0, 5);
        if (!grouped.has(uid)) grouped.set(uid, new Map());
        const byDate = grouped.get(uid)!;
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date)!.push(time);
      }

      const processedLogs: Array<{ uid: string; date: string; times: string[] }> = [];
      for (const [uid, byDate] of grouped) {
        for (const [date, times] of byDate) {
          processedLogs.push({ uid, date, times });
        }
      }

      const allEmployees = await storage.getEmployees();
      const workshopId = device?.workshopId ?? null;
      const source = deviceName || serialNumber || "الوكيل المحلي";

      const { imported, skipped, duplicates, errors } = await processAttendanceLogs(
        processedLogs, allEmployees, workshopId, source
      );

      if (device) {
        await storage.updateDeviceSetting(device.id, { lastSyncAt: new Date().toISOString() });
      }

      console.log(`[LocalAgent] SN=${serialNumber} imported=${imported} duplicates=${duplicates} skipped=${skipped}`);
      res.json({ imported, skipped, duplicates, errors, message: `تم استيراد ${imported} سجل` });
    } catch (error: any) {
      console.error("[LocalAgent] Error:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // ── استيراد بيانات ZKTeco من جداول MySQL القديمة ──────────────────────────
  app.post("/api/sync/from-zk-mysql", async (req, res) => {
    try {
      const { IS_MYSQL, pool } = await import("./db");

      if (!IS_MYSQL) {
        return res.status(400).json({
          message: "هذه الخاصية تعمل فقط في بيئة الإنتاج (MySQL).",
        });
      }

      const mysqlPool = pool as import("mysql2/promise").Pool;
      const conn = await mysqlPool.getConnection();

      try {
        // ── 1. استيراد الموظفين من جدول users ──
        const [zkUsers] = await conn.execute(
          `SELECT id, name, employee_id, pin 
           FROM users 
           WHERE employee_id IS NOT NULL 
             AND employee_id != '' 
             AND employee_id NOT IN ('alla', 'allal')
           ORDER BY id`
        ) as any[];

        let empCreated = 0;
        let empSkipped = 0;

        // بناء خريطة users.id (INT) → employee_code لاستخدامها لاحقاً في الحضور
        const userIdToCode: Record<number, string> = {};

        for (const u of zkUsers) {
          const code = String(u.employee_id || u.pin || "").trim();
          const name = String(u.name || "").trim();
          if (!code || !name) { empSkipped++; continue; }

          userIdToCode[u.id] = code;

          const existing = await storage.getEmployeeByCode(code);
          if (existing) { empSkipped++; continue; }

          await storage.createEmployee({
            name,
            employeeCode: code,
            positionId: null,
            workRuleId: null,
            companyId: null,
            workshopId: null,
            phone: null,
            shift: "morning",
            contractEndDate: null,
            nonRenewalDate: null,
            isActive: true,
          });
          empCreated++;
        }

        // ── 2. جلب الموظفين المحدّثين لبناء خريطة code → employee UUID ──
        const allEmployees = await storage.getEmployees();
        const codeToEmployee: Record<string, string> = {};
        for (const e of allEmployees) {
          codeToEmployee[e.employeeCode] = e.id;
        }

        // ── 3. استيراد سجلات الحضور من جدول attendance ──
        const [zkAttendance] = await conn.execute(
          `SELECT a.employee_id as user_int_id, 
                  DATE_FORMAT(a.log_date, '%Y-%m-%d') as date,
                  TIME_FORMAT(a.check_in, '%H:%i') as check_in,
                  TIME_FORMAT(a.check_out, '%H:%i') as check_out,
                  a.status
           FROM attendance a
           JOIN users u ON a.employee_id = u.id
           WHERE u.employee_id IS NOT NULL AND u.employee_id != ''
           ORDER BY a.log_date DESC`
        ) as any[];

        let attCreated = 0;
        let attSkipped = 0;
        const attErrors: string[] = [];

        for (const att of zkAttendance) {
          const code = userIdToCode[att.user_int_id];
          if (!code) { attSkipped++; continue; }

          const employeeId = codeToEmployee[code];
          if (!employeeId) { attSkipped++; continue; }

          const date = att.date;
          if (!date) { attSkipped++; continue; }

          // جلب قاعدة الحضور للموظف
          const workRule = await getWorkRuleForEmployee(employeeId);
          const checkIn = att.check_in || null;
          const checkOut = att.check_out || null;

          const statusMap: Record<string, string> = {
            present: "present", late: "late", absent: "absent",
            holiday: "leave", sick_leave: "leave",
          };
          let status = statusMap[att.status] || "present";

          let calc = { lateMinutes: 0, earlyLeaveMinutes: 0, totalHours: 0, penalty: 0, status };
          if (workRule && checkIn) {
            calc = calculateAttendanceDetails(
              checkIn, checkOut,
              workRule.workStartTime, workRule.workEndTime,
              workRule.lateGraceMinutes,
              workRule.latePenaltyPerMinute,
              workRule.earlyLeavePenaltyPerMinute,
              workRule.absencePenalty,
              status,
              workRule.checkoutEarliestTime
            );
          }

          try {
            const zkPunches = [checkIn, checkOut].filter(Boolean) as string[];
            await storage.createAttendance({
              employeeId,
              date,
              checkIn,
              checkOut,
              status: calc.status,
              lateMinutes: calc.lateMinutes,
              earlyLeaveMinutes: calc.earlyLeaveMinutes,
              middleAbsenceMinutes: 0,
              totalHours: String(calc.totalHours),
              penalty: String(calc.penalty),
              notes: null,
              rawPunches: zkPunches.length > 0 ? JSON.stringify(zkPunches) : null,
            });
            attCreated++;
          } catch (e: any) {
            if (e.message?.includes("duplicate") || e.message?.includes("Duplicate") || e.code === "23505") {
              attSkipped++;
            } else {
              attErrors.push(`${code} - ${date}: ${e.message}`);
              attSkipped++;
            }
          }
        }

        res.json({
          employees: { created: empCreated, skipped: empSkipped },
          attendance: { created: attCreated, skipped: attSkipped, errors: attErrors.slice(0, 10) },
          message: `تم استيراد ${empCreated} موظف و${attCreated} سجل حضور من بيانات ZKTeco`,
        });
      } finally {
        conn.release();
      }
    } catch (error: any) {
      res.status(500).json({ message: `خطأ في الاستيراد: ${error.message}` });
    }
  });

  // ── ZKTeco ADMS Push Receiver (device pushes data to server) ─────────────
  // الجهاز يُرسل البيانات للسيرفر عبر HTTP بدلاً من أن نسحب منه

  const admsTextParser = (req: any, res: any, next: any) => {
    if (req.headers["content-type"]?.includes("application/json")) {
      return next();
    }
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => { data += chunk; });
    req.on("end", () => { req.body = data; next(); });
    req.on("error", next);
  };

  // GET /iclock/cdata — device registration handshake
  app.get("/iclock/cdata", async (req, res) => {
    const sn = String(req.query.SN || "");
    const table = String(req.query.table || "");
    console.log(`[ADMS] GET /iclock/cdata SN=${sn} table=${table}`);

    // If device is just checking status (table=Status), respond OK
    if (table === "Status") {
      res.setHeader("Content-Type", "text/plain");
      return res.send("OK");
    }

    // Initial handshake — respond with ADMS config (OK + stamp headers)
    res.setHeader("Content-Type", "text/plain");
    res.send(
      `OK\r\n` +
      `ATTLOGStamp=9999999999\r\n` +
      `OPERLOGStamp=9999999999\r\n` +
      `ATTPHOTOStamp=9999999999\r\n` +
      `ErrorDelay=30\r\n` +
      `Delay=10\r\n` +
      `TransTimes=00:00;14:05\r\n` +
      `TransInterval=1\r\n` +
      `TransFlag=111111111\r\n` +
      `TimeZone=0\r\n` +
      `Realtime=1\r\n` +
      `Encrypt=None\r\n`
    );
  });

  // POST /iclock/cdata — receive attendance records (ATTLOG)
  app.post("/iclock/cdata", admsTextParser, async (req, res) => {
    const sn = String(req.query.SN || "");
    const table = String(req.query.table || "");
    console.log(`[ADMS] POST /iclock/cdata SN=${sn} table=${table}`);

    res.setHeader("Content-Type", "text/plain");

    if (table !== "ATTLOG") {
      return res.send("OK");
    }

    try {
      // Find device by serial number
      const devices = await storage.getDeviceSettings();
      const device = devices.find(d => d.serialNumber && d.serialNumber === sn);

      if (!device) {
        console.log(`[ADMS] Unknown device SN=${sn}`);
        return res.send("OK");
      }

      const body = typeof req.body === "string" ? req.body : "";
      const lines = body.split(/\r?\n/).filter(l => l.trim());

      // Parse ATTLOG lines: UID\tYYYY-MM-DD HH:MM:SS\tSTATUS\tVERIFY\tWORKCODE
      const logsByUser = new Map<string, { date: string; times: string[] }[]>();

      for (const line of lines) {
        const parts = line.split("\t");
        if (parts.length < 2) continue;

        const uid = String(parts[0]).trim();
        const dateTimeRaw = String(parts[1]).trim();
        if (!uid || !dateTimeRaw) continue;

        // Parse "2024-01-15 08:30:00"
        const [datePart, timePart] = dateTimeRaw.split(" ");
        if (!datePart || !timePart) continue;

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) continue;
        const timeShort = timePart.substring(0, 5); // HH:MM

        if (!logsByUser.has(uid)) logsByUser.set(uid, []);
        const userLogs = logsByUser.get(uid)!;
        let dayEntry = userLogs.find(d => d.date === datePart);
        if (!dayEntry) {
          dayEntry = { date: datePart, times: [] };
          userLogs.push(dayEntry);
        }
        dayEntry.times.push(timeShort);
      }

      const flatLogs: Array<{ uid: string; date: string; times: string[] }> = [];
      for (const [uid, dayEntries] of logsByUser) {
        for (const dayEntry of dayEntries) {
          flatLogs.push({ uid, date: dayEntry.date, times: dayEntry.times });
        }
      }

      const allEmployees = await storage.getEmployees();
      const { imported, skipped, duplicates } = await processAttendanceLogs(
        flatLogs,
        allEmployees,
        device.workshopId,
        device.name
      );

      await storage.updateDeviceSetting(device.id, { lastSyncAt: new Date().toISOString() });

      console.log(`[ADMS] SN=${sn} imported=${imported} duplicates=${duplicates} skipped=${skipped} total=${lines.length}`);
      res.send("OK");
    } catch (error: any) {
      console.error(`[ADMS] Error processing ATTLOG from SN=${sn}:`, error.message);
      res.send("OK");
    }
  });

  // GET /iclock/getrequest — device polling for commands (none to send)
  app.get("/iclock/getrequest", (req, res) => {
    const sn = String(req.query.SN || "");
    console.log(`[ADMS] GET /iclock/getrequest SN=${sn}`);
    res.setHeader("Content-Type", "text/plain");
    res.send("OK");
  });

  // ---- Leaves (العطل) ----

  app.get("/api/leaves", async (req, res) => {
    try {
      const list = await storage.getLeaves();
      return res.json(list);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  app.post("/api/leaves", async (req, res) => {
    try {
      const { startDate, endDate, isPaid, targetType, shiftValue, workshopId, employeeId, notes } = req.body;
      if (!startDate || !endDate) return res.status(400).json({ message: "startDate و endDate مطلوبان" });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
        return res.status(400).json({ message: "تنسيق التاريخ يجب أن يكون YYYY-MM-DD" });
      if (startDate > endDate) return res.status(400).json({ message: "تاريخ البداية يجب أن يكون قبل نهاية الفترة" });
      const validTargetTypes = ["all", "shift", "workshop", "employee"];
      if (targetType && !validTargetTypes.includes(targetType))
        return res.status(400).json({ message: "targetType غير صحيح" });
      if (targetType === "shift" && !["morning", "evening"].includes(shiftValue))
        return res.status(400).json({ message: "shiftValue مطلوب: morning أو evening" });
      if (targetType === "workshop" && !workshopId)
        return res.status(400).json({ message: "workshopId مطلوب عند targetType=workshop" });
      if (targetType === "employee" && !employeeId)
        return res.status(400).json({ message: "employeeId مطلوب عند targetType=employee" });
      if (targetType === "employee" && employeeId) {
        const emp = await storage.getEmployee(employeeId);
        if (!emp) return res.status(400).json({ message: "العامل غير موجود" });
      }
      const record = await storage.createLeave({
        startDate,
        endDate,
        isPaid: isPaid !== false,
        targetType: targetType || "all",
        shiftValue: shiftValue || null,
        workshopId: workshopId || null,
        employeeId: employeeId || null,
        notes: notes || null,
        createdAt: new Date().toISOString(),
        createdBy: req.session.username ?? "unknown",
      });
      return res.json(record);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/leaves/:id", async (req, res) => {
    try {
      await storage.deleteLeave(req.params.id);
      return res.status(204).send();
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // ---- Grants (المنح والعقوبات) ----
  // الوصول مقيّد لـ owner و attendence فقط
  function requireOwnerOrAttendence(req: Request, res: Response): boolean {
    if (!["owner", "attendence"].includes(req.session.username ?? "")) {
      res.status(403).json({ message: "غير مصرح — هذه الميزة للمالك ومسؤول الحضور فقط" });
      return false;
    }
    return true;
  }

  function requireAnyRole(req: Request, res: Response): boolean {
    if (!["owner", "attendence", "observer"].includes(req.session.username ?? "")) {
      res.status(403).json({ message: "غير مصرح" });
      return false;
    }
    return true;
  }

  app.get("/api/grants", async (req, res) => {
    if (!requireOwnerOrAttendence(req, res)) return;
    try {
      const list = await storage.getGrants();
      return res.json(list);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  app.post("/api/grants", async (req, res) => {
    if (!requireOwnerOrAttendence(req, res)) return;
    try {
      const { name, amount, type, targetType, shiftValue, workshopId, employeeIds, conditions } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ message: "اسم المنحة مطلوب" });
      if (!amount || isNaN(parseFloat(amount))) return res.status(400).json({ message: "المبلغ يجب أن يكون رقماً" });
      if (!["grant", "penalty"].includes(type)) return res.status(400).json({ message: "type يجب أن يكون grant أو penalty" });
      if (!["all", "shift", "workshop", "employee"].includes(targetType))
        return res.status(400).json({ message: "targetType غير صحيح" });
      if (targetType === "shift" && !["morning", "evening"].includes(shiftValue))
        return res.status(400).json({ message: "shiftValue مطلوب: morning أو evening" });
      if (targetType === "workshop" && !workshopId)
        return res.status(400).json({ message: "workshopId مطلوب" });
      if (targetType === "employee") {
        try {
          const empArr = JSON.parse(employeeIds ?? "[]");
          if (!Array.isArray(empArr) || empArr.length === 0)
            return res.status(400).json({ message: "employeeIds يجب أن يكون مصفوفة تحتوي على معرّف واحد على الأقل" });
        } catch {
          return res.status(400).json({ message: "employeeIds: تنسيق JSON غير صحيح" });
        }
      }
      const record = await storage.createGrant(
        {
          name: name.trim(),
          amount: String(parseFloat(amount)),
          type,
          targetType,
          shiftValue: shiftValue || null,
          workshopId: workshopId || null,
          employeeIds: employeeIds || null,
          createdAt: new Date().toISOString(),
          createdBy: req.session.username ?? "unknown",
        },
        Array.isArray(conditions) ? conditions : []
      );
      return res.json(record);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/grants/:id", async (req, res) => {
    if (!requireOwnerOrAttendence(req, res)) return;
    try {
      await storage.deleteGrant(req.params.id);
      return res.status(204).send();
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // ---- Grants Report (تقرير المنح) ----
  // GET /api/grants/report?month=YYYY-MM[&grantId=ID]
  app.get("/api/grants/report", async (req, res) => {
    if (!requireOwnerOrAttendence(req, res)) return;
    try {
      const month = req.query.month as string;
      const grantId = (req.query.grantId as string) || "all";

      if (!month || !/^\d{4}-\d{2}$/.test(month))
        return res.status(400).json({ message: "month يجب أن يكون بتنسيق YYYY-MM" });

      const [year, monthNum] = month.split("-").map(Number);
      const from = `${month}-01`;
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const to = `${month}-${String(daysInMonth).padStart(2, "0")}`;

      const [allGrantsRaw, allEmployees, allWorkshops, allWorkRules, records, offDaySetting, allLeavesGrants, allScheduleOverrides] = await Promise.all([
        storage.getGrants(),
        storage.getEmployees(),
        storage.getWorkshops(),
        storage.getWorkRules(),
        storage.getAttendanceByDateRange(from, to),
        storage.getAppSetting("weeklyOffDays"),
        storage.getLeaves(),
        storage.getScheduleOverrides(),
      ]);

      const targetGrants = grantId === "all"
        ? allGrantsRaw
        : allGrantsRaw.filter(g => g.id === grantId);
      if (!targetGrants.length) return res.json([]);

      const weeklyOffDays: number[] = offDaySetting ? JSON.parse(offDaySetting.value) : [];
      const activeOverridesGrants = allScheduleOverrides.filter(ov => ov.dateFrom <= to && ov.dateTo >= from);
      const activeEmployees = allEmployees.filter(e => e.isActive);
      const workshopsMap = new Map(allWorkshops.map(w => [w.id, w]));
      const workRulesMap = new Map(allWorkRules.map(r => [r.id, r]));
      const defaultRule = allWorkRules.find(r => r.isDefault) ?? allWorkRules[0];
      const todayStr = new Date().toISOString().slice(0, 10);

      // Build date list for the month
      const allDates: string[] = [];
      { const cur = new Date(from + "T00:00:00"); const end = new Date(to + "T00:00:00");
        while (cur <= end) { allDates.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1); }
      }

      const recordsByEmployee = new Map<string, typeof records>();
      for (const rec of records) {
        const list = recordsByEmployee.get(rec.employeeId);
        if (list) list.push(rec);
        else recordsByEmployee.set(rec.employeeId, [rec]);
      }

      function timeToMinLocal(t: string | null): number | null {
        if (!t) return null;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      }

      interface GrantReportRow {
        employeeId: string; employeeName: string; employeeCode: string; workshopName: string;
        grantId: string; grantName: string; grantType: string;
        baseAmount: number; finalAmount: number; cancelled: boolean;
      }

      const results: GrantReportRow[] = [];

      // دالة: بناء مجموعة تواريخ الإجازات (مدفوعة وغير مدفوعة) لموظف معين (ضمن الشهر)
      // الغياب المرخص (مدفوع) لا يُعدّ مخالفة وبالتالي لا يؤثر على منحة الانضباط
      function buildAllLeaveDatesGrants(emp: typeof allEmployees[0]): Set<string> {
        const s = new Set<string>();
        for (const lv of allLeavesGrants) {
          const applies =
            lv.targetType === "all" ||
            (lv.targetType === "shift" && (emp.shift || "morning") === lv.shiftValue) ||
            (lv.targetType === "workshop" && emp.workshopId === lv.workshopId) ||
            (lv.targetType === "employee" && emp.id === lv.employeeId);
          if (!applies) continue;
          if (lv.startDate > to || lv.endDate < from) continue;
          let d = new Date((lv.startDate > from ? lv.startDate : from) + "T00:00:00");
          const dEnd = new Date((lv.endDate < to ? lv.endDate : to) + "T00:00:00");
          while (d <= dEnd) { s.add(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
        }
        return s;
      }

      // أسماء أيام الأسبوع بالعربية → رقم getDay()
      const WEEKDAY_TO_DOW: Record<string, number> = {
        "الأحد": 0, "الاثنين": 1, "الثلاثاء": 2, "الأربعاء": 3,
        "الخميس": 4, "الجمعة": 5, "السبت": 6,
      };
      function absenceThresholdMet(absent: number, thresh: string | null): boolean {
        if (!thresh) return false;
        if (thresh === "1") return absent >= 1;
        if (thresh === "2") return absent >= 2;
        if (thresh === "more") return absent > 2;
        const n = parseFloat(thresh);
        return !isNaN(n) && absent >= n;
      }

      for (const grant of targetGrants) {
        let targetEmps = activeEmployees;
        if (grant.targetType === "shift") {
          targetEmps = activeEmployees.filter(e => (e.shift || "morning") === grant.shiftValue);
        } else if (grant.targetType === "workshop") {
          targetEmps = activeEmployees.filter(e => e.workshopId === grant.workshopId);
        } else if (grant.targetType === "employee") {
          let empIds: string[] = [];
          try { empIds = JSON.parse(grant.employeeIds ?? "[]"); } catch { empIds = []; }
          targetEmps = activeEmployees.filter(e => empIds.includes(e.id));
        }

        const baseAmount = parseFloat(grant.amount);
        const conditions = grant.conditions;

        for (const emp of targetEmps) {
          const workRule = workRulesMap.get(emp.workRuleId ?? "") ?? defaultRule;
          const workshop = workshopsMap.get(emp.workshopId ?? "");
          const is24h = workRule?.is24hShift ?? false;
          const isEmpHolidayGrants = (date: string): boolean => {
            const dow = new Date(date + "T00:00:00").getDay();
            return getEffectiveWeeklyOffDays(date, emp.workRuleId, activeOverridesGrants, weeklyOffDays).includes(dow);
          };
          const lateGrace = workRule?.lateGraceMinutes ?? 0;
          const earlyLeaveGrace = workRule?.earlyLeaveGraceMinutes ?? 0;
          const workStartMin = timeToMinLocal(workRule?.workStartTime ?? "08:00")!;
          const workEndMin = timeToMinLocal(workRule?.workEndTime ?? "16:00")!;
          const checkoutEarliestMin = workRule?.checkoutEarliestTime
            ? timeToMinLocal(workRule.checkoutEarliestTime) : null;
          const earlyLeaveRefMin = checkoutEarliestMin ?? workEndMin;

          const empRecords = recordsByEmployee.get(emp.id) ?? [];
          const empRecordsByDate = new Map(empRecords.map(r => [r.date, r]));

          let absentDays = 0;
          let lateDays = 0;
          let totalLateMinutes = 0;
          let totalEarlyLeaveMinutes = 0;
          const weekdayAbsences: Record<number, number> = {};

          // أيام العطلة غير المدفوعة للموظف في هذا الشهر
          const empUnpaidLeaveDatesGrants = buildAllLeaveDatesGrants(emp);

          for (const date of allDates) {
            if (date > todayStr) continue;
            const dow = new Date(date + "T00:00:00").getDay();
            const isHoliday = !is24h && isEmpHolidayGrants(date);
            if (isHoliday) continue;
            // أيام العطلة غير المدفوعة لا تُحسب غياباً
            if (empUnpaidLeaveDatesGrants.has(date)) continue;

            // وقت بداية/نهاية العمل الفعلي مع مراعاة الجدول الاستثنائي (رمضان، إلخ)
            const dayOverride = activeOverridesGrants.find(ov =>
              date >= ov.dateFrom && date <= ov.dateTo &&
              (!ov.workRuleId || ov.workRuleId === emp.workRuleId) &&
              (ov as any).workStartTime
            );
            const effWorkStartMin = dayOverride
              ? (timeToMinLocal((dayOverride as any).workStartTime) ?? workStartMin)
              : workStartMin;
            const effWorkEndMin = dayOverride
              ? (timeToMinLocal((dayOverride as any).workEndTime) ?? workEndMin)
              : workEndMin;
            const effEarlyLeaveRefMin = checkoutEarliestMin ?? effWorkEndMin;

            const rec = empRecordsByDate.get(date);
            if (!rec || rec.status === "absent") {
              absentDays++;
              weekdayAbsences[dow] = (weekdayAbsences[dow] || 0) + 1;
            } else if (rec.status === "present" || rec.status === "late") {
              const checkInMin = timeToMinLocal(rec.checkIn);
              if (checkInMin !== null) {
                const rawLate = Math.max(0, checkInMin - effWorkStartMin);
                const effLate = Math.max(0, rawLate - lateGrace);
                if (effLate > 0) { lateDays++; totalLateMinutes += effLate; }
              }
              const checkOutMin = timeToMinLocal(rec.checkOut ?? null);
              if (checkOutMin !== null) {
                const rawEarly = Math.max(0, effEarlyLeaveRefMin - checkOutMin);
                const effEarly = Math.max(0, rawEarly - earlyLeaveGrace);
                if (effEarly > 0) totalEarlyLeaveMinutes += effEarly;
              }
            }
          }

          let finalAmount = baseAmount;
          let cancelled = false;

          // 1) تجاوز العقوبات أولاً
          for (const cond of conditions) {
            if (cond.conditionType !== "violations_exceed") continue;
            const threshold = cond.violationsThreshold ?? 0;
            if ((absentDays + lateDays) > threshold) { cancelled = true; finalAmount = 0; break; }
          }

          if (!cancelled) {
            for (const cond of conditions) {
              if (cancelled) break;
              if (cond.conditionType === "violations_exceed") continue;

              let triggered = false;
              const effAmt = parseFloat(cond.effectAmount ?? "0") || 0;

              if (cond.conditionType === "absence") {
                if (cond.absenceMode === "count") {
                  triggered = absenceThresholdMet(absentDays, cond.daysThreshold ?? null);
                } else if (cond.absenceMode === "weekday") {
                  let weekdays: string[] = [];
                  try { weekdays = JSON.parse(cond.weekdays ?? "[]"); } catch { weekdays = []; }
                  // weekdays مخزنة كأسماء عربية أو أرقام — نحوّل لرقم DOW
                  triggered = weekdays.some(wd => {
                    const dow = typeof wd === "number" ? wd : (WEEKDAY_TO_DOW[String(wd)] ?? -1);
                    return dow >= 0 && (weekdayAbsences[dow] ?? 0) > 0;
                  });
                }
              } else if (cond.conditionType === "late") {
                triggered = totalLateMinutes >= (cond.minutesThreshold ?? 0);
              } else if (cond.conditionType === "early_leave") {
                triggered = totalEarlyLeaveMinutes >= (cond.minutesThreshold ?? 0);
              } else if (cond.conditionType === "attendance") {
                // شرط الحضور الكامل: يُفعَّل عند وجود غياب (حضور غير كامل)
                // أي: المنحة تُلغى/تُخصم إذا لم يكن الحضور كاملاً
                const periodType = cond.attendancePeriodType ?? "month";
                if (periodType === "month" || !periodType) {
                  triggered = absentDays > 0;
                } else if (periodType === "week") {
                  // آخر أسبوع: نتحقق من آخر 7 أيام عمل في الفترة (باستثناء أيام العطلة غير المدفوعة)
                  const recentDates = allDates
                    .filter(d => d <= todayStr && !(!is24h && isEmpHolidayGrants(d)) && !empUnpaidLeaveDatesGrants.has(d))
                    .slice(-7);
                  const recentAbsent = recentDates.filter(d =>
                    !empRecordsByDate.has(d) || empRecordsByDate.get(d)!.status === "absent"
                  ).length;
                  triggered = recentAbsent > 0;
                }
                // باقي أنواع الفترة (specific_month/week/day/year/months) تُهمل في التقرير الشهري
              }

              if (triggered) {
                if (cond.effectType === "cancel") { cancelled = true; finalAmount = 0; break; }
                else if (cond.effectType === "deduct") finalAmount = Math.max(0, finalAmount - effAmt);
                else if (cond.effectType === "add") finalAmount += effAmt;
              }
            }
          }

          const roundedFinal = Math.round(finalAmount * 100) / 100;
          // إذا وصل المبلغ إلى صفر بعد الخصومات → يُعدّ ملغى
          const effectivelyCancelled = cancelled || roundedFinal <= 0;

          results.push({
            employeeId: emp.id,
            employeeName: emp.name,
            employeeCode: emp.employeeCode,
            workshopName: workshop?.name ?? "",
            grantId: grant.id,
            grantName: grant.name,
            grantType: grant.type,
            baseAmount,
            finalAmount: effectivelyCancelled ? 0 : roundedFinal,
            cancelled: effectivelyCancelled,
          });
        }
      }

      // Sort: workshopName → employeeName
      results.sort((a, b) => {
        const ws = a.workshopName.localeCompare(b.workshopName, "ar");
        if (ws !== 0) return ws;
        return a.employeeName.localeCompare(b.employeeName, "ar");
      });

      return res.json(results);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // ---- Annual Report (التقرير السنوي) ----
  // GET /api/annual-report?year=2024&workshopId=XXX
  // السنة المالية: جويلية year → جوان year+1
  app.get("/api/annual-report", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const workshopId = req.query.workshopId as string | undefined;
      const shift = req.query.shift as string | undefined;
      if (!year || isNaN(year)) return res.status(400).json({ message: "year مطلوب" });

      // السنة المالية: جويلية → جوان
      const fiscalStart = `${year}-07-01`;
      const fiscalEnd = `${year + 1}-06-30`;

      const [allEmployees, allWorkRules, allWorkshops, allRecords, allLeaves, offDaySetting, allScheduleOverridesDetailed] = await Promise.all([
        storage.getEmployees(),
        storage.getWorkRules(),
        storage.getWorkshops(),
        storage.getAttendanceByDateRange(fiscalStart, fiscalEnd),
        storage.getLeaves(),
        storage.getAppSetting("weeklyOffDays"),
        storage.getScheduleOverrides(),
      ]);
      const weeklyOffDays: number[] = offDaySetting ? JSON.parse(offDaySetting.value) : [];

      const todayStr = new Date().toISOString().slice(0, 10);

      // بناء الأشهر الـ12 للسنة المالية
      const fiscalMonths: string[] = [];
      for (let m = 7; m <= 12; m++) fiscalMonths.push(`${year}-${String(m).padStart(2, "0")}`);
      for (let m = 1; m <= 6; m++) fiscalMonths.push(`${year + 1}-${String(m).padStart(2, "0")}`);

      let filteredEmployees = allEmployees.filter(e => e.isActive);
      if (workshopId) filteredEmployees = filteredEmployees.filter(e => e.workshopId === workshopId);
      if (shift) filteredEmployees = filteredEmployees.filter(e => (e.shift || "morning") === shift);

      function timeToMin(t: string | null): number | null {
        if (!t) return null;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      }

      // دالة: هل تنطبق العطلة على هذا الموظف؟
      function leaveAppliesToEmployee(lv: typeof allLeaves[0], emp: typeof allEmployees[0]): boolean {
        if (lv.targetType === "all") return true;
        if (lv.targetType === "shift") return (emp.shift || "morning") === lv.shiftValue;
        if (lv.targetType === "workshop") return emp.workshopId === lv.workshopId;
        if (lv.targetType === "employee") return emp.id === lv.employeeId;
        return false;
      }

      const result = filteredEmployees.map(emp => {
        const workRule = allWorkRules.find(r => r.id === emp.workRuleId) || allWorkRules.find(r => r.isDefault) || allWorkRules[0];
        const workshop = allWorkshops.find(w => w.id === emp.workshopId);
        const empRecords = allRecords.filter(r => r.employeeId === emp.id);

        let totalWorkDayMinutes = 480;
        if (workRule) {
          if (workRule.is24hShift) {
            totalWorkDayMinutes = 1440;
          } else {
            const [sh, sm] = workRule.workStartTime.split(":").map(Number);
            const [eh, em] = workRule.workEndTime.split(":").map(Number);
            totalWorkDayMinutes = Math.max(1, (eh * 60 + em) - (sh * 60 + sm));
          }
        }

        const workStartMin = timeToMin(workRule?.workStartTime ?? "08:00")!;
        const workEndMin = timeToMin(workRule?.workEndTime ?? "16:00")!;
        const lateGrace = workRule?.lateGraceMinutes ?? 0;
        const earlyLeaveGrace = workRule?.earlyLeaveGraceMinutes ?? 0;
        const checkoutEarliestMin = workRule?.checkoutEarliestTime ? timeToMin(workRule.checkoutEarliestTime) : null;
        const earlyLeaveRefMin = checkoutEarliestMin ?? workEndMin;

        // العطل المنطبقة على هذا الموظف
        const empLeaves = allLeaves.filter(lv => leaveAppliesToEmployee(lv, emp));

        const monthlyScores: Record<string, number> = {};

        for (const ym of fiscalMonths) {
          const [ymYear, ymMonth] = ym.split("-").map(Number);
          const daysInMonth = new Date(ymYear, ymMonth, 0).getDate();
          const monthStart = `${ym}-01`;
          const monthEnd = `${ym}-${String(daysInMonth).padStart(2, "0")}`;

          // تطبيع: فيفري → bonus، 31 يوم → يوم 31 خاص
          let monthBonus = 0;
          let isFullMonth31 = false;
          if (daysInMonth === 28 || daysInMonth === 29) monthBonus = 30 - daysInMonth;
          else if (daysInMonth === 31) isFullMonth31 = true;

          // بناء قائمة الأيام
          const allDaysInMonth: string[] = [];
          for (let d = 1; d <= daysInMonth; d++) allDaysInMonth.push(`${ym}-${String(d).padStart(2, "0")}`);

          const activeOverridesForMonth = allScheduleOverridesDetailed.filter(ov => ov.dateFrom <= monthEnd && ov.dateTo >= monthStart);
          const isEmpHolidayDetailed = (date: string): boolean => {
            const dow = new Date(date + "T00:00:00").getDay();
            return getEffectiveWeeklyOffDays(date, emp.workRuleId, activeOverridesForMonth, weeklyOffDays).includes(dow);
          };

          // بناء سجلات الأيام
          interface DayRecord { date: string; status: string; dailyScore: number; }
          const dayRecords: DayRecord[] = [];

          const monthRecords = empRecords.filter(r => r.date >= monthStart && r.date <= monthEnd);
          for (const rec of monthRecords) {
            const checkInMin = timeToMin(rec.checkIn);
            const checkOutMin = timeToMin(rec.checkOut);
            const rawLate = checkInMin !== null ? Math.max(0, checkInMin - workStartMin) : 0;
            const rawEarlyLeave = checkOutMin !== null ? Math.max(0, earlyLeaveRefMin - checkOutMin) : 0;
            const effectiveLate = Math.max(0, rawLate - lateGrace);
            const effectiveEarly = Math.max(0, rawEarlyLeave - earlyLeaveGrace);
            const middleAbs = rec.middleAbsenceMinutes ?? 0;

            let score = 0;
            if (rec.status === "absent") score = 0;
            else if (rec.status === "leave" || rec.status === "rest") score = 1;
            else if (workRule?.is24hShift && Number(rec.totalHours || 0) >= 20) score = 2;
            else score = Math.max(0, 1 - (effectiveLate + effectiveEarly + middleAbs) / totalWorkDayMinutes);

            dayRecords.push({ date: rec.date, status: rec.status, dailyScore: Math.round(score * 100) / 100 });
          }

          // حقن أيام العطلة الأسبوعية
          if (!workRule?.is24hShift) {
            for (const date of allDaysInMonth.filter(isEmpHolidayDetailed)) {
              if (date > todayStr) continue;
              const ex = dayRecords.find(r => r.date === date);
              if (ex) { ex.status = "holiday"; ex.dailyScore = 1.00; }
              else dayRecords.push({ date, status: "holiday", dailyScore: 1.00 });
            }
          }

          // حقن الغياب للأيام الناقصة
          for (const date of allDaysInMonth) {
            if (isEmpHolidayDetailed(date) && !workRule?.is24hShift) continue;
            if (date > todayStr) continue;
            if (!dayRecords.some(r => r.date === date)) {
              dayRecords.push({ date, status: "absent", dailyScore: 0.00 });
            }
          }

          dayRecords.sort((a, b) => a.date.localeCompare(b.date));

          // تطبيق قاعدة اليوم 31
          if (isFullMonth31) {
            const day31 = `${ym}-31`;
            const rec31 = dayRecords.find(r => r.date === day31);
            if (rec31) rec31.dailyScore = rec31.status === "absent" ? -1.00 : 0.00;
          }

          // خصم العطلة الأسبوعية عند الغياب (نفس منطق التقرير الشهري)
          // أيام العطلة غير المدفوعة لا تُسبب هذا الخصم
          {
            const unpaidLeaveDatesMonth = new Set<string>();
            for (const lv of empLeaves) {
              if (lv.isPaid) continue;
              if (lv.startDate > monthEnd || lv.endDate < monthStart) continue;
              let d = new Date((lv.startDate > monthStart ? lv.startDate : monthStart) + "T00:00:00");
              const dEnd = new Date((lv.endDate < monthEnd ? lv.endDate : monthEnd) + "T00:00:00");
              while (d <= dEnd) { unpaidLeaveDatesMonth.add(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
            }
            function getWeekStart(dateStr: string): string {
              const d = new Date(dateStr + "T00:00:00");
              d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
              return d.toISOString().slice(0, 10);
            }
            const holidaysByWeek = new Map<string, DayRecord[]>();
            for (const rec of dayRecords) {
              if (rec.status === "holiday") {
                const wk = getWeekStart(rec.date);
                if (!holidaysByWeek.has(wk)) holidaysByWeek.set(wk, []);
                holidaysByWeek.get(wk)!.push(rec);
              }
            }
            for (const [wk, holidays] of holidaysByWeek) {
              const absenceCount = dayRecords.filter(
                r => getWeekStart(r.date) === wk && r.status === "absent" && !unpaidLeaveDatesMonth.has(r.date)
              ).length;
              if (absenceCount === 0) continue;
              let toDeduct = absenceCount * 0.5;
              for (const h of [...holidays].sort((a, b) => b.date.localeCompare(a.date))) {
                if (toDeduct <= 0) break;
                const deduct = Math.min(toDeduct, h.dailyScore);
                h.dailyScore = Math.round((h.dailyScore - deduct) * 100) / 100;
                toDeduct = Math.round((toDeduct - deduct) * 100) / 100;
              }
            }
          }

          // تطبيق العطل الجماعية (leaves table)
          for (const lv of empLeaves) {
            if (lv.startDate > monthEnd || lv.endDate < monthStart) continue;
            for (const dr of dayRecords) {
              if (dr.date >= lv.startDate && dr.date <= lv.endDate) {
                dr.dailyScore = lv.isPaid ? 1.00 : 0.00;
                dr.status = lv.isPaid ? "leave" : "absent";
              }
            }
          }

          let monthScore = dayRecords.reduce((s, r) => s + r.dailyScore, 0);
          monthScore += monthBonus; // تعديل فيفري
          monthlyScores[ym] = Math.round(monthScore * 100) / 100;
        }

        const annualTotal = Object.values(monthlyScores).reduce((s, v) => s + v, 0);
        const annualScore = Math.round((annualTotal / 12) * 100) / 100;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          workshopId: emp.workshopId || "",
          workshopName: workshop?.name || "",
          shift: emp.shift || "morning",
          months: monthlyScores,
          annualScore,
        };
      });

      return res.json({ year, fiscalMonths, employees: result });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // ---- Frozen Archives ----

  // GET /api/frozen-archives?month=YYYY-MM  (أو بدون month لإرجاع الكل)
  app.get("/api/frozen-archives", async (req, res) => {
    if (req.session.username !== "owner") {
      return res.status(403).json({ message: "غير مصرح" });
    }
    const month = String(req.query.month || "");
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "month يجب أن يكون بصيغة YYYY-MM" });
      }
      const list = await storage.getFrozenArchives(month);
      return res.json(list);
    }
    const list = await storage.getAllFrozenArchives();
    return res.json(list);
  });

  // POST /api/frozen-archives — freeze a table snapshot
  app.post("/api/frozen-archives", async (req, res) => {
    if (req.session.username !== "owner") {
      return res.status(403).json({ message: "غير مصرح" });
    }
    const { month, workshopId, workRuleId, reportJson } = req.body;
    if (!month || !workshopId || !workRuleId || !reportJson) {
      return res.status(400).json({ message: "الحقول مطلوبة: month, workshopId, workRuleId, reportJson" });
    }
    const existing = await storage.getFrozenArchives(month);
    const dup = existing.find((f) => f.workshopId === workshopId && f.workRuleId === workRuleId);
    if (dup) {
      return res.status(409).json({ message: "هذا الجدول محفوظ مسبقاً" });
    }
    const frozenAt = new Date().toISOString();
    const frozenBy = req.session.username ?? "unknown";
    const record = await storage.createFrozenArchive({ month, workshopId, workRuleId, reportJson, frozenAt, frozenBy });
    return res.json(record);
  });

  // DELETE /api/frozen-archives/:id — unfreeze (owner only)
  app.delete("/api/frozen-archives/:id", async (req, res) => {
    if (req.session.username !== "owner") {
      return res.status(403).json({ message: "غير مصرح" });
    }
    await storage.deleteFrozenArchive(req.params.id);
    return res.status(204).send();
  });

  // ===== SCHEDULE OVERRIDES (جداول خاصة) =====

  // دالة مساعدة: تحويل weeklyOffDays من JSON string إلى number[]
  function parseOverrideWeeklyOffDays(ov: any) {
    return {
      ...ov,
      weeklyOffDays: ov.weeklyOffDays
        ? (Array.isArray(ov.weeklyOffDays) ? ov.weeklyOffDays : JSON.parse(ov.weeklyOffDays))
        : null,
    };
  }

  // GET /api/schedule-overrides
  app.get("/api/schedule-overrides", async (req, res) => {
    if (!requireAnyRole(req, res)) return;
    try {
      const list = await storage.getScheduleOverrides();
      return res.json(list.map(parseOverrideWeeklyOffDays));
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // POST /api/schedule-overrides
  app.post("/api/schedule-overrides", async (req, res) => {
    if (!requireAnyRole(req, res)) return;
    try {
      const { name, dateFrom, dateTo, workRuleId, workStartTime, workEndTime, isOvernight, notes, weeklyOffDays } = req.body;
      if (!name || !dateFrom || !dateTo || !workStartTime || !workEndTime) {
        return res.status(400).json({ message: "جميع الحقول المطلوبة يجب تعبئتها" });
      }
      const record = await storage.createScheduleOverride({
        name, dateFrom, dateTo,
        workRuleId: workRuleId || null,
        workStartTime, workEndTime,
        isOvernight: isOvernight === true || isOvernight === "true",
        notes: notes || null,
        weeklyOffDays: weeklyOffDays ? JSON.stringify(weeklyOffDays) : null,
      });
      return res.status(201).json(parseOverrideWeeklyOffDays(record));
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // PATCH /api/schedule-overrides/:id
  app.patch("/api/schedule-overrides/:id", async (req, res) => {
    if (!requireAnyRole(req, res)) return;
    try {
      const patchBody = { ...req.body };
      if (Array.isArray(patchBody.weeklyOffDays)) {
        patchBody.weeklyOffDays = JSON.stringify(patchBody.weeklyOffDays);
      } else if (patchBody.weeklyOffDays === null || patchBody.weeklyOffDays === "") {
        patchBody.weeklyOffDays = null;
      }
      const updated = await storage.updateScheduleOverride(req.params.id, patchBody);
      if (!updated) return res.status(404).json({ message: "الجدول الخاص غير موجود" });
      return res.json(parseOverrideWeeklyOffDays(updated));
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // DELETE /api/schedule-overrides/:id
  app.delete("/api/schedule-overrides/:id", async (req, res) => {
    if (!requireAnyRole(req, res)) return;
    try {
      await storage.deleteScheduleOverride(req.params.id);
      return res.status(204).send();
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // POST /api/schedule-overrides/:id/recalculate
  // يعيد حساب سجلات الحضور لفترة الجدول الخاص
  app.post("/api/schedule-overrides/:id/recalculate", async (req, res) => {
    if (!requireAnyRole(req, res)) return;
    try {
      const override = await storage.getScheduleOverride(req.params.id);
      if (!override) return res.status(404).json({ message: "الجدول الخاص غير موجود" });

      const { dateFrom, dateTo, workRuleId, workStartTime, workEndTime, isOvernight } = override;

      // Parse work schedule times as absolute minutes from midnight
      const [startH, startM] = workStartTime.split(":").map(Number);
      const [endH, endM] = workEndTime.split(":").map(Number);
      const scheduleStartMins = startH * 60 + startM;
      // For overnight shifts: end time is on the "next day" in absolute minutes
      let scheduleEndMins = endH * 60 + endM;
      if (isOvernight && scheduleEndMins <= scheduleStartMins) {
        scheduleEndMins += 24 * 60; // shift end is next calendar day
      }

      // Load all attendance records in date range
      const records = await storage.getAttendanceByDateRange(dateFrom, dateTo);

      // Cache employees and work rules
      const employeeCache: Record<string, any> = {};
      const workRuleCache: Record<string, any> = {};

      let updated = 0;
      for (let rec of records) {
        // Load employee if not cached
        if (!employeeCache[rec.employeeId]) {
          employeeCache[rec.employeeId] = await storage.getEmployee(rec.employeeId);
        }
        const emp = employeeCache[rec.employeeId];
        if (!emp) continue;

        // If override targets a specific workRule, skip non-matching employees
        if (workRuleId && emp.workRuleId !== workRuleId) continue;

        // Skip statuses that are not time-based
        if (rec.status === "absent" || rec.status === "leave" || rec.status === "rest") continue;

        // Load work rule for penalty rates
        const empWorkRuleId = emp.workRuleId;
        if (empWorkRuleId && !workRuleCache[empWorkRuleId]) {
          workRuleCache[empWorkRuleId] = await storage.getWorkRule(empWorkRuleId);
        }
        const workRule = empWorkRuleId ? workRuleCache[empWorkRuleId] : null;
        const lateGrace = workRule ? (workRule.lateGraceMinutes || 0) : 0;
        const latePenaltyPer = parseFloat(workRule?.latePenaltyPerMinute || "0");
        const earlyPenaltyPer = parseFloat(workRule?.earlyLeavePenaltyPerMinute || "0");

        let lateMinutes = 0;
        let earlyLeaveMinutes = 0;
        let totalHours = 0;
        let penalty = 0;
        // Always compute status from scratch (never inherit stale status)
        let newStatus = "present";

        // --- كشف البيانات المقلوبة للمناوبات الليلية ---
        // الجهاز البيومتري يُسجّل البصمات بالترتيب الزمني لليوم الواحد:
        //   - 05:00 (الخروج من مناوبة البارحة) → يُخزَّن خطأً كـ checkIn
        //   - 22:00 (الدخول لمناوبة الليلة)   → يُخزَّن خطأً كـ checkOut
        // نكتشف هذا النمط ونعكسه في قاعدة البيانات قبل إجراء أي حساب.
        if (isOvernight && rec.checkIn && rec.checkOut) {
          const ciM = rec.checkIn.split(":").map(Number).reduce((h, m) => h * 60 + m);
          const coM = rec.checkOut.split(":").map(Number).reduce((h, m) => h * 60 + m);
          const SWAP_TOLERANCE = 60; // دقيقة
          if (ciM < scheduleStartMins && coM >= (scheduleStartMins - SWAP_TOLERANCE)) {
            // البيانات مقلوبة → نصحّحها في قاعدة البيانات
            const correctCheckIn  = rec.checkOut; // "22:xx" → وقت الدخول الحقيقي
            const correctCheckOut = rec.checkIn;  // "05:xx" → وقت الخروج الحقيقي (صباح اليوم التالي)
            await storage.updateAttendance(rec.id, {
              checkIn: correctCheckIn,
              checkOut: correctCheckOut,
            });
            // تحديث القيم المحلية للحسابات التالية
            rec = { ...rec, checkIn: correctCheckIn, checkOut: correctCheckOut };
          }
        }

        // حالة خاصة: بصمة صباحية فقط (خروج من مناوبة البارحة) دون بصمة مسائية
        // → هذا السجل ليس دخولاً حقيقياً ليوم اليوم → نضعه كـ "غائب"
        if (isOvernight && rec.checkIn && !rec.checkOut) {
          const ciM = rec.checkIn.split(":").map(Number).reduce((h, m) => h * 60 + m);
          if (ciM < scheduleStartMins && (scheduleStartMins - ciM) > 12 * 60) {
            await storage.updateAttendance(rec.id, {
              checkIn: null, lateMinutes: 0, earlyLeaveMinutes: 0,
              totalHours: "0", penalty: "0", status: "absent",
            });
            updated++;
            continue;
          }
        }

        // --- Resolve effective checkout time ---
        // For overnight shifts the device may record checkOut on the SAME attendance record (same date as checkIn)
        // as an after-midnight time (e.g. "05:00"), OR it may be missing (recorded in the next calendar day's record).
        // We resolve in priority order:
        //   1. Same-record checkOut that is clearly after-midnight (< scheduleStartMins by a wide margin)
        //   2. Next-day attendance record's checkIn (which is the physical checkout punch) when same-record checkout is absent
        let effectiveCheckOutMins: number | null = null;

        if (rec.checkOut) {
          const [coH, coM] = rec.checkOut.split(":").map(Number);
          let checkOutMins = coH * 60 + coM;
          if (isOvernight && checkOutMins < scheduleStartMins) {
            // checkOut is after midnight (e.g. "05:00" for 22:00 start) — treat as next-day minutes
            checkOutMins += 24 * 60;
          }
          effectiveCheckOutMins = checkOutMins;
        } else if (isOvernight && rec.date) {
          // No same-day checkout: look for the next calendar day's earliest attendance record for this employee
          // which represents the physical checkout from this overnight shift
          const [yr, mo, dy] = rec.date.split("-").map(Number);
          const nextDate = new Date(yr, mo - 1, dy + 1);
          const nextDateStr = nextDate.toISOString().split("T")[0];
          const nextRec = await storage.getAttendanceByEmployeeAndDate(rec.employeeId, nextDateStr);
          // Use the earliest punch of the next day as the effective checkout
          const nextCheckIn = nextRec?.checkIn;
          if (nextCheckIn) {
            const [nciH, nciM] = nextCheckIn.split(":").map(Number);
            effectiveCheckOutMins = nciH * 60 + nciM + 24 * 60; // it's on the next day
          }
        }

        // --- Late calculation (based on checkIn vs schedule start) ---
        if (rec.checkIn) {
          const [ciH, ciM] = rec.checkIn.split(":").map(Number);
          let checkInMins = ciH * 60 + ciM;
          // For overnight shifts, checkIn that appears to be after midnight (e.g. "00:30" for 22:00 start)
          // means the employee clocked in the next calendar day — treat as next-day absolute minutes.
          if (isOvernight && checkInMins < scheduleStartMins && scheduleStartMins - checkInMins > 12 * 60) {
            checkInMins += 24 * 60;
          }
          const diff = checkInMins - scheduleStartMins;
          if (diff > lateGrace) {
            lateMinutes = diff;
            newStatus = "late";
          }
        }

        // --- Early leave calculation ---
        if (effectiveCheckOutMins !== null) {
          if (effectiveCheckOutMins < scheduleEndMins) {
            earlyLeaveMinutes = scheduleEndMins - effectiveCheckOutMins;
          }
        }

        // --- Total hours ---
        if (rec.checkIn && effectiveCheckOutMins !== null) {
          const [ciH, ciM] = rec.checkIn.split(":").map(Number);
          let checkInMins = ciH * 60 + ciM;
          if (isOvernight && checkInMins < scheduleStartMins && scheduleStartMins - checkInMins > 12 * 60) {
            checkInMins += 24 * 60;
          }
          totalHours = Math.round((effectiveCheckOutMins - checkInMins) / 60 * 100) / 100;
        }

        penalty = (lateMinutes > 0 ? lateMinutes * latePenaltyPer : 0)
          + (earlyLeaveMinutes > 0 ? earlyLeaveMinutes * earlyPenaltyPer : 0);

        await storage.updateAttendance(rec.id, {
          lateMinutes,
          earlyLeaveMinutes,
          totalHours: String(Math.max(0, totalHours)),
          penalty: String(penalty),
          status: newStatus,
        });
        updated++;
      }

      return res.json({ message: `تم إعادة حساب ${updated} سجل بنجاح`, updated });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // POST /iclock/devicecmd — device reporting command result
  app.post("/iclock/devicecmd", admsTextParser, (req, res) => {
    const sn = String(req.query.SN || "");
    console.log(`[ADMS] POST /iclock/devicecmd SN=${sn}`);
    res.setHeader("Content-Type", "text/plain");
    res.send("OK");
  });

  // ===== CAISSE / PAYROLL (الصندوق والرواتب) =====

  function requireCaisseOrOwner(req: Request, res: Response): boolean {
    if (!["owner", "caisse"].includes(req.session.username ?? "")) {
      res.status(403).json({ message: "غير مصرح — هذه الميزة لحساب الصندوق فقط" });
      return false;
    }
    return true;
  }

  // تهيئة جداول الرواتب والديون والتسبيقات عند بدء التشغيل
  storage.initPayrollTables().catch(e => console.error("[payroll-init]", e.message));

  // PATCH /api/employees/:id/salary — تحديث الراتب الأساسي
  app.patch("/api/employees/:id/salary", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const { baseSalary } = req.body;
      if (baseSalary === undefined) return res.status(400).json({ message: "الراتب الأساسي مطلوب" });
      const updated = await storage.updateEmployee(req.params.id, { baseSalary: String(baseSalary) });
      if (!updated) return res.status(404).json({ message: "الموظف غير موجود" });
      return res.json(updated);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // GET /api/debts — قائمة الديون
  app.get("/api/debts", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const employeeId = req.query.employeeId as string | undefined;
      const debts = await storage.getEmployeeDebts(employeeId);
      return res.json(debts);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // POST /api/debts — إضافة دين جديد
  app.post("/api/debts", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const { employeeId, description, totalAmount, monthlyDeduction } = req.body;
      if (!employeeId || !description || !totalAmount || !monthlyDeduction) {
        return res.status(400).json({ message: "جميع الحقول المطلوبة يجب تعبئتها" });
      }
      const debt = await storage.createEmployeeDebt({
        employeeId,
        description,
        totalAmount: String(totalAmount),
        monthlyDeduction: String(monthlyDeduction),
        remainingAmount: String(totalAmount),
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      return res.status(201).json(debt);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // GET /api/debts/export — تصدير الديون كملف Excel
  app.get("/api/debts/export", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const employeeId = req.query.employeeId as string | undefined;
      const search = (req.query.search as string | undefined)?.toLowerCase().trim();
      const [allDebts, allEmployees] = await Promise.all([
        storage.getEmployeeDebts(employeeId),
        storage.getEmployees(),
      ]);

      const empMap = new Map(allEmployees.map(e => [e.id, e]));

      const filtered = allDebts.filter(d => {
        if (!search) return true;
        const emp = empMap.get(d.employeeId);
        const name = emp?.name?.toLowerCase() ?? "";
        const code = emp?.employeeCode?.toLowerCase() ?? "";
        return name.includes(search) || code.includes(search);
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("الديون", { views: [{ rightToLeft: true }] });

      sheet.columns = [
        { key: "empName", width: 28 },
        { key: "empCode", width: 16 },
        { key: "description", width: 30 },
        { key: "totalAmount", width: 22 },
        { key: "monthlyDeduction", width: 22 },
        { key: "remainingAmount", width: 22 },
        { key: "status", width: 14 },
      ];

      const headerRow = sheet.addRow(["الموظف", "رقم الموظف", "الوصف", "المبلغ الإجمالي (دج)", "القسط الشهري (دج)", "المتبقي (دج)", "الحالة"]);
      headerRow.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2A4A" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.border = { bottom: { style: "thin", color: { argb: "FF334E7D" } } };
      });
      headerRow.height = 24;

      for (const debt of filtered) {
        const emp = empMap.get(debt.employeeId);
        const isActive = debt.isActive;
        const row = sheet.addRow({
          empName: emp?.name ?? "—",
          empCode: emp?.employeeCode ?? "",
          description: debt.description,
          totalAmount: parseFloat(debt.totalAmount ?? "0"),
          monthlyDeduction: parseFloat(debt.monthlyDeduction ?? "0"),
          remainingAmount: parseFloat(debt.remainingAmount ?? "0"),
          status: isActive ? "نشط" : "مسدد",
        });

        const bgColor = isActive ? "FFFFF3CD" : "FFD4EDDA";
        row.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
          cell.alignment = { horizontal: "right", vertical: "middle" };
        });

        [4, 5, 6].forEach(colIndex => {
          row.getCell(colIndex).numFmt = "#,##0.00";
        });

        row.height = 20;
      }

      const today = new Date().toISOString().slice(0, 10);
      const filename = encodeURIComponent(`ديون_${today}.xlsx`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // GET /api/debts/:id — دين واحد
  app.get("/api/debts/:id", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const debt = await storage.getEmployeeDebt(req.params.id);
      if (!debt) return res.status(404).json({ message: "الدين غير موجود" });
      return res.json(debt);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // PATCH /api/debts/:id — تعديل دين
  app.patch("/api/debts/:id", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const updated = await storage.updateEmployeeDebt(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "الدين غير موجود" });
      return res.json(updated);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // DELETE /api/debts/:id — حذف دين
  app.delete("/api/debts/:id", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      await storage.deleteEmployeeDebt(req.params.id);
      return res.status(204).send();
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // GET /api/advances — قائمة التسبيقات
  app.get("/api/advances", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const employeeId = req.query.employeeId as string | undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const advances = await storage.getAdvances(employeeId, month, year);
      return res.json(advances);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // POST /api/advances — إضافة تسبيقة
  app.post("/api/advances", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const { employeeId, amount, advanceDate, notes } = req.body;
      if (!employeeId || !amount || !advanceDate) {
        return res.status(400).json({ message: "الموظف والمبلغ والتاريخ مطلوبة" });
      }
      const d = new Date(advanceDate);
      const advance = await storage.createAdvance({
        employeeId,
        amount: String(amount),
        advanceDate,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        notes: notes || null,
        createdAt: new Date().toISOString(),
      });
      return res.status(201).json(advance);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // GET /api/advances/:id — تسبيقة واحدة
  app.get("/api/advances/:id", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const advance = await storage.getAdvance(req.params.id);
      if (!advance) return res.status(404).json({ message: "التسبيقة غير موجودة" });
      return res.json(advance);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // PATCH /api/advances/:id — تعديل تسبيقة
  app.patch("/api/advances/:id", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const { amount, advanceDate, notes } = req.body;
      const data: Partial<{ amount: string; advanceDate: string; month: number; year: number; notes: string | null }> = {};
      if (amount !== undefined) data.amount = String(amount);
      if (advanceDate !== undefined) {
        const d = new Date(advanceDate);
        data.advanceDate = advanceDate;
        data.month = d.getMonth() + 1;
        data.year = d.getFullYear();
      }
      if (notes !== undefined) data.notes = notes ?? null;
      const advance = await storage.updateAdvance(req.params.id, data);
      if (!advance) return res.status(404).json({ message: "التسبيقة غير موجودة" });
      return res.json(advance);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // DELETE /api/advances/:id — حذف تسبيقة
  app.delete("/api/advances/:id", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      await storage.deleteAdvance(req.params.id);
      return res.status(204).send();
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // GET /api/debt-skips?month=YYYY-MM — قائمة employee_id المعلَّقة
  app.get("/api/debt-skips", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const month = req.query.month as string;
      if (!month) return res.status(400).json({ message: "month مطلوب" });
      const skips = await storage.getDebtSkips(month);
      return res.json(skips);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // POST /api/debt-skips — تعليق خصم الدين
  app.post("/api/debt-skips", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const { employeeId, month } = req.body;
      if (!employeeId || !month) return res.status(400).json({ message: "employeeId و month مطلوبان" });
      await storage.addDebtSkip(employeeId, month);
      return res.json({ ok: true });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // DELETE /api/debt-skips — إلغاء تعليق خصم الدين
  app.delete("/api/debt-skips", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const { employeeId, month } = req.body;
      if (!employeeId || !month) return res.status(400).json({ message: "employeeId و month مطلوبان" });
      await storage.removeDebtSkip(employeeId, month);
      return res.json({ ok: true });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // GET /api/attendance-score-override?employeeId=&month=YYYY-MM
  app.get("/api/attendance-score-override", async (req, res) => {
    if (!requireOwnerOrAttendence(req, res)) return;
    try {
      const { employeeId, month } = req.query as { employeeId: string; month: string };
      if (!employeeId || !month) return res.status(400).json({ message: "employeeId و month مطلوبان" });
      const score = await storage.getAttendanceScoreOverride(employeeId, month);
      return res.json({ score });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // POST /api/attendance-score-override — حفظ override
  app.post("/api/attendance-score-override", async (req, res) => {
    if (!requireOwnerOrAttendence(req, res)) return;
    try {
      const { employeeId, month, score } = req.body;
      if (!employeeId || !month || score === undefined) return res.status(400).json({ message: "employeeId و month و score مطلوبة" });
      const scoreNum = parseFloat(score);
      if (isNaN(scoreNum)) return res.status(400).json({ message: "score يجب أن يكون رقماً" });
      await storage.setAttendanceScoreOverride(employeeId, month, scoreNum);
      return res.json({ ok: true });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // DELETE /api/attendance-score-override — حذف override
  app.delete("/api/attendance-score-override", async (req, res) => {
    if (!requireOwnerOrAttendence(req, res)) return;
    try {
      const { employeeId, month } = req.body;
      if (!employeeId || !month) return res.status(400).json({ message: "employeeId و month مطلوبان" });
      await storage.deleteAttendanceScoreOverride(employeeId, month);
      return res.json({ ok: true });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // ---- دالة مشتركة لحساب صفوف الرواتب (تُستخدم من /monthly و /export) ----
  async function computePayrollRows(year: number, month: number) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const todayStr = new Date().toISOString().slice(0, 10);
      const currentMonthStr = `${year}-${String(month).padStart(2, "0")}`;

      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

      const [employees, advances, allDebts, attendanceRecords, workRules, offDaySetting, allOverrides, allLeaves, allGrantsRaw, currentPayments, prevPayments, debtSkipsList, scoreOverridesMap] =
        await Promise.all([
          storage.getEmployees(),
          storage.getAdvances(undefined, month, year),
          storage.getEmployeeDebts(),
          storage.getAttendanceByDateRange(startDate, endDate),
          storage.getWorkRules(),
          storage.getAppSetting("weeklyOffDays"),
          storage.getScheduleOverrides(),
          storage.getLeaves(),
          storage.getGrants(),
          storage.getSalaryPayments(currentMonthStr),
          storage.getSalaryPayments(prevMonthStr),
          storage.getDebtSkips(currentMonthStr),
          storage.getAttendanceScoreOverrides(currentMonthStr),
        ]);
      const debtSkipsSet = new Set<string>(debtSkipsList);

      const activeEmployees = employees.filter(e => e.isActive);
      const workRulesMap = new Map(workRules.map(r => [r.id, r]));
      const defaultRule = workRules.find(r => r.isDefault) ?? workRules[0];
      const weeklyOffDays: number[] = offDaySetting ? JSON.parse(offDaySetting.value) : [];
      const daysInMonth = lastDay;
      let isFullMonth31 = false;
      let monthBonus = 0;
      if (daysInMonth === 28 || daysInMonth === 29) monthBonus = 30 - daysInMonth;
      else if (daysInMonth === 31) { isFullMonth31 = true; monthBonus = 0; }

      const allDatesInMonth: string[] = [];
      for (let d = 1; d <= daysInMonth; d++)
        allDatesInMonth.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

      const activeOverrides = allOverrides.filter(ov => ov.dateFrom <= endDate && ov.dateTo >= startDate);

      function payTimeToMin(t: string | null): number | null {
        if (!t) return null;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      }
      function payLeaveApplies(lv: any, emp: any): boolean {
        return (
          lv.targetType === "all" ||
          (lv.targetType === "shift" && (emp.shift || "morning") === lv.shiftValue) ||
          (lv.targetType === "workshop" && emp.workshopId === lv.workshopId) ||
          (lv.targetType === "employee" && emp.id === lv.employeeId)
        );
      }
      function payGetWeekStart(dateStr: string): string {
        const d = new Date(dateStr + "T00:00:00");
        d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
        return d.toISOString().slice(0, 10);
      }

      const recordsByEmployee = new Map<string, typeof attendanceRecords>();
      for (const rec of attendanceRecords) {
        const list = recordsByEmployee.get(rec.employeeId);
        if (list) list.push(rec);
        else recordsByEmployee.set(rec.employeeId, [rec]);
      }
      const currentPaymentsMap = new Map(currentPayments.map(p => [p.employeeId, parseFloat(p.amountPaid as any) || 0]));
      const prevRemainingMap = new Map(prevPayments.map(p => [p.employeeId, parseFloat(p.remainingBalance as any) || 0]));

      const WEEKDAY_TO_DOW_PAY: Record<string, number> = {
        "الأحد": 0, "الاثنين": 1, "الثلاثاء": 2, "الأربعاء": 3,
        "الخميس": 4, "الجمعة": 5, "السبت": 6,
      };
      function absenceThresholdMetPay(absent: number, thresh: string | null): boolean {
        if (!thresh) return false;
        if (thresh === "1") return absent >= 1;
        if (thresh === "2") return absent >= 2;
        if (thresh === "more") return absent > 2;
        const n = parseFloat(thresh);
        return !isNaN(n) && absent >= n;
      }
      function buildPayLeaveDates(emp: any): Set<string> {
        const s = new Set<string>();
        for (const lv of allLeaves) {
          const applies = lv.targetType === "all" ||
            (lv.targetType === "shift" && (emp.shift || "morning") === lv.shiftValue) ||
            (lv.targetType === "workshop" && emp.workshopId === lv.workshopId) ||
            (lv.targetType === "employee" && emp.id === lv.employeeId);
          if (!applies || lv.startDate > endDate || lv.endDate < startDate) continue;
          let d = new Date((lv.startDate > startDate ? lv.startDate : startDate) + "T00:00:00");
          const dEnd = new Date((lv.endDate < endDate ? lv.endDate : endDate) + "T00:00:00");
          while (d <= dEnd) { s.add(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
        }
        return s;
      }

      const rows = activeEmployees.map(emp => {
        const baseSalary = parseFloat(emp.baseSalary ?? "0") || 0;
        const hourlyRate = parseFloat(emp.hourlyRate ?? "0") || 0;
        const workRule = workRulesMap.get(emp.workRuleId ?? "") ?? defaultRule;
        const isEmpHolidayPay = (date: string): boolean => {
          const dow = new Date(date + "T00:00:00").getDay();
          return getEffectiveWeeklyOffDays(date, emp.workRuleId, activeOverrides, weeklyOffDays).includes(dow);
        };

        // مدة يوم العمل الفعلية
        let totalWorkDayMinutes = 480;
        if (workRule?.is24hShift) {
          totalWorkDayMinutes = 1440;
        } else if (workRule) {
          const [sh, sm] = workRule.workStartTime.split(":").map(Number);
          const [eh, em] = workRule.workEndTime.split(":").map(Number);
          totalWorkDayMinutes = Math.max(1, (eh * 60 + em) - (sh * 60 + sm));
        }

        const lateArrivalGrace = workRule?.lateGraceMinutes ?? 0;
        const earlyLeaveGrace = workRule?.earlyLeaveGraceMinutes ?? 0;

        const empRecords = recordsByEmployee.get(emp.id) ?? [];

        interface PayDayRecord { date: string; status: string; dailyScore: number; }
        const dailyRecords: PayDayRecord[] = [];

        // حساب نقطة كل سجل حضور
        for (const rec of empRecords) {
          const dayOverride = activeOverrides.find(ov =>
            rec.date >= ov.dateFrom && rec.date <= ov.dateTo &&
            (!ov.workRuleId || ov.workRuleId === emp.workRuleId)
          );

          let score = 0;
          if (rec.status === "absent") {
            score = 0;
          } else if (rec.status === "leave" || rec.status === "rest") {
            score = 1;
          } else if (dayOverride) {
            const effStart = dayOverride.workStartTime ?? workRule?.workStartTime ?? "08:00";
            const effEnd   = dayOverride.workEndTime   ?? workRule?.workEndTime   ?? "16:00";
            const effStartMin = payTimeToMin(effStart)!;
            let effEndMin = payTimeToMin(effEnd)!;
            if (dayOverride.isOvernight && effEndMin <= effStartMin) effEndMin += 24 * 60;
            const effDayMin = Math.max(1, effEndMin - effStartMin);

            let ciMin = payTimeToMin(rec.checkIn);
            let coMin = payTimeToMin(rec.checkOut);
            // تصحيح التبديل الليلي
            if (dayOverride.isOvernight && ciMin !== null && coMin !== null) {
              if (ciMin < effStartMin && coMin >= (effStartMin - 60)) {
                const t = ciMin; ciMin = coMin; coMin = t + 24 * 60;
              }
            }
            if (dayOverride.isOvernight && coMin !== null && coMin < effStartMin) coMin += 24 * 60;

            const rawLate      = ciMin !== null ? Math.max(0, ciMin - effStartMin) : 0;
            const rawEarlyLeave = coMin !== null ? Math.max(0, effEndMin - coMin)  : 0;
            const effLate  = Math.max(0, rawLate      - lateArrivalGrace);
            const effEarly = Math.max(0, rawEarlyLeave - earlyLeaveGrace);
            let midAbs = rec.middleAbsenceMinutes ?? 0;
            if ((rec as any).rawPunches) {
              try {
                const rawPunchArr = JSON.parse((rec as any).rawPunches) as string[];
                midAbs = calculateMiddleAbsenceMinutes(rawPunchArr, MIDDLE_ABSENCE_GRACE_MINUTES, effStartMin);
              } catch { /* keep stored value */ }
            }

            if (workRule?.is24hShift && Number(rec.totalHours || 0) >= 20) score = 2;
            else score = Math.max(0, 1 - (effLate + effEarly + midAbs) / effDayMin);
          } else {
            // بدون جدول خاص: نُعيد حساب الغياب الوسيطي من البصمات الخام إن توفرت (كما تفعل صفحة التقارير)
            // وإلا نستخدم القيم المخزنة احتياطياً
            const effLate  = Math.max(0, (rec.lateMinutes ?? 0) - lateArrivalGrace);
            const effEarly = Math.max(0, (rec.earlyLeaveMinutes ?? 0) - earlyLeaveGrace);
            const baseShiftStartMin = payTimeToMin(workRule?.workStartTime ?? "08:00") ?? 480;
            let midAbs = rec.middleAbsenceMinutes ?? 0;
            if ((rec as any).rawPunches) {
              try {
                const rawPunchArr = JSON.parse((rec as any).rawPunches) as string[];
                midAbs = calculateMiddleAbsenceMinutes(rawPunchArr, MIDDLE_ABSENCE_GRACE_MINUTES, baseShiftStartMin);
              } catch { /* keep stored value */ }
            }

            if (workRule?.is24hShift && Number(rec.totalHours || 0) >= 20) score = 2;
            else score = Math.max(0, 1 - (effLate + effEarly + midAbs) / totalWorkDayMinutes);
          }

          dailyRecords.push({ date: rec.date, status: rec.status, dailyScore: Math.round(score * 100) / 100 });
        }

        // حقن أيام العطلة الأسبوعية
        if (!workRule?.is24hShift) {
          for (const date of allDatesInMonth.filter(isEmpHolidayPay)) {
            if (date > todayStr) continue;
            const ex = dailyRecords.find(r => r.date === date);
            if (ex) { ex.status = "holiday"; ex.dailyScore = 1.00; }
            else dailyRecords.push({ date, status: "holiday", dailyScore: 1.00 });
          }
        }

        // حقن الغياب للأيام الناقصة في نطاق الشهر
        for (const date of allDatesInMonth) {
          if (isEmpHolidayPay(date) && !workRule?.is24hShift) continue;
          if (date > todayStr) continue;
          if (!dailyRecords.some(r => r.date === date))
            dailyRecords.push({ date, status: "absent", dailyScore: 0.00 });
        }

        // حقن الإجازات المدفوعة: فقط الأيام "absent" تُحوَّل إلى "leave" بنقطة 1.00
        for (const lv of allLeaves) {
          if (!lv.isPaid || !payLeaveApplies(lv, emp)) continue;
          if (lv.startDate > endDate || lv.endDate < startDate) continue;
          for (const dr of dailyRecords) {
            if (dr.date >= lv.startDate && dr.date <= lv.endDate && dr.status === "absent") {
              dr.status = "leave";
              dr.dailyScore = 1.00;
            }
          }
        }

        // قاعدة اليوم 31
        if (isFullMonth31) {
          const day31Str = `${year}-${String(month).padStart(2, "0")}-31`;
          const rec31 = dailyRecords.find(r => r.date === day31Str);
          if (rec31) rec31.dailyScore = rec31.status === "absent" ? -1.00 : 0.00;
        }

        // خصم نقطة العطلة الأسبوعية عند الغياب (بدون أيام الإجازة غير المدفوعة)
        const empUnpaidLeaveDates = new Set<string>();
        for (const lv of allLeaves) {
          if (lv.isPaid || !payLeaveApplies(lv, emp)) continue;
          if (lv.startDate > endDate || lv.endDate < startDate) continue;
          let d = new Date((lv.startDate > startDate ? lv.startDate : startDate) + "T00:00:00");
          const dEnd = new Date((lv.endDate < endDate ? lv.endDate : endDate) + "T00:00:00");
          while (d <= dEnd) { empUnpaidLeaveDates.add(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
        }

        const holidaysByWeek = new Map<string, PayDayRecord[]>();
        for (const rec of dailyRecords) {
          if (rec.status === "holiday") {
            const wk = payGetWeekStart(rec.date);
            if (!holidaysByWeek.has(wk)) holidaysByWeek.set(wk, []);
            holidaysByWeek.get(wk)!.push(rec);
          }
        }
        for (const [wk, holidays] of holidaysByWeek) {
          const absenceCount = dailyRecords.filter(
            r => payGetWeekStart(r.date) === wk && r.status === "absent" && !empUnpaidLeaveDates.has(r.date)
          ).length;
          if (absenceCount === 0) continue;
          let toDeduct = absenceCount * 0.5;
          for (const holiday of [...holidays].sort((a, b) => b.date.localeCompare(a.date))) {
            if (toDeduct <= 0) break;
            const deduct = Math.min(toDeduct, holiday.dailyScore);
            holiday.dailyScore = Math.round((holiday.dailyScore - deduct) * 100) / 100;
            toDeduct = Math.round((toDeduct - deduct) * 100) / 100;
          }
        }

        // تطبيق الإجازات غير المدفوعة فقط (آخر مرحلة)
        for (const lv of allLeaves) {
          if (lv.isPaid || !payLeaveApplies(lv, emp)) continue;
          if (lv.startDate > endDate || lv.endDate < startDate) continue;
          for (const dr of dailyRecords) {
            if (dr.date >= lv.startDate && dr.date <= lv.endDate) {
              dr.status = "absent";
              dr.dailyScore = 0.00;
            }
          }
        }

        // مجموع النقطة + تعويض فيفري
        let attendanceScore = dailyRecords.reduce((s, r) => s + r.dailyScore, 0);
        attendanceScore += monthBonus;
        attendanceScore = Math.round(attendanceScore * 100) / 100;
        // تطبيق override إن وُجد (يحل محل القيمة المحسوبة)
        if (scoreOverridesMap[emp.id] !== undefined) {
          attendanceScore = scoreOverridesMap[emp.id];
        }

        // راتب الحضور = (النقطة × الأساسي) ÷ 30
        const attendanceSalary = Math.round((attendanceScore * baseSalary / 30) * 100) / 100;
        const attendanceDeduction = Math.max(0, Math.round((baseSalary - attendanceSalary) * 100) / 100);

        // ---- حساب الساعات الإضافية ----
        const empRecs = recordsByEmployee.get(emp.id) ?? [];
        const earlyArrivalGrace = workRule?.earlyArrivalGraceMinutes ?? 0;
        const lateLeaveGraceOT = workRule?.lateLeaveGraceMinutes ?? 0;
        let totalOvertimeMinutes = 0;
        for (const rec of empRecs) {
          if (!rec.checkIn && !rec.checkOut) continue;
          const isHol = !workRule?.is24hShift && isEmpHolidayPay(rec.date);
          if (isHol) {
            // يوم عطلة: كل دقيقة عمل = إضافي
            const ciMin = payTimeToMin(rec.checkIn);
            const coMin = payTimeToMin(rec.checkOut);
            if (ciMin !== null && coMin !== null && coMin > ciMin) totalOvertimeMinutes += coMin - ciMin;
          } else {
            const dayOvr = activeOverrides.find(ov =>
              rec.date >= ov.dateFrom && rec.date <= ov.dateTo &&
              (!ov.workRuleId || ov.workRuleId === emp.workRuleId)
            );
            const effStart = dayOvr ? (payTimeToMin(dayOvr.workStartTime) ?? 0) : (workRule ? payTimeToMin(workRule.workStartTime)! : 480);
            const effEnd   = dayOvr ? (payTimeToMin(dayOvr.workEndTime)   ?? 960) : (workRule ? payTimeToMin(workRule.workEndTime)!   : 960);
            const ciMin = payTimeToMin(rec.checkIn);
            const coMin = payTimeToMin(rec.checkOut);
            const earlyOT = (ciMin !== null && ciMin < (effStart - earlyArrivalGrace)) ? (effStart - ciMin) : 0;
            const lateOT  = (coMin !== null && coMin > (effEnd + lateLeaveGraceOT)) ? (coMin - effEnd) : 0;
            totalOvertimeMinutes += earlyOT + lateOT;
          }
        }
        const overtimeHours = Math.round(totalOvertimeMinutes / 60 * 10) / 10;
        const overtimePay   = Math.round(hourlyRate * overtimeHours * 100) / 100;

        // ---- حساب المنحة الشهرية ----
        let grantAmount = 0;
        const empLeaveDates = buildPayLeaveDates(emp);
        const empRecsByDate = new Map((recordsByEmployee.get(emp.id) ?? []).map(r => [r.date, r]));
        for (const grant of allGrantsRaw) {
          if (grant.type !== "grant") continue;
          let applies = false;
          if (grant.targetType === "all") applies = true;
          else if (grant.targetType === "shift") applies = (emp.shift || "morning") === grant.shiftValue;
          else if (grant.targetType === "workshop") applies = emp.workshopId === grant.workshopId;
          else if (grant.targetType === "employee") {
            let ids: string[] = []; try { ids = JSON.parse(grant.employeeIds ?? "[]"); } catch { ids = []; }
            applies = ids.includes(emp.id);
          }
          if (!applies) continue;

          const baseGrant = parseFloat(grant.amount) || 0;
          const conds = grant.conditions;
          let gFinal = baseGrant;
          let gCancelled = false;

          let absDays = 0, lateDays = 0, totalLateMin = 0, totalEarlyLeaveMin = 0;
          const wdAbs: Record<number, number> = {};
          const is24h = workRule?.is24hShift ?? false;
          for (const date of allDatesInMonth) {
            if (date > todayStr) continue;
            const dow = new Date(date + "T00:00:00").getDay();
            if (!is24h && isEmpHolidayPay(date)) continue;
            if (empLeaveDates.has(date)) continue;
            const rec = empRecsByDate.get(date);
            if (!rec || rec.status === "absent") { absDays++; wdAbs[dow] = (wdAbs[dow] || 0) + 1; }
            else if (rec.status === "present" || rec.status === "late") {
              const ciMin = payTimeToMin(rec.checkIn);
              if (ciMin !== null) {
                const effLate = Math.max(0, ciMin - (workRule ? payTimeToMin(workRule.workStartTime)! : 480) - (workRule?.lateGraceMinutes ?? 0));
                if (effLate > 0) { lateDays++; totalLateMin += effLate; }
              }
              const coMin = payTimeToMin(rec.checkOut ?? null);
              if (coMin !== null) {
                const effEarly = Math.max(0, (workRule ? payTimeToMin(workRule.workEndTime)! : 960) - coMin - (workRule?.earlyLeaveGraceMinutes ?? 0));
                if (effEarly > 0) totalEarlyLeaveMin += effEarly;
              }
            }
          }

          for (const cond of conds) {
            if (cond.conditionType === "violations_exceed") {
              if ((absDays + lateDays) > (cond.violationsThreshold ?? 0)) { gCancelled = true; gFinal = 0; break; }
            }
          }
          if (!gCancelled) {
            for (const cond of conds) {
              if (gCancelled || cond.conditionType === "violations_exceed") continue;
              const effAmt = parseFloat(cond.effectAmount ?? "0") || 0;
              let triggered = false;
              if (cond.conditionType === "absence") {
                if (cond.absenceMode === "count") triggered = absenceThresholdMetPay(absDays, cond.daysThreshold ?? null);
                else if (cond.absenceMode === "weekday") {
                  let wds: string[] = []; try { wds = JSON.parse(cond.weekdays ?? "[]"); } catch { wds = []; }
                  triggered = wds.some(wd => { const dow = WEEKDAY_TO_DOW_PAY[String(wd)] ?? -1; return dow >= 0 && (wdAbs[dow] ?? 0) > 0; });
                }
              } else if (cond.conditionType === "late") triggered = totalLateMin >= (cond.minutesThreshold ?? 0);
              else if (cond.conditionType === "early_leave") triggered = totalEarlyLeaveMin >= (cond.minutesThreshold ?? 0);
              else if (cond.conditionType === "attendance") triggered = absDays > 0;
              if (triggered) {
                if (cond.effectType === "cancel") { gCancelled = true; gFinal = 0; break; }
                else if (cond.effectType === "deduct") gFinal = Math.max(0, gFinal - effAmt);
                else if (cond.effectType === "add") gFinal += effAmt;
              }
            }
          }
          grantAmount += gCancelled ? 0 : Math.max(0, Math.round(gFinal * 100) / 100);
        }
        grantAmount = Math.round(grantAmount * 100) / 100;

        // ---- الديون والتسبيقات ----
        const empDebts = allDebts.filter(d => d.employeeId === emp.id && d.isActive);
        const isDebtSkipped = debtSkipsSet.has(emp.id);
        // نحدد قسط الخصم الشهري بحيث لا يتجاوز الرصيد المتبقي (صفر إذا كان الخصم معلَّقاً)
        const debtDeduction = isDebtSkipped ? 0 : empDebts.reduce((sum, d) => {
          const monthly = parseFloat(d.monthlyDeduction ?? "0") || 0;
          const remaining = parseFloat(d.remainingAmount ?? "0") || 0;
          return sum + Math.min(monthly, remaining);
        }, 0);
        const empAdvances = advances.filter(a => a.employeeId === emp.id);
        const advanceDeduction = empAdvances.reduce((sum, a) => sum + (parseFloat(a.amount ?? "0") || 0), 0);

        // ---- الصافي الجديد ----
        // الصافي = راتب الحضور + أجر الساعات الإضافية + المنحة − الديون − التسبيقات + باقي الشهر السابق
        const amountPaid = currentPaymentsMap.get(emp.id) ?? 0;
        const prevRemaining = prevRemainingMap.get(emp.id) ?? 0; // باقي الشهر السابق (موجب=مستحق، سالب=زائد)
        const netSalary = Math.round((attendanceSalary + overtimePay + grantAmount - debtDeduction - advanceDeduction + prevRemaining) * 100) / 100;
        const remainingBalance = Math.round((netSalary - amountPaid) * 100) / 100;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          workshopId: emp.workshopId ?? null,
          baseSalary,
          attendanceScore,
          attendanceDeduction: Math.round(attendanceDeduction * 100) / 100,
          overtimeHours,
          overtimePay,
          grantAmount,
          debtDeduction: Math.round(debtDeduction * 100) / 100,
          debtSkipped: isDebtSkipped,
          advanceDeduction: Math.round(advanceDeduction * 100) / 100,
          netSalary,
          amountPaid,
          remainingBalance,
          debts: empDebts,
          advances: empAdvances,
        };
      });

      return rows;
  }

  // GET /api/payroll/monthly?year=&month= — كشف الرواتب الشهري
  app.get("/api/payroll/monthly", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      if (isNaN(year) || isNaN(month)) return res.status(400).json({ message: "السنة والشهر مطلوبان" });
      const rows = await computePayrollRows(year, month);
      return res.json({ year, month, rows });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // GET /api/payroll/export?year=&month= — تصدير كشف الرواتب إلى Excel
  app.get("/api/payroll/export", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      if (isNaN(year) || isNaN(month)) return res.status(400).json({ message: "السنة والشهر مطلوبان" });

      const rows = await computePayrollRows(year, month);
      type PayrollRow = (typeof rows)[number];

      const allWorkshops = await storage.getWorkshops();
      const workshopMap = new Map(allWorkshops.map(w => [w.id as string, w.name as string]));

      // Sort: workshop name ASC → employee name ASC
      const sortedRows = [...rows].sort((a: PayrollRow, b: PayrollRow) => {
        const wa = workshopMap.get(a.workshopId ?? "") ?? "";
        const wb = workshopMap.get(b.workshopId ?? "") ?? "";
        const wCmp = wa.localeCompare(wb, "ar");
        if (wCmp !== 0) return wCmp;
        return (a.employeeName ?? "").localeCompare(b.employeeName ?? "", "ar");
      });

      const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
      const sheetTitle = `كشف رواتب — شهر ${MONTHS_AR[month - 1]} سنة ${year}`;
      const monthStr = String(month).padStart(2, "0");
      const filename = `رواتب_${year}-${monthStr}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Attendance System";
      const ws = workbook.addWorksheet(sheetTitle, { views: [{ rightToLeft: true }] });

      const NCOLS = 13;
      const moneyFmt = "#,##0.00";
      const scoreFmt = "0.00";

      // Helper: apply thin borders to a cell (no type cast needed)
      function setBorder(cell: ExcelJS.Cell) {
        const s = { style: "thin" as const };
        cell.border = { top: s, bottom: s, left: s, right: s };
      }

      // Column width tracker (for auto-fit)
      const colWidths: number[] = new Array(NCOLS).fill(6);
      function trackWidth(ci: number, val: string | number | null | undefined) {
        const len = String(val ?? "").length;
        if (len > colWidths[ci]) colWidths[ci] = len;
      }

      // Title row (merged)
      ws.mergeCells(1, 1, 1, NCOLS);
      const titleCell = ws.getCell("A1");
      titleCell.value = sheetTitle;
      titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2A4A" } };
      ws.getRow(1).height = 36;

      // Header row — 13 columns
      // ci: 0=الاسم 1=رقم الموظف 2=الورشة 3=الراتب الأساسي 4=نقطة الحضور
      //     5=خصم الحضور 6=الساعات الإضافية 7=المنحة 8=خصم الدين
      //     9=خصم التسبيقة 10=صافي الراتب 11=المبلغ المدفوع 12=باقي الصرف
      const headers = ["الاسم","رقم الموظف","الورشة","الراتب الأساسي","نقطة الحضور","خصم الحضور","الساعات الإضافية","المنحة","خصم الدين","خصم التسبيقة","صافي الراتب","المبلغ المدفوع","باقي الصرف"];
      headers.forEach((h, i) => trackWidth(i, h));
      const hRow = ws.getRow(2);
      headers.forEach((h, i) => {
        const cell = hRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E4057" } };
        setBorder(cell);
      });
      hRow.height = 28;
      ws.views = [{ state: "frozen", ySplit: 2, rightToLeft: true }];

      // Accumulate totals
      let totalBase = 0, totalDeduction = 0, totalOtPay = 0, totalGrant = 0;
      let totalDebt = 0, totalAdvance = 0, totalNet = 0, totalPaid = 0, totalRemaining = 0;

      // Column number formats (13 cols): score uses 0.00, monetary cols use #,##0.00
      const colFmt: (string | null)[] = [null, null, null, moneyFmt, scoreFmt, moneyFmt, moneyFmt, moneyFmt, moneyFmt, moneyFmt, moneyFmt, moneyFmt, moneyFmt];

      sortedRows.forEach((row: PayrollRow, idx: number) => {
        const r = ws.getRow(idx + 3);
        const rowBg = idx % 2 === 1 ? "FFF8F9FA" : "FFFFFFFF";

        const cells: (string | number)[] = [
          row.employeeName,
          row.employeeCode ?? "",
          workshopMap.get(row.workshopId ?? "") ?? "",
          row.baseSalary,
          row.attendanceScore,
          row.attendanceDeduction,    // ci=5 خصم الحضور → red
          row.overtimePay,             // ci=6 الساعات الإضافية → blue
          row.grantAmount,             // ci=7 المنحة → blue
          row.debtDeduction,           // ci=8 خصم الدين → red
          row.advanceDeduction,        // ci=9 خصم التسبيقة → red
          row.netSalary,               // ci=10 صافي الراتب → green bg
          row.amountPaid,              // ci=11 المبلغ المدفوع → yellow bg
          row.remainingBalance,        // ci=12 باقي الصرف → orange bg
        ];

        cells.forEach((val, ci) => {
          trackWidth(ci, val);
          const cell = r.getCell(ci + 1);
          cell.value = val;
          setBorder(cell);
          cell.alignment = { vertical: "middle", readingOrder: "rtl", horizontal: "right" };
          const fmt = colFmt[ci];
          if (fmt) cell.numFmt = fmt;
          // Special column background colors
          if (ci === 10) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
          } else if (ci === 11) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
          } else if (ci === 12) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE5CC" } };
          } else {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
          }
          // Deduction columns (خصم الحضور، خصم الدين، خصم التسبيقة) — red text
          if (ci === 5 || ci === 8 || ci === 9) {
            cell.font = { color: { argb: "FFCC0000" } };
          }
          // Addition columns (الساعات الإضافية، المنحة) — blue text
          if (ci === 6 || ci === 7) {
            cell.font = { color: { argb: "FF0055CC" } };
          }
        });

        totalBase      += row.baseSalary      ?? 0;
        totalDeduction += row.attendanceDeduction ?? 0;
        totalOtPay     += row.overtimePay      ?? 0;
        totalGrant     += row.grantAmount      ?? 0;
        totalDebt      += row.debtDeduction    ?? 0;
        totalAdvance   += row.advanceDeduction ?? 0;
        totalNet       += row.netSalary        ?? 0;
        totalPaid      += row.amountPaid       ?? 0;
        totalRemaining += row.remainingBalance ?? 0;
        r.height = 22;
      });

      // Totals row
      const tRowIdx = sortedRows.length + 3;
      const tRow = ws.getRow(tRowIdx);
      tRow.height = 28;
      const totals: (string | number)[] = ["الإجمالي", "", "", totalBase, 0, totalDeduction, totalOtPay, totalGrant, totalDebt, totalAdvance, totalNet, totalPaid, totalRemaining];
      totals.forEach((val, ci) => {
        trackWidth(ci, val);
        const cell = tRow.getCell(ci + 1);
        cell.value = val;
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9ECEF" } };
        setBorder(cell);
        cell.alignment = { vertical: "middle", readingOrder: "rtl", horizontal: "right" };
        const fmt = colFmt[ci];
        if (fmt) cell.numFmt = fmt;
      });

      // Apply auto-fit column widths (char count + padding, capped at 40)
      ws.columns.forEach((col, ci) => {
        col.width = Math.min(40, Math.max(colWidths[ci] + 3, 10));
      });

      const encFilename = encodeURIComponent(filename);
      const asciiFilename = `payroll_${year}-${monthStr}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encFilename}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (e: any) {
      console.error("[payroll-export-error]", e?.message, e?.stack);
      return res.status(500).json({ message: e.message });
    }
  });

  // POST /api/payroll/payment — حفظ المبلغ المدفوع وباقي الصرف لموظف في شهر معين
  app.post("/api/payroll/payment", async (req, res) => {
    if (!requireCaisseOrOwner(req, res)) return;
    try {
      const { employeeId, month, amountPaid, remainingBalance } = req.body;
      if (!employeeId || !month || amountPaid === undefined)
        return res.status(400).json({ message: "employeeId و month و amountPaid مطلوبة" });
      const result = await storage.upsertSalaryPayment(
        employeeId, month, String(amountPaid), String(remainingBalance ?? 0)
      );

      // تحديث رصيد الديون وإغلاقها تلقائياً عند اكتمال السداد (مع ضمان عدم التكرار)
      try {
        // إذا كان الموظف معلَّق الخصم، لا تُحدَّث أرصدة ديونه
        const skipList = await storage.getDebtSkips(month);
        if (skipList.includes(employeeId)) {
          return res.json(result);
        }
        const empDebts = await storage.getEmployeeDebts(employeeId);
        const activeDebts = empDebts.filter(d => d.isActive);
        for (const debt of activeDebts) {
          // idempotency: لا تخصم نفس الشهر مرتين
          if (debt.lastDeductedMonth === month) continue;
          const monthly = parseFloat(debt.monthlyDeduction ?? "0") || 0;
          const remaining = parseFloat(debt.remainingAmount ?? "0") || 0;
          if (remaining <= 0) {
            // الدين منتهٍ بالفعل، أغلقه
            await storage.updateEmployeeDebt(debt.id, { isActive: false, remainingAmount: "0" });
            continue;
          }
          const deduction = Math.min(monthly, remaining);
          const newRemaining = Math.max(0, Math.round((remaining - deduction) * 100) / 100);
          await storage.updateEmployeeDebt(debt.id, {
            remainingAmount: String(newRemaining),
            isActive: newRemaining > 0,
            lastDeductedMonth: month,
          });
        }
      } catch (debtErr: any) {
        console.error("[debt-update]", debtErr.message);
        // لا نوقف الاستجابة بسبب خطأ في تحديث الديون
      }

      return res.json(result);
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  return httpServer;
}
