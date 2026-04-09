import { storage } from "./storage";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "owner";
const ATTENDANCE_USERNAME = "attendence";
const OBSERVER_USERNAME = "observer";

async function ensureAdminUser() {
  const target = await storage.getUserByUsername(ADMIN_USERNAME);
  if (target) return;

  // ترقية من الاسم القديم bachir tedjani
  const oldBachir = await storage.getUserByUsername("bachir tedjani");
  if (oldBachir) {
    await storage.renameUser("bachir tedjani", ADMIN_USERNAME);
    console.log(`✅ تم تغيير اسم المستخدم: bachir tedjani → ${ADMIN_USERNAME}`);
    return;
  }

  const old = await storage.getUserByUsername("admin");
  if (old) {
    await storage.renameUser("admin", ADMIN_USERNAME);
    console.log(`✅ تم تغيير اسم المستخدم: admin → ${ADMIN_USERNAME}`);
    return;
  }

  const hashed = await bcrypt.hash("admin123", 10);
  await storage.createUser({ username: ADMIN_USERNAME, password: hashed });
  console.log(`✅ تم إنشاء المستخدم الافتراضي: ${ADMIN_USERNAME} / admin123`);
}

async function ensureAttendanceUser() {
  const existing = await storage.getUserByUsername(ATTENDANCE_USERNAME);
  if (existing) return;
  const hashed = await bcrypt.hash("attendence123", 10);
  await storage.createUser({ username: ATTENDANCE_USERNAME, password: hashed });
  console.log(`✅ تم إنشاء مستخدم الحضور: ${ATTENDANCE_USERNAME} / attendence123`);
}

async function ensureObserverUser() {
  const existing = await storage.getUserByUsername(OBSERVER_USERNAME);
  if (existing) return;
  const hashed = await bcrypt.hash("observer123", 10);
  await storage.createUser({ username: OBSERVER_USERNAME, password: hashed });
  console.log(`✅ تم إنشاء مستخدم المراقب: ${OBSERVER_USERNAME} / observer123`);
}

export async function seedDatabase() {
  await storage.initActivityLogs();
  await ensureAdminUser();
  await ensureAttendanceUser();
  await ensureObserverUser();

  const existingCompanies = await storage.getCompanies();
  if (existingCompanies.length > 0) return;

  const company1 = await storage.createCompany({ name: "شركة البناء المتقدم", description: "شركة مقاولات عامة" });
  const company2 = await storage.createCompany({ name: "مصنع الحديد والصلب", description: "تصنيع الحديد والهياكل المعدنية" });
  const company3 = await storage.createCompany({ name: "شركة الكهرباء الحديثة", description: "أعمال كهربائية وصيانة" });

  const workshop1 = await storage.createWorkshop({ name: "ورشة اللحام", description: "لحام وتشكيل المعادن" });
  const workshop2 = await storage.createWorkshop({ name: "ورشة النجارة", description: "أعمال النجارة والأثاث" });
  const workshop3 = await storage.createWorkshop({ name: "ورشة الكهرباء", description: "تمديدات وصيانة كهربائية" });

  const pos1 = await storage.createPosition({ name: "عامل", description: "عامل إنتاج" });
  const pos2 = await storage.createPosition({ name: "فني", description: "فني متخصص" });
  const pos3 = await storage.createPosition({ name: "مشرف", description: "مشرف عمال" });

  const rule = await storage.createWorkRule({
    name: "الدوام الرسمي",
    workStartTime: "07:00",
    workEndTime: "15:00",
    lateGraceMinutes: 10,
    latePenaltyPerMinute: "0.5",
    earlyLeavePenaltyPerMinute: "0.5",
    absencePenalty: "50",
    isDefault: true,
  });

  const emp1 = await storage.createEmployee({
    name: "أحمد محمد علي",
    employeeCode: "EMP001",
    positionId: pos1.id,
    workRuleId: rule.id,
    companyId: company1.id,
    workshopId: workshop1.id,
    phone: "0551234567",
    wage: "3500",
    shift: "morning",
    contractEndDate: "2026-06-30",
    isActive: true,
  });

  const emp2 = await storage.createEmployee({
    name: "خالد عبدالله السالم",
    employeeCode: "EMP002",
    positionId: pos2.id,
    workRuleId: rule.id,
    companyId: company2.id,
    workshopId: workshop2.id,
    phone: "0559876543",
    wage: "4200",
    shift: "morning",
    contractEndDate: "2026-04-15",
    isActive: true,
  });

  const emp3 = await storage.createEmployee({
    name: "محمد سعيد الفهد",
    employeeCode: "EMP003",
    positionId: pos3.id,
    workRuleId: rule.id,
    companyId: company1.id,
    workshopId: workshop3.id,
    phone: "0557654321",
    wage: "5000",
    shift: "evening",
    contractEndDate: "2026-12-31",
    isActive: true,
  });

  const emp4 = await storage.createEmployee({
    name: "عبدالرحمن يوسف",
    employeeCode: "EMP004",
    positionId: pos1.id,
    workRuleId: rule.id,
    companyId: company3.id,
    workshopId: workshop1.id,
    phone: "0553456789",
    wage: "3200",
    shift: "morning",
    contractEndDate: "2026-03-20",
    isActive: true,
  });

  const emp5 = await storage.createEmployee({
    name: "فيصل ناصر الدوسري",
    employeeCode: "EMP005",
    positionId: pos2.id,
    workRuleId: rule.id,
    companyId: company2.id,
    workshopId: workshop2.id,
    phone: "0558765432",
    wage: "4500",
    shift: "morning",
    contractEndDate: "2027-01-15",
    isActive: true,
  });

  const today = new Date();
  const dateStr = (d: Date) => d.toISOString().split("T")[0];

  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = dateStr(d);

    for (const emp of [emp1, emp2, emp3, emp4, emp5]) {
      const lateRoll = Math.random();
      let checkIn = "07:00";
      let status = "present";
      if (lateRoll > 0.7) {
        const lateMins = Math.floor(Math.random() * 30) + 11;
        const h = Math.floor((420 + lateMins) / 60);
        const m = (420 + lateMins) % 60;
        checkIn = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        status = "late";
      }

      const checkOut = emp.shift === "evening" ? "23:00" : "15:00";

      let lateMinutes = 0;
      if (status === "late") {
        const [ch, cm] = checkIn.split(":").map(Number);
        lateMinutes = (ch * 60 + cm) - 420;
      }

      const [inH, inM] = checkIn.split(":").map(Number);
      const [outH, outM] = checkOut.split(":").map(Number);
      const totalHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 100) / 100;

      await storage.createAttendance({
        employeeId: emp.id,
        date,
        checkIn,
        checkOut,
        status,
        lateMinutes,
        earlyLeaveMinutes: 0,
        totalHours: String(totalHours),
        penalty: String(lateMinutes * 0.5),
        notes: null,
      });
    }
  }

  console.log("Seed data created successfully");
}
