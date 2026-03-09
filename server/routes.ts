import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertWorkshopSchema, insertPositionSchema, insertWorkRuleSchema, insertEmployeeSchema, insertDeviceSettingsSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

      let updateData: any = {
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
          wage: emp.wage || "0",
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
      res.json({ success: false, message: "وظيفة الاتصال بالجهاز غير متاحة حاليا. تأكد من تثبيت مكتبة zkteco-js" });
    } catch (error: any) {
      res.json({ success: false, message: error.message });
    }
  });

  app.post("/api/device-settings/:id/sync", async (req, res) => {
    try {
      const setting = await storage.getDeviceSetting(req.params.id);
      if (!setting) return res.status(404).json({ message: "Not found" });
      res.json({ imported: 0, skipped: 0, duplicates: 0, total: 0, errors: [], message: "وظيفة المزامنة غير متاحة حاليا" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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

  return httpServer;
}
