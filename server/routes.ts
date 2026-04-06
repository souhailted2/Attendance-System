import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import { storage } from "./storage";
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

function calculateAttendanceDetails(checkIn: string | null, checkOut: string | null, workStartTime: string, workEndTime: string, lateGraceMinutes: number, latePenaltyPerMinute: string, earlyLeavePenaltyPerMinute: string, absencePenalty: string, status: string) {
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

  if (checkOut && workEndTime) {
    const [checkH, checkM] = checkOut.split(":").map(Number);
    const [endH, endM] = workEndTime.split(":").map(Number);
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
    const checkIn = entry.times[0] || null;
    const checkOut = entry.times.length > 1 ? entry.times[entry.times.length - 1] : null;

    let attendanceData: any = {
      employeeId: employee.id,
      date: entry.date,
      checkIn,
      checkOut,
      status: "present",
      notes: `مزامنة من: ${sourceName}`,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
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
        "present"
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
      if (e.message?.includes("duplicate") || e.code === "23505" || e.errno === 1062) {
        // سجل موجود مسبقاً — ندمج الأوقات ونُحدِّث وقت الخروج إن لزم
        try {
          const existing = await storage.getAttendanceByEmployeeAndDate(employee.id, entry.date);
          if (existing) {
            const allTimes = [...new Set([
              existing.checkIn,
              existing.checkOut,
              ...entry.times,
            ].filter(Boolean) as string[])].sort();

            const newCheckIn  = allTimes[0] || null;
            const newCheckOut = allTimes.length > 1 ? allTimes[allTimes.length - 1] : null;

            if (newCheckOut !== existing.checkOut || newCheckIn !== existing.checkIn) {
              let updateData: any = { checkIn: newCheckIn, checkOut: newCheckOut };
              if (workRule) {
                const calc = calculateAttendanceDetails(
                  newCheckIn, newCheckOut,
                  workRule.workStartTime, workRule.workEndTime,
                  workRule.lateGraceMinutes,
                  workRule.latePenaltyPerMinute,
                  workRule.earlyLeavePenaltyPerMinute,
                  workRule.absencePenalty,
                  "present"
                );
                updateData.lateMinutes = calc.lateMinutes;
                updateData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
                updateData.totalHours = String(calc.totalHours);
                updateData.penalty = String(calc.penalty);
                updateData.status = calc.status;
              }
              await storage.updateAttendance(existing.id, updateData);
              imported++;
            } else {
              duplicates++;
            }
          } else {
            duplicates++;
          }
        } catch (updateErr: any) {
          errors.push(`${employee.name} - ${entry.date}: ${updateErr.message}`);
          skipped++;
        }
      } else {
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
          status || "present"
        );
        attendanceData.lateMinutes = calc.lateMinutes;
        attendanceData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
        attendanceData.totalHours = String(calc.totalHours);
        attendanceData.penalty = String(calc.penalty);
        attendanceData.status = calc.status;
      }

      const record = await storage.createAttendance(attendanceData);
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

      const workRule = await getWorkRuleForEmployee(employeeId);

      const finalCheckIn = checkIn !== undefined ? (checkIn || null) : existingRecords.checkIn;
      const finalCheckOut = checkOut !== undefined ? (checkOut || null) : existingRecords.checkOut;
      const finalStatus = status || existingRecords.status;

      const updateData: Partial<InsertAttendance> = {
        checkIn: finalCheckIn,
        checkOut: finalCheckOut,
        status: finalStatus,
        notes: notes !== undefined ? notes : existingRecords.notes,
      };

      if (workRule) {
        const calc = calculateAttendanceDetails(
          finalCheckIn, finalCheckOut,
          workRule.workStartTime, workRule.workEndTime,
          workRule.lateGraceMinutes,
          workRule.latePenaltyPerMinute,
          workRule.earlyLeavePenaltyPerMinute,
          workRule.absencePenalty,
          finalStatus
        );
        updateData.lateMinutes = calc.lateMinutes;
        updateData.earlyLeaveMinutes = calc.earlyLeaveMinutes;
        updateData.totalHours = String(calc.totalHours);
        updateData.penalty = String(calc.penalty);
        updateData.status = calc.status;
      }

      const record = await storage.updateAttendance(req.params.id, updateData);
      if (!record) return res.status(404).json({ message: "Not found" });
      res.json(record);
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
            "present"
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
              status
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

  // POST /iclock/devicecmd — device reporting command result
  app.post("/iclock/devicecmd", admsTextParser, (req, res) => {
    const sn = String(req.query.SN || "");
    console.log(`[ADMS] POST /iclock/devicecmd SN=${sn}`);
    res.setHeader("Content-Type", "text/plain");
    res.send("OK");
  });

  return httpServer;
}
