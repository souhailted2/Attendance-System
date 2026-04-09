import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

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
const MIDDLE_ABSENCE_GRACE_MINUTES = 15;
function calculateMiddleAbsenceMinutes(filteredTimes: string[], graceMinutes: number = MIDDLE_ABSENCE_GRACE_MINUTES): number {
  if (filteredTimes.length <= 2) return 0;
  let totalAbsence = 0;
  // الأزواج: (t[0],t[1]), (t[2],t[3])... الفجوات: t[1]→t[2], t[3]→t[4]...
  for (let i = 1; i + 1 < filteredTimes.length; i += 2) {
    const outTime = filteredTimes[i];
    const inTime  = filteredTimes[i + 1];
    const [outH, outM] = outTime.split(":").map(Number);
    const [inH,  inM ] = inTime.split(":").map(Number);
    const gapMin = (inH * 60 + inM) - (outH * 60 + outM);
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

    const middleAbsenceMinutes = calculateMiddleAbsenceMinutes(filteredTimes);

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
      // دمج الأوقات الجديدة مع الموجودة وتطبيق فلتر 5 دقائق
      const allTimes = filterDuplicateSwipes(
        [...new Set([
          existing.checkIn,
          existing.checkOut,
          ...entry.times,
        ].filter(Boolean) as string[])].sort(),
        5
      );

      const newCheckIn  = allTimes[0] || null;
      const newCheckOut = allTimes.length > 1 ? allTimes[allTimes.length - 1] : null;
      const newMiddleAbsenceMinutes = calculateMiddleAbsenceMinutes(allTimes);

      const existingMiddle = (existing as { middleAbsenceMinutes?: number }).middleAbsenceMinutes ?? 0;
      if (newCheckOut !== existing.checkOut || newCheckIn !== existing.checkIn || newMiddleAbsenceMinutes !== existingMiddle) {
        let updateData: any = { checkIn: newCheckIn, checkOut: newCheckOut, middleAbsenceMinutes: newMiddleAbsenceMinutes };
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
    res.json(data);
  });

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

      const workRule = await getWorkRuleForEmployee(employeeId);

      let attendanceData: any = {
        employeeId, date,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: status || "present",
        notes: notes || null,
        lateMinutes: 0, earlyLeaveMinutes: 0, totalHours: "0", penalty: "0",
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

      const { checkIn, checkOut, status, notes } = req.body;
      const employeeId = existingRecords.employeeId;

      // تعديل التقارير مقصور على المالك فقط
      if (req.session.username !== "owner") {
        return res.status(403).json({ message: "صلاحية تعديل التقارير متاحة للمالك فقط" });
      }

      const workRule = await getWorkRuleForEmployee(employeeId);

      const finalStatus = status || existingRecords.status;
      // يوم الراحة: نُصفّر الأوقات والحسابات بشكل قاطع
      const isRestStatus = finalStatus === "rest";
      const finalCheckIn = isRestStatus ? null : (checkIn !== undefined ? (checkIn || null) : existingRecords.checkIn);
      const finalCheckOut = isRestStatus ? null : (checkOut !== undefined ? (checkOut || null) : existingRecords.checkOut);

      // نُعيد الغياب الوسيط إلى 0 فقط عند تغيير الأوقات فعلياً (لا مجرد وجود الحقل في الطلب)
      const timesChanged =
        (checkIn !== undefined && (checkIn || null) !== existingRecords.checkIn) ||
        (checkOut !== undefined && (checkOut || null) !== existingRecords.checkOut);
      const updateData: Partial<InsertAttendance> = {
        checkIn: finalCheckIn,
        checkOut: finalCheckOut,
        status: finalStatus,
        notes: notes !== undefined ? notes : existingRecords.notes,
        middleAbsenceMinutes: (isRestStatus || timesChanged) ? 0 : (existingRecords.middleAbsenceMinutes ?? 0),
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

      const allEmployees = await storage.getEmployees();
      const allWorkshops = await storage.getWorkshops();
      const allWorkRules = await storage.getWorkRules();
      const records = await storage.getAttendanceByDateRange(from, to);

      // Load weekly off days
      const offDaySetting = await storage.getAppSetting("weeklyOffDays");
      const weeklyOffDays: number[] = offDaySetting ? JSON.parse(offDaySetting.value) : [];

      // Build full date range list
      const allDatesInRange: string[] = [];
      const curDate = new Date(from + "T00:00:00");
      const endDate = new Date(to + "T00:00:00");
      while (curDate <= endDate) {
        allDatesInRange.push(curDate.toISOString().slice(0, 10));
        curDate.setDate(curDate.getDate() + 1);
      }
      // Set of dates that are holidays (day-of-week in weeklyOffDays)
      const holidayDateSet = new Set<string>(
        weeklyOffDays.length > 0
          ? allDatesInRange.filter(d => {
              const dow = new Date(d + "T00:00:00").getDay();
              return weeklyOffDays.includes(dow);
            })
          : []
      );

      let filteredEmployees = allEmployees.filter(e => e.isActive);
      if (workRuleId) filteredEmployees = filteredEmployees.filter(e => e.workRuleId === workRuleId);
      if (workshopId) filteredEmployees = filteredEmployees.filter(e => e.workshopId === workshopId);

      const report = filteredEmployees.map(emp => {
        const workRule = allWorkRules.find(r => r.id === emp.workRuleId) || allWorkRules.find(r => r.isDefault) || allWorkRules[0];
        const workshop = allWorkshops.find(w => w.id === emp.workshopId);
        const empRecords = records.filter(r => r.employeeId === emp.id);

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
          const normalizedCheckIn = normalizeTime(
            rec.checkIn, workRule?.workStartTime ?? "08:00", earlyArrivalGrace, lateArrivalGrace,
          );
          const normalizedCheckOut = normalizeTime(
            rec.checkOut, workRule?.workEndTime ?? "16:00", earlyLeaveGrace, lateLeaveGrace,
          );

          const checkInMin = timeToMin(rec.checkIn);
          const checkOutMin = timeToMin(rec.checkOut);

          const rawLateMinutes = checkInMin !== null
            ? Math.max(0, checkInMin - workStartMin)
            : 0;
          // إذا كان هناك أقرب وقت مسموح للخروج، يُحسب الخروج المبكر منه بدلاً من نهاية الدوام
          const checkoutEarliestMin = workRule?.checkoutEarliestTime ? timeToMin(workRule.checkoutEarliestTime) : null;
          const earlyLeaveRefMin = checkoutEarliestMin ?? workEndMin;
          const rawEarlyLeaveMinutes = checkOutMin !== null
            ? Math.max(0, earlyLeaveRefMin - checkOutMin)
            : 0;

          const effectiveLateMinutes = Math.max(0, rawLateMinutes - lateArrivalGrace);
          const effectiveEarlyLeaveMinutes = Math.max(0, rawEarlyLeaveMinutes - earlyLeaveGrace);

          const middleAbsenceMin = rec.middleAbsenceMinutes ?? 0;

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
            dailyScore = Math.max(0, 1 - (effectiveLateMinutes + effectiveEarlyLeaveMinutes + middleAbsenceMin) / totalWorkDayMinutes);
          }
          const roundedScore = Math.round(dailyScore * 100) / 100;
          attendanceScore += roundedScore;

          const earlyGraceCutoff = workStartMin - earlyArrivalGrace;
          const earlyOT = (checkInMin !== null && checkInMin < earlyGraceCutoff)
            ? workStartMin - checkInMin : 0;
          const lateOT = (checkOutMin !== null && checkOutMin > workEndMin + lateLeaveGrace)
            ? checkOutMin - workEndMin : 0;
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
        for (const date of (workRule?.is24hShift ? [] : Array.from(holidayDateSet))) {
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
          if (holidayDateSet.has(date)) continue;
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
        {
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
              r => getWeekStart(r.date) === wk && r.status === "absent"
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

        let attendanceData: any = {
          employeeId: employee.id,
          date,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          status: "present",
          notes: "مستورد من ملف",
          lateMinutes: 0, earlyLeaveMinutes: 0, totalHours: "0", penalty: "0",
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
            await storage.createAttendance({
              employeeId,
              date,
              checkIn,
              checkOut,
              status: calc.status,
              lateMinutes: calc.lateMinutes,
              earlyLeaveMinutes: calc.earlyLeaveMinutes,
              totalHours: String(calc.totalHours),
              penalty: String(calc.penalty),
              notes: null,
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

  // ---- Frozen Archives ----

  // GET /api/frozen-archives?month=YYYY-MM
  app.get("/api/frozen-archives", async (req, res) => {
    if (req.session.username !== "owner") {
      return res.status(403).json({ message: "غير مصرح" });
    }
    const month = String(req.query.month || "");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "month مطلوب بصيغة YYYY-MM" });
    }
    const list = await storage.getFrozenArchives(month);
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

  // POST /iclock/devicecmd — device reporting command result
  app.post("/iclock/devicecmd", admsTextParser, (req, res) => {
    const sn = String(req.query.SN || "");
    console.log(`[ADMS] POST /iclock/devicecmd SN=${sn}`);
    res.setHeader("Content-Type", "text/plain");
    res.send("OK");
  });

  return httpServer;
}
