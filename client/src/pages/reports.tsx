import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3, Clock, Users, ChevronLeft, ChevronRight, Pencil, Check, X,
  Sun, Moon, Star, Wrench, AlertTriangle, Calendar, Trash2, Lock, Printer,
  FileSpreadsheet, TrendingUp,
} from "lucide-react";
import * as XLSXStyle from "xlsx-js-style";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { WorkRule, Workshop, Employee, FrozenArchive, Company, GrantWithConditions } from "@shared/schema";
import { PageHeader } from "@/components/page-header";

type DateMode = "day" | "week" | "month" | "year";

interface DailyRecord {
  attendanceId: string | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  normalizedCheckIn: string | null;
  normalizedCheckOut: string | null;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  effectiveLateMinutes: number;
  effectiveEarlyLeaveMinutes: number;
  totalHours: string | null;
  dailyScore: number;
  pending?: boolean;
  overtimeHours: number;
}

interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  workshopId: string;
  workshopName: string;
  workRuleId: string;
  hourlyRate?: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  holidayDays?: number;
  totalLateMinutes: number;
  totalHours: number;
  attendanceScore: number;
  monthBonus?: number;
  normalizedTotalDays?: number;
  dailyRecords: DailyRecord[];
}

interface EditCell {
  employeeId: string;
  employeeName: string;
  date: string;
  record: DailyRecord;
}

interface GrantReportRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  workshopName: string;
  grantId: string;
  grantName: string;
  grantType: string;
  baseAmount: number;
  finalAmount: number;
  cancelled: boolean;
}

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getArabicDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ARABIC_DAYS[d.getDay()];
}

function getCellBg(status: string): string {
  if (status === "absent") return "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50";
  if (status === "holiday") return "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50";
  if (status === "leave") return "bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50";
  if (status === "late") return "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50";
  if (status === "rest") return "bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50";
  return "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50";
}

function getCellScoreColor(status: string, score: number): string {
  if (status === "absent") return "text-red-600 dark:text-red-400";
  if (status === "holiday") return "text-blue-600 dark:text-blue-400";
  if (status === "leave") return "text-purple-600 dark:text-purple-400";
  if (status === "rest") return "text-slate-500 dark:text-slate-400";
  if (score >= 1.95) return "text-orange-600 dark:text-orange-400";
  if (score >= 0.95) return "text-green-700 dark:text-green-400";
  if (score >= 0.80) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastDayOfMonth() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
}

function addMinutesToTime(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMins = h * 60 + m + mins;
  const wrapped = ((totalMins % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

function scoreColor(score: number, max: number): string {
  if (max === 0) return "text-muted-foreground";
  const ratio = score / max;
  if (ratio >= 0.95) return "text-green-600 dark:text-green-400 font-bold";
  if (ratio >= 0.8) return "text-amber-600 dark:text-amber-400 font-semibold";
  return "text-red-600 dark:text-red-400 font-semibold";
}

export default function Reports() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isOwner = user?.username === "owner";
  const now = new Date();

  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(lastDayOfMonth());

  const [selectedRule, setSelectedRule] = useState<WorkRule | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"shifts" | "overtime">("shifts");

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [graceForm, setGraceForm] = useState({
    earlyArrivalGraceMinutes: 0,
    lateGraceMinutes: 0,
    earlyLeaveGraceMinutes: 0,
    lateLeaveGraceMinutes: 0,
  });

  const [editCell, setEditCell] = useState<EditCell | null>(null);
  const [editForm, setEditForm] = useState({ status: "present", checkIn: "", checkOut: "" });
  const [overtimeWeekIndex, setOvertimeWeekIndex] = useState(0);
  const [editingRate, setEditingRate] = useState<{ employeeId: string; value: string } | null>(null);
  const rateEscapedRef = useRef(false);

  // تقرير المنح state
  const [grantsMonth, setGrantsMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [grantsGrantId, setGrantsGrantId] = useState("all");
  const [grantsEnabled, setGrantsEnabled] = useState(false);

  useEffect(() => { setOvertimeWeekIndex(0); }, [dateFrom, dateTo]);

  const { data: workRules = [], isLoading: rulesLoading } = useQuery<WorkRule[]>({ queryKey: ["/api/work-rules"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: companies = [] } = useQuery<Company[]>({ queryKey: ["/api/companies"] });

  const { data: frozenArchives = [] } = useQuery<FrozenArchive[]>({
    queryKey: ["/api/frozen-archives"],
    enabled: isOwner,
  });

  const isOwnerOrAttendence = user?.username === "owner" || user?.username === "attendence";

  // قائمة الأشهر المتاحة (24 شهرًا ماضيًا)
  const availableMonths = useMemo(() => {
    const months: { value: string; label: string }[] = [];
    const ARABIC_MONTH_NAMES = [
      "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
      "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ];
    const today = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const value = `${y}-${String(m + 1).padStart(2, "0")}`;
      const label = `${ARABIC_MONTH_NAMES[m]} ${y}`;
      months.push({ value, label });
    }
    return months;
  }, []);

  const { data: allGrants = [] } = useQuery<GrantWithConditions[]>({
    queryKey: ["/api/grants"],
    enabled: isOwnerOrAttendence,
  });

  const { data: grantsReportData = [], isLoading: grantsReportLoading } = useQuery<GrantReportRow[]>({
    queryKey: ["/api/grants/report", grantsMonth, grantsGrantId],
    enabled: isOwnerOrAttendence && grantsEnabled && !!grantsMonth,
    queryFn: async () => {
      const url = `/api/grants/report?month=${grantsMonth}&grantId=${grantsGrantId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("فشل تحميل تقرير المنح");
      return res.json();
    },
  });

  const activeEmployees = employees.filter((e) => e.isActive !== false);

  const reportKey = selectedRule
    ? `/api/reports/range?from=${dateFrom}&to=${dateTo}&workRuleId=${selectedRule.id}${selectedWorkshop ? `&workshopId=${selectedWorkshop.id}` : ""}`
    : null;

  const { data: reportData = [], isLoading: reportLoading } = useQuery<EmployeeReport[]>({
    queryKey: reportKey ? ["/api/reports/range", dateFrom, dateTo, selectedRule?.id, selectedWorkshop?.id] : ["noop"],
    enabled: !!reportKey && !!selectedRule,
    queryFn: async () => {
      if (!reportKey) return [];
      const res = await fetch(reportKey);
      if (!res.ok) throw new Error("فشل تحميل التقرير");
      return res.json();
    },
  });

  const trendQueryKey = selectedWorkshop
    ? `/api/stats/monthly-trend?workshopId=${selectedWorkshop.id}&workRuleId=${selectedRule?.id || ""}&months=6`
    : selectedRule
    ? `/api/stats/monthly-trend?workRuleId=${selectedRule.id}&months=6`
    : null;

  interface MonthlyTrendPoint { label: string; presentRate: number; absentRate: number; }
  const { data: trendData = [], isLoading: trendLoading } = useQuery<MonthlyTrendPoint[]>({
    queryKey: trendQueryKey ? ["/api/stats/monthly-trend", selectedWorkshop?.id, selectedRule?.id] : ["noop-trend"],
    enabled: !!trendQueryKey && !!selectedRule,
    queryFn: async () => {
      if (!trendQueryKey) return [];
      const res = await fetch(trendQueryKey);
      if (!res.ok) throw new Error("فشل تحميل التطور الشهري");
      return res.json();
    },
  });

  const overtimeQueryKey = `/api/reports/range?from=${dateFrom}&to=${dateTo}`;
  const { data: overtimeData = [], isLoading: overtimeLoading } = useQuery<EmployeeReport[]>({
    queryKey: ["/api/reports/range", dateFrom, dateTo, "overtime"],
    enabled: viewMode === "overtime",
    queryFn: async () => {
      const res = await fetch(overtimeQueryKey);
      if (!res.ok) throw new Error("فشل تحميل تقرير الساعات الإضافية");
      return res.json();
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Record<string, number | boolean | string>> }) =>
      apiRequest("PATCH", `/api/work-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-rules"] });
      toast({ title: "تم حفظ نافذة المهلة" });
      setEditingRuleId(null);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const saveRateMutation = useMutation({
    mutationFn: ({ employeeId, hourlyRate }: { employeeId: string; hourlyRate: string }) =>
      apiRequest("PATCH", `/api/employees/${employeeId}/hourly-rate`, { hourlyRate }),
    onSuccess: (_data, { employeeId, hourlyRate }) => {
      queryClient.setQueryData(
        ["/api/reports/range", dateFrom, dateTo, "overtime"],
        (old: EmployeeReport[] | undefined) =>
          old?.map(r => r.employeeId === employeeId ? { ...r, hourlyRate } : r) ?? []
      );
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditingRate(null);
      toast({ description: "تم حفظ سعر الساعة بنجاح" });
    },
    onError: () => toast({ description: "فشل حفظ سعر الساعة", variant: "destructive" }),
  });

  function commitRate(employeeId: string, value: string) {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      toast({ description: "أدخل قيمة صحيحة", variant: "destructive" });
      return;
    }
    saveRateMutation.mutate({ employeeId, hourlyRate: parsed.toString() });
  }

  const saveAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceId, employeeId, date, data }: {
      attendanceId: string | null;
      employeeId: string;
      date: string;
      data: { status: string; checkIn: string | null; checkOut: string | null };
    }) => {
      if (attendanceId) {
        return apiRequest("PATCH", `/api/attendance/${attendanceId}`, data);
      } else {
        return apiRequest("POST", `/api/attendance`, { employeeId, date, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
      toast({ title: "تم حفظ السجل بنجاح" });
      setEditCell(null);
    },
    onError: (err: Error) => toast({ title: "خطأ في الحفظ", description: err.message, variant: "destructive" }),
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/attendance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
      toast({ title: "تم حذف السجل" });
      setEditCell(null);
    },
    onError: (err: Error) => toast({ title: "خطأ في الحذف", description: err.message, variant: "destructive" }),
  });

  function isCellFrozen(date: string, workshopId: string, workRuleId: string): boolean {
    return frozenSet.has(`${date.slice(0, 7)}|${workshopId}|${workRuleId}`);
  }

  function openEditCell(emp: EmployeeReport, date: string, rec: DailyRecord) {
    if (!isOwner) return;
    if (isCellFrozen(date, emp.workshopId, emp.workRuleId)) {
      toast({
        title: "الشهر مجمّد",
        description: "هذا الشهر محفوظ في الأرشيف ولا يمكن التعديل عليه",
        variant: "destructive",
      });
      return;
    }
    setEditCell({ employeeId: emp.employeeId, employeeName: emp.employeeName, date, record: rec });
    setEditForm({
      status: rec.status === "holiday" ? "present" : rec.status,
      checkIn: rec.checkIn ?? "",
      checkOut: rec.checkOut ?? "",
    });
  }

  function handleSaveAttendance() {
    if (!editCell) return;
    saveAttendanceMutation.mutate({
      attendanceId: editCell.record.attendanceId,
      employeeId: editCell.employeeId,
      date: editCell.date,
      data: {
        status: editForm.status,
        checkIn: editForm.checkIn || null,
        checkOut: editForm.checkOut || null,
      },
    });
  }

  function handleDeleteAttendance() {
    if (!editCell?.record.attendanceId) return;
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    deleteAttendanceMutation.mutate(editCell.record.attendanceId);
  }

  function handleDateMode(mode: DateMode) {
    setDateMode(mode);
    const d = new Date();
    if (mode === "day") {
      setDateFrom(todayStr());
      setDateTo(todayStr());
    } else if (mode === "week") {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d.setDate(diff));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      setDateFrom(mon.toISOString().slice(0, 10));
      setDateTo(sun.toISOString().slice(0, 10));
    } else if (mode === "month") {
      setDateFrom(firstDayOfMonth());
      setDateTo(lastDayOfMonth());
    } else {
      setDateFrom(`${now.getFullYear()}-01-01`);
      setDateTo(`${now.getFullYear()}-12-31`);
    }
  }

  function startEditGrace(rule: WorkRule) {
    setEditingRuleId(rule.id);
    setGraceForm({
      earlyArrivalGraceMinutes: rule.earlyArrivalGraceMinutes ?? 0,
      lateGraceMinutes: rule.lateGraceMinutes ?? 0,
      earlyLeaveGraceMinutes: rule.earlyLeaveGraceMinutes ?? 0,
      lateLeaveGraceMinutes: rule.lateLeaveGraceMinutes ?? 0,
    });
  }

  function saveGrace(ruleId: string) {
    updateRuleMutation.mutate({ id: ruleId, data: graceForm });
  }

  function getWorkshopsForRule(rule: WorkRule, companyId?: string) {
    const empsInRule = activeEmployees.filter((e) => e.workRuleId === rule.id);
    const workshopIds = [...new Set(empsInRule.map((e) => e.workshopId).filter(Boolean))];
    return workshopIds.map((wid) => ({
      workshop: workshops.find((w) => w.id === wid),
      count: empsInRule.filter((e) => e.workshopId === wid).length,
    })).filter((x) => {
      if (!x.workshop) return false;
      if (companyId && companyId !== "all") {
        const ws = x.workshop;
        const wsEmps = empsInRule.filter((e) => e.workshopId === ws.id);
        return wsEmps.some((e) => e.companyId === companyId);
      }
      return true;
    });
  }

  function getEmpCountForRule(rule: WorkRule) {
    return activeEmployees.filter((e) => e.workRuleId === rule.id).length;
  }

  const totalScore = useMemo(() => reportData.reduce((s, r) => s + (r.attendanceScore || 0), 0), [reportData]);
  const maxScore = useMemo(() => reportData.reduce((s, r) => s + (r.totalDays || 0), 0), [reportData]);

  const allDates = useMemo(() => {
    const dateSet = new Set<string>();
    for (const emp of reportData) {
      for (const rec of emp.dailyRecords) dateSet.add(rec.date);
    }
    return [...dateSet].sort();
  }, [reportData]);

  const empDayMap = useMemo(() => {
    const map = new Map<string, Map<string, DailyRecord>>();
    for (const emp of reportData) {
      const byDate = new Map<string, DailyRecord>();
      for (const rec of emp.dailyRecords) byDate.set(rec.date, rec);
      map.set(emp.employeeId, byDate);
    }
    return map;
  }, [reportData]);

  // بناء Set للأشهر المجمّدة مرة واحدة بدل البحث في كل خلية
  const frozenSet = useMemo(() => {
    const s = new Set<string>();
    for (const a of frozenArchives) {
      s.add(`${a.month}|${a.workshopId}|${a.workRuleId}`);
    }
    return s;
  }, [frozenArchives]);

  // إجماليات عمود كل يوم مُحسوبة مرة واحدة بدل إعادة الحساب في كل خلية
  const dateTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of allDates) {
      let sum = 0;
      for (const r of reportData) {
        sum += empDayMap.get(r.employeeId)?.get(d)?.dailyScore ?? 0;
      }
      totals.set(d, sum);
    }
    return totals;
  }, [allDates, reportData, empDayMap]);

  const employeesWithOvertime = useMemo(() =>
    overtimeData
      .filter(emp => emp.dailyRecords.some(r => r.overtimeHours > 0 || (r.pending && r.status === "holiday")))
      .sort((a, b) => {
        const ws = (a.workshopName || "").localeCompare(b.workshopName || "", "ar");
        if (ws !== 0) return ws;
        return (a.employeeName || "").localeCompare(b.employeeName || "", "ar");
      }),
    [overtimeData]);

  const overtimeWorkshopGroups = useMemo(() => {
    const groups: { workshopName: string; employees: typeof employeesWithOvertime }[] = [];
    for (const emp of employeesWithOvertime) {
      const wsName = emp.workshopName || "بدون ورشة";
      const existing = groups.find(g => g.workshopName === wsName);
      if (existing) existing.employees.push(emp);
      else groups.push({ workshopName: wsName, employees: [emp] });
    }
    return groups;
  }, [employeesWithOvertime]);

  function formatDZD(value: number): string {
    return value.toFixed(2) + " د.ج";
  }

  const allOvertimeDates = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    const dates: string[] = [];
    const cur = new Date(dateFrom);
    const end = new Date(dateTo);
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, [dateFrom, dateTo]);

  // تقسيم التواريخ إلى أسابيع من 7 أيام
  const overtimeWeeks = useMemo(() => {
    const weeks: string[][] = [];
    for (let i = 0; i < allOvertimeDates.length; i += 7) {
      weeks.push(allOvertimeDates.slice(i, i + 7));
    }
    return weeks.length > 0 ? weeks : [[]];
  }, [allOvertimeDates]);

  const safeWeekIndex = Math.min(overtimeWeekIndex, Math.max(0, overtimeWeeks.length - 1));
  const currentWeekDates = overtimeWeeks[safeWeekIndex] ?? [];

  const overtimeDayMap = useMemo(() => {
    const map = new Map<string, Map<string, DailyRecord>>();
    for (const emp of overtimeData) {
      const byDate = new Map<string, DailyRecord>();
      for (const rec of emp.dailyRecords) byDate.set(rec.date, rec);
      map.set(emp.employeeId, byDate);
    }
    return map;
  }, [overtimeData]);

  function exportReportToExcel() {
    if (!reportData.length) return;

    const DAY_SHORT = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];

    // Cell background + text colors per status (RRGGBB for xlsx-js-style)
    const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
      present: { bg: "DCFCE7", fg: "15803D" },
      late:    { bg: "FEF3C7", fg: "D97706" },
      absent:  { bg: "FEE2E2", fg: "DC2626" },
      holiday: { bg: "DBEAFE", fg: "1D4ED8" },
      leave:   { bg: "F3E8FF", fg: "7C3AED" },
      rest:    { bg: "F1F5F9", fg: "64748B" },
    };
    const FALLBACK_COLOR = STATUS_COLORS.present;

    const border = {
      top:    { style: "thin" as const, color: { rgb: "D1D5DB" } },
      bottom: { style: "thin" as const, color: { rgb: "D1D5DB" } },
      left:   { style: "thin" as const, color: { rgb: "D1D5DB" } },
      right:  { style: "thin" as const, color: { rgb: "D1D5DB" } },
    };

    const centerAlign = { horizontal: "center" as const, vertical: "center" as const, wrapText: true, readingOrder: 2 };
    const rightAlign  = { horizontal: "right"  as const, vertical: "center" as const, wrapText: true, readingOrder: 2 };

    const headerStyle = {
      fill: { fgColor: { rgb: "1E3A5F" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
      alignment: centerAlign,
      border,
    };
    const titleStyle = {
      fill: { fgColor: { rgb: "1E3A5F" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      alignment: { horizontal: "center" as const, vertical: "center" as const, readingOrder: 2 },
      border,
    };
    const totalRowStyle = {
      fill: { fgColor: { rgb: "E5E7EB" } },
      font: { bold: true, sz: 10 },
      alignment: centerAlign,
      border,
    };
    const nameStyle = {
      font: { sz: 10 },
      alignment: rightAlign,
      border,
    };
    const codeStyle = {
      font: { sz: 10 },
      alignment: centerAlign,
      border,
    };
    const totalColStyle = {
      font: { bold: true, sz: 10 },
      alignment: centerAlign,
      border,
    };

    // Group employees by workshopName
    const groups = new Map<string, EmployeeReport[]>();
    for (const emp of reportData) {
      const wsName = emp.workshopName || "بدون ورشة";
      if (!groups.has(wsName)) groups.set(wsName, []);
      groups.get(wsName)!.push(emp);
    }

    const wb = XLSXStyle.utils.book_new();
    const dates = allDates;

    for (const [workshopName, emps] of groups) {
      const totalCols = dates.length + 3; // name + code + dates + total
      const titleText = `${workshopName} — ${selectedRule?.name ?? ""} — ${dateFrom} إلى ${dateTo}`;

      // Build plain value AOA first
      const plainAoa: (string | number)[][] = [];

      // Row 0: title
      plainAoa.push([titleText, ...Array(totalCols - 1).fill("")]);

      // Row 1: headers
      plainAoa.push([
        "الموظف", "الرقم",
        ...dates.map((d) => {
          const dow = new Date(d + "T00:00:00").getDay();
          return `${DAY_SHORT[dow]}\n${d.slice(5).replace("-", "/")}`;
        }),
        "الإجمالي",
      ]);

      // Row 2+: employees
      for (const emp of emps) {
        const byDate = new Map<string, DailyRecord>();
        for (const rec of emp.dailyRecords) byDate.set(rec.date, rec);

        const dayCells = dates.map((d) => {
          const rec = byDate.get(d);
          if (!rec) return "0.00";
          if (rec.status === "leave") return "إجازة";
          if (rec.status === "rest") return `${rec.dailyScore.toFixed(2)}\nراحة`;
          let val = rec.dailyScore.toFixed(2);
          if (rec.checkIn)  val += `\n${rec.checkIn}`;
          if (rec.checkOut) val += `\n${rec.checkOut}`;
          return val;
        });

        plainAoa.push([
          emp.employeeName,
          emp.employeeCode,
          ...dayCells,
          `${emp.attendanceScore.toFixed(2)}/${emp.totalDays}`,
        ]);
      }

      // Last row: totals
      plainAoa.push([
        "المجموع", "",
        ...dates.map((d) => {
          const sum = emps.reduce((s, emp) => {
            const rec = emp.dailyRecords.find((r) => r.date === d);
            return s + (rec?.dailyScore ?? 0);
          }, 0);
          return sum.toFixed(2);
        }),
        emps.reduce((s, emp) => s + emp.attendanceScore, 0).toFixed(2),
      ]);

      // Create sheet from plain values
      const ws = XLSXStyle.utils.aoa_to_sheet(plainAoa);

      // Apply styles cell by cell
      const encodeCell = XLSXStyle.utils.encode_cell;

      // Title row
      for (let c = 0; c < totalCols; c++) {
        const ref = encodeCell({ r: 0, c });
        if (ws[ref]) ws[ref].s = titleStyle;
      }

      // Header row
      for (let c = 0; c < totalCols; c++) {
        const ref = encodeCell({ r: 1, c });
        if (ws[ref]) ws[ref].s = headerStyle;
      }

      // Employee rows
      for (let ei = 0; ei < emps.length; ei++) {
        const r = ei + 2;
        const emp = emps[ei];
        const byDate = new Map<string, DailyRecord>();
        for (const rec of emp.dailyRecords) byDate.set(rec.date, rec);

        // Name cell
        const nameRef = encodeCell({ r, c: 0 });
        if (ws[nameRef]) ws[nameRef].s = nameStyle;

        // Code cell
        const codeRef = encodeCell({ r, c: 1 });
        if (ws[codeRef]) ws[codeRef].s = codeStyle;

        // Day cells
        for (let di = 0; di < dates.length; di++) {
          const ref = encodeCell({ r, c: di + 2 });
          if (!ws[ref]) continue;
          const rec = byDate.get(dates[di]);
          const colors = rec ? (STATUS_COLORS[rec.status] ?? FALLBACK_COLOR) : STATUS_COLORS.absent;
          ws[ref].s = {
            fill: { fgColor: { rgb: colors.bg } },
            font: { bold: true, color: { rgb: colors.fg }, sz: 9 },
            alignment: centerAlign,
            border,
          };
        }

        // Total column
        const totalRef = encodeCell({ r, c: totalCols - 1 });
        if (ws[totalRef]) ws[totalRef].s = totalColStyle;
      }

      // Total row
      const totalRowIdx = emps.length + 2;
      for (let c = 0; c < totalCols; c++) {
        const ref = encodeCell({ r: totalRowIdx, c });
        if (ws[ref]) ws[ref].s = totalRowStyle;
      }

      // Merge title row across all columns
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

      // Column widths
      ws["!cols"] = [
        { wch: 22 }, { wch: 8 },
        ...dates.map(() => ({ wch: 12 })),
        { wch: 11 },
      ];

      // Row heights
      ws["!rows"] = [
        { hpt: 32 },
        { hpt: 36 },
        ...emps.map(() => ({ hpt: 50 })),
        { hpt: 22 },
      ];

      const sheetName = workshopName.slice(0, 31);
      XLSXStyle.utils.book_append_sheet(wb, ws, sheetName);
    }

    const filename = `تقرير_الحضور_${dateFrom}_${dateTo}.xlsx`;
    XLSXStyle.writeFile(wb, filename);
  }

  function exportGrantsReportToExcel() {
    if (!grantsReportData.length) return;

    const border = {
      top:    { style: "thin" as const, color: { rgb: "D1D5DB" } },
      bottom: { style: "thin" as const, color: { rgb: "D1D5DB" } },
      left:   { style: "thin" as const, color: { rgb: "D1D5DB" } },
      right:  { style: "thin" as const, color: { rgb: "D1D5DB" } },
    };
    const centerAlign = { horizontal: "center" as const, vertical: "center" as const, readingOrder: 2 };
    const rightAlign  = { horizontal: "right"  as const, vertical: "center" as const, readingOrder: 2 };

    const headerStyle = {
      fill: { fgColor: { rgb: "1E3A5F" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
      alignment: centerAlign, border,
    };
    const titleStyle = {
      fill: { fgColor: { rgb: "1E3A5F" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      alignment: centerAlign, border,
    };
    const approvedStyle = {
      fill: { fgColor: { rgb: "DCFCE7" } },
      font: { color: { rgb: "15803D" }, sz: 10 },
      alignment: centerAlign, border,
    };
    const cancelledStyle = {
      fill: { fgColor: { rgb: "FEE2E2" } },
      font: { color: { rgb: "DC2626" }, sz: 10 },
      alignment: centerAlign, border,
    };
    const nameStyle = { font: { sz: 10 }, alignment: rightAlign, border };
    const totalRowStyle = {
      fill: { fgColor: { rgb: "E5E7EB" } },
      font: { bold: true, sz: 10 },
      alignment: centerAlign, border,
    };

    const totalFinal = grantsReportData.reduce((s, r) => s + r.finalAmount, 0);
    const selectedGrantName = grantsGrantId === "all"
      ? "كل المنح"
      : (allGrants.find(g => g.id === grantsGrantId)?.name ?? grantsGrantId);

    const headers = ["اسم الموظف", "الرقم", "الورشة", "اسم المنحة", "النوع", "المبلغ الأساسي", "المبلغ المحسوب", "الحالة"];

    const aoa: (string | number)[][] = [
      [`تقرير المنح — ${grantsMonth} — ${selectedGrantName}`, ...Array(headers.length - 1).fill("")],
      headers,
      ...grantsReportData.map(r => [
        r.employeeName, r.employeeCode, r.workshopName, r.grantName,
        r.grantType === "grant" ? "منحة" : "عقوبة",
        r.baseAmount, r.finalAmount,
        r.cancelled ? "ملغى" : "مقبول",
      ]),
      ["الإجمالي", "", "", "", "", "", totalFinal, ""],
    ];

    const ws = XLSXStyle.utils.aoa_to_sheet(aoa);

    const encodeCell = XLSXStyle.utils.encode_cell;
    const totalCols = headers.length;

    // Title row style
    for (let c = 0; c < totalCols; c++) {
      const ref = encodeCell({ r: 0, c });
      if (ws[ref]) ws[ref].s = titleStyle;
    }
    // Header row style
    for (let c = 0; c < totalCols; c++) {
      const ref = encodeCell({ r: 1, c });
      if (ws[ref]) ws[ref].s = headerStyle;
    }
    // Data rows
    for (let i = 0; i < grantsReportData.length; i++) {
      const r = i + 2;
      const row = grantsReportData[i];
      for (let c = 0; c < totalCols; c++) {
        const ref = encodeCell({ r, c });
        if (!ws[ref]) continue;
        if (c === 0) ws[ref].s = nameStyle;
        else if (c === 7) ws[ref].s = row.cancelled ? cancelledStyle : approvedStyle;
        else ws[ref].s = { font: { sz: 10 }, alignment: centerAlign, border };
      }
    }
    // Total row
    const totalRow = grantsReportData.length + 2;
    for (let c = 0; c < totalCols; c++) {
      const ref = encodeCell({ r: totalRow, c });
      if (ws[ref]) ws[ref].s = totalRowStyle;
    }

    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];
    ws["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
    ws["!rows"] = [{ hpt: 30 }, { hpt: 22 }, ...grantsReportData.map(() => ({ hpt: 20 })), { hpt: 22 }];

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "تقرير المنح");
    XLSXStyle.writeFile(wb, `تقرير_المنح_${grantsMonth}.xlsx`);
  }

  const breadcrumb = selectedWorkshop
    ? `${selectedRule?.name} ← ${selectedWorkshop.name}`
    : selectedRule
    ? selectedRule.name
    : null;

  return (
    <div dir="rtl">
      <PageHeader
        title="التقارير"
        breadcrumb={
          breadcrumb ? (
            <>
              <button
                className="text-primary hover:underline"
                onClick={() => { setSelectedWorkshop(null); setSelectedRule(null); }}
              >
                الفترات
              </button>
              {selectedRule && !selectedWorkshop && (
                <span className="flex items-center gap-1">
                  <span>←</span>
                  <span className="text-foreground font-medium">{selectedRule.name}</span>
                </span>
              )}
              {selectedWorkshop && (
                <span className="flex items-center gap-1">
                  <span>←</span>
                  <button className="text-primary hover:underline" onClick={() => setSelectedWorkshop(null)}>
                    {selectedRule?.name}
                  </button>
                  <span>←</span>
                  <span className="text-foreground font-medium">{selectedWorkshop.name}</span>
                </span>
              )}
            </>
          ) : undefined
        }
        subtitle={!breadcrumb ? "اختر فترة عمل لعرض التقرير" : undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border overflow-hidden text-xs">
              {(["day", "week", "month", "year"] as DateMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleDateMode(m)}
                  className={`px-3 py-1.5 transition-colors ${dateMode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  data-testid={`button-mode-${m}`}
                >
                  {m === "day" ? "يوم" : m === "week" ? "أسبوع" : m === "month" ? "شهر" : "سنة"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Input type="date" className="h-8 w-36 text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} data-testid="input-date-from" />
              <span className="text-xs text-muted-foreground">إلى</span>
              <Input type="date" className="h-8 w-36 text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} data-testid="input-date-to" />
            </div>
            {selectedRule && reportData.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={exportReportToExcel}
                className="h-8 text-xs gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950/30"
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                تصدير Excel
              </Button>
            )}
          </div>
        }
      />
      <div className="p-6 space-y-5 max-w-6xl mx-auto">

      {/* ======================== LEVEL 1: Work Rule Cards ======================== */}
      {!selectedRule && viewMode === "shifts" && (
        rulesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full" /><Skeleton className="h-44 w-full" />
          </div>
        ) : workRules.length === 0 ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
                <p>لا توجد فترات عمل مُعرَّفة. أضف فترات من صفحة قواعد العمل.</p>
              </CardContent>
            </Card>
            <Card
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all bg-indigo-50/40 dark:bg-indigo-950/20"
              onClick={() => { setViewMode("overtime"); setSelectedRule(null); setSelectedWorkshop(null); }}
              data-testid="card-overtime-empty"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-indigo-700 dark:text-indigo-400">
                  <Clock className="h-4 w-4" />
                  الساعات الإضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">عرض تقرير الساعات الإضافية لجميع الموظفين.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workRules.map((rule) => {
              const isEditing = editingRuleId === rule.id;
              const earlyArr = isEditing ? graceForm.earlyArrivalGraceMinutes : (rule.earlyArrivalGraceMinutes ?? 0);
              const lateArr = isEditing ? graceForm.lateGraceMinutes : (rule.lateGraceMinutes ?? 0);
              const earlyLv = isEditing ? graceForm.earlyLeaveGraceMinutes : (rule.earlyLeaveGraceMinutes ?? 0);
              const lateLv = isEditing ? graceForm.lateLeaveGraceMinutes : (rule.lateLeaveGraceMinutes ?? 0);

              const arrivalFrom = addMinutesToTime(rule.workStartTime, -earlyArr);
              const arrivalTo = addMinutesToTime(rule.workStartTime, lateArr);
              const departureFrom = addMinutesToTime(rule.workEndTime, -earlyLv);
              const departureTo = addMinutesToTime(rule.workEndTime, lateLv);

              const empCount = getEmpCountForRule(rule);

              return (
                <Card
                  key={rule.id}
                  className={`border-2 transition-all ${isEditing ? "border-primary shadow-md" : "hover:border-primary/50 hover:shadow-md"}`}
                  data-testid={`card-rule-${rule.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`p-1.5 rounded-md ${rule.name.includes("صباح") ? "bg-amber-100 dark:bg-amber-950/50" : rule.name.includes("مساء") ? "bg-indigo-100 dark:bg-indigo-950/50" : "bg-primary/10"}`}>
                          {rule.name.includes("صباح") ? (
                            <Sun className="h-4 w-4 text-amber-500" />
                          ) : rule.name.includes("مساء") ? (
                            <Moon className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <Star className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span>{rule.name}</span>
                        {rule.isDefault && <Badge variant="secondary" className="text-xs">افتراضية</Badge>}
                      </CardTitle>
                      <div className="flex gap-1">
                        {isEditing ? (
                          <>
                            <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveGrace(rule.id)} disabled={updateRuleMutation.isPending} data-testid={`button-save-grace-${rule.id}`}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setEditingRuleId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); startEditGrace(rule); }} data-testid={`button-edit-grace-${rule.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-mono">{rule.workStartTime} — {rule.workEndTime}</span>
                      </div>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Users className="h-3 w-3" />{empCount} موظف
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    {/* Grace windows */}
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">نافذة المهلة</p>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-xs">وصول مبكر (دق)</Label>
                            <Input type="number" min="0" className="h-7 text-xs" value={graceForm.earlyArrivalGraceMinutes}
                              onChange={(e) => setGraceForm(f => ({ ...f, earlyArrivalGraceMinutes: parseInt(e.target.value) || 0 }))}
                              data-testid={`input-early-arrival-${rule.id}`} />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-xs">تأخر وصول مقبول (دق)</Label>
                            <Input type="number" min="0" className="h-7 text-xs" value={graceForm.lateGraceMinutes}
                              onChange={(e) => setGraceForm(f => ({ ...f, lateGraceMinutes: parseInt(e.target.value) || 0 }))}
                              data-testid={`input-late-grace-${rule.id}`} />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-xs">خروج مبكر مقبول (دق)</Label>
                            <Input type="number" min="0" className="h-7 text-xs" value={graceForm.earlyLeaveGraceMinutes}
                              onChange={(e) => setGraceForm(f => ({ ...f, earlyLeaveGraceMinutes: parseInt(e.target.value) || 0 }))}
                              data-testid={`input-early-leave-${rule.id}`} />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-xs">تأخر خروج مقبول (دق)</Label>
                            <Input type="number" min="0" className="h-7 text-xs" value={graceForm.lateLeaveGraceMinutes}
                              onChange={(e) => setGraceForm(f => ({ ...f, lateLeaveGraceMinutes: parseInt(e.target.value) || 0 }))}
                              data-testid={`input-late-leave-${rule.id}`} />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">الوصول:</span>
                            <span className="font-mono text-foreground">{arrivalFrom} ← {arrivalTo}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">المغادرة:</span>
                            <span className="font-mono text-foreground">{departureFrom} ← {departureTo}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <Button
                        variant="outline"
                        className="w-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
                        onClick={() => { setSelectedRule(rule); setSelectedWorkshop(null); }}
                        data-testid={`button-open-rule-${rule.id}`}
                      >
                        <span>عرض الورشات والتقرير</span>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {/* Overtime card */}
            <Card
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all bg-indigo-50/40 dark:bg-indigo-950/20"
              onClick={() => { setViewMode("overtime"); setSelectedRule(null); setSelectedWorkshop(null); }}
              data-testid="card-overtime"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-indigo-700 dark:text-indigo-400">
                  <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950/50">
                    <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  الساعات الإضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">عرض العمال الذين عملوا ساعات إضافية خارج فترتهم في النطاق الزمني المحدد.</p>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* ======================== OVERTIME VIEW ======================== */}
      {!selectedRule && viewMode === "overtime" && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between print:hidden">
            <Button variant="ghost" size="sm" className="gap-1 -mt-2" onClick={() => setViewMode("shifts")} data-testid="button-back-to-shifts">
              <ChevronLeft className="h-4 w-4 rotate-180" />
              العودة للفترات
            </Button>
            <Button
              variant="outline" size="sm"
              className="gap-1.5"
              onClick={() => window.print()}
              data-testid="button-print-overtime"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
          </div>

          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            تقرير الساعات الإضافية
          </h2>

          {overtimeLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : employeesWithOvertime.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <Clock className="h-12 w-12 mb-3 opacity-30" />
                <p>لا يوجد موظفون عملوا ساعات إضافية في هذه الفترة</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Week navigation — screen only */}
              {overtimeWeeks.length > 1 && (
                <div className="flex items-center justify-center gap-3 print:hidden">
                  <Button
                    variant="outline" size="icon"
                    className="h-8 w-8"
                    disabled={safeWeekIndex === 0}
                    onClick={() => setOvertimeWeekIndex(i => Math.max(0, i - 1))}
                    data-testid="button-overtime-prev-week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground">
                    الأسبوع {safeWeekIndex + 1} من {overtimeWeeks.length}
                  </span>
                  <Button
                    variant="outline" size="icon"
                    className="h-8 w-8"
                    disabled={safeWeekIndex === overtimeWeeks.length - 1}
                    onClick={() => setOvertimeWeekIndex(i => Math.min(overtimeWeeks.length - 1, i + 1))}
                    data-testid="button-overtime-next-week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* ---- Screen table: current week only ---- */}
              <div className="overflow-x-auto rounded-lg border print:hidden" id="overtime-screen-table">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="sticky right-0 bg-muted/50 z-20 text-right font-bold">الموظف</TableHead>
                      <TableHead className="text-center font-bold text-xs">الرقم</TableHead>
                      <TableHead className="text-center font-bold text-xs min-w-[80px]">الورشة</TableHead>
                      {currentWeekDates.map(d => (
                        <TableHead key={d} className="text-center text-xs font-medium min-w-[52px] p-1">
                          <div className="text-muted-foreground text-[10px]">{getArabicDay(d)}</div>
                          <div>{d.slice(5).replace("-", "/")}</div>
                        </TableHead>
                      ))}
                      <TableHead className="sticky left-0 bg-muted/50 z-20 text-center font-bold border-r min-w-[70px]">المجموع (س)</TableHead>
                      <TableHead className="text-center font-bold text-xs min-w-[90px]">سعر الساعة</TableHead>
                      <TableHead className="text-center font-bold text-xs min-w-[100px]">المبلغ الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overtimeWorkshopGroups.map(({ workshopName: wsName, employees: wsEmps }) => {
                      const wsOT = wsEmps.reduce((s, r) => s + r.dailyRecords.reduce((rs, rec) => rs + (rec.overtimeHours || 0), 0), 0);
                      const wsPay = wsEmps.reduce((r, emp) => r + (parseFloat(emp.hourlyRate || "0") * emp.dailyRecords.reduce((s, rec) => s + (rec.overtimeHours || 0), 0)), 0);
                      const screenColSpan = 3 + currentWeekDates.length + 3;
                      return [
                        <TableRow key={`ws-header-${wsName}`} className="bg-indigo-50 dark:bg-indigo-950/40">
                          <TableCell colSpan={screenColSpan} className="font-bold text-indigo-700 dark:text-indigo-300 py-1.5 text-sm">
                            ▶ {wsName}
                          </TableCell>
                        </TableRow>,
                        ...wsEmps.map(r => {
                          const byDate = overtimeDayMap.get(r.employeeId);
                          const totalOT = r.dailyRecords.reduce((s, rec) => s + (rec.overtimeHours || 0), 0);
                          const rate = parseFloat(r.hourlyRate || "0");
                          const totalPay = totalOT * rate;
                          return (
                            <TableRow key={r.employeeId} data-testid={`row-overtime-${r.employeeId}`}>
                              <TableCell className="font-medium sticky right-0 bg-background z-10">{r.employeeName}</TableCell>
                              <TableCell className="text-muted-foreground text-xs text-center">{r.employeeCode}</TableCell>
                              <TableCell className="text-xs text-center text-muted-foreground">{r.workshopName || "—"}</TableCell>
                              {currentWeekDates.map(d => {
                                const rec = byDate?.get(d);
                                const ot = rec?.overtimeHours ?? 0;
                                const pendingHoliday = rec?.pending && rec?.status === "holiday" && !!rec?.checkIn;
                                return (
                                  <TableCell key={d} className="text-center px-1">
                                    {ot > 0 ? (
                                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
                                        title={`دخول: ${rec?.checkIn ?? "—"} | خروج: ${rec?.checkOut ?? "—"}`}>
                                        {ot % 1 === 0 ? ot.toFixed(0) : ot.toFixed(1)}
                                      </span>
                                    ) : pendingHoliday ? (
                                      <span className="text-xs text-amber-500 font-semibold"
                                        title={`دخول: ${rec?.checkIn ?? "—"} | لم يسجّل الخروج بعد`}>؟</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center font-bold sticky left-0 bg-background z-10 border-r">
                                <span className="text-sm text-indigo-700 dark:text-indigo-400">{Math.round(totalOT * 10) / 10}</span>
                              </TableCell>
                              <TableCell className="text-center text-xs p-1">
                                {isOwner && editingRate?.employeeId === r.employeeId ? (
                                  <div className="flex items-center gap-0.5 justify-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className="h-6 w-20 text-xs text-center px-1"
                                      value={editingRate.value}
                                      autoFocus
                                      onChange={e => setEditingRate({ employeeId: r.employeeId, value: e.target.value })}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") commitRate(r.employeeId, editingRate.value);
                                        if (e.key === "Escape") { rateEscapedRef.current = true; setEditingRate(null); }
                                      }}
                                      onBlur={() => {
                                        if (rateEscapedRef.current) { rateEscapedRef.current = false; return; }
                                        commitRate(r.employeeId, editingRate.value);
                                      }}
                                      data-testid={`input-hourly-rate-${r.employeeId}`}
                                    />
                                  </div>
                                ) : isOwner ? (
                                  <button
                                    type="button"
                                    className="group flex items-center gap-1 justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                                    title="انقر لتعديل سعر الساعة"
                                    onClick={() => setEditingRate({ employeeId: r.employeeId, value: r.hourlyRate || "0" })}
                                    data-testid={`button-edit-rate-${r.employeeId}`}
                                  >
                                    <span>{rate > 0 ? formatDZD(rate) : "—"}</span>
                                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground">{rate > 0 ? formatDZD(rate) : "—"}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                {rate > 0 && totalOT > 0 ? formatDZD(totalPay) : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        }),
                        <TableRow key={`ws-total-${wsName}`} className="bg-muted/30 border-t">
                          <TableCell className="sticky right-0 bg-muted/30 z-10 text-xs font-bold text-muted-foreground">إجمالي {wsName}</TableCell>
                          <TableCell />
                          <TableCell />
                          {currentWeekDates.map(d => {
                            const dayTotal = wsEmps.reduce((s, emp) => {
                              const rec = overtimeDayMap.get(emp.employeeId)?.get(d);
                              return s + (rec?.overtimeHours ?? 0);
                            }, 0);
                            return (
                              <TableCell key={d} className="text-center text-xs font-bold">
                                {dayTotal > 0 ? <span className="text-indigo-600 dark:text-indigo-400">{Math.round(dayTotal * 10) / 10}</span> : "—"}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-bold text-indigo-700 dark:text-indigo-400 sticky left-0 bg-muted/30 z-10 border-r text-xs">
                            {Math.round(wsOT * 10) / 10}
                          </TableCell>
                          <TableCell />
                          <TableCell className="text-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            {wsPay > 0 ? formatDZD(wsPay) : "—"}
                          </TableCell>
                        </TableRow>,
                      ];
                    })}
                    {/* Grand totals row */}
                    <TableRow className="bg-muted/50 font-bold border-t-2">
                      <TableCell className="sticky right-0 bg-muted/50 z-10 font-bold">الإجمالي الكلي</TableCell>
                      <TableCell />
                      <TableCell />
                      {currentWeekDates.map(d => {
                        const dayTotal = employeesWithOvertime.reduce((s, emp) => {
                          const rec = overtimeDayMap.get(emp.employeeId)?.get(d);
                          return s + (rec?.overtimeHours ?? 0);
                        }, 0);
                        return (
                          <TableCell key={d} className="text-center text-xs font-bold">
                            {dayTotal > 0 ? <span className="text-indigo-700 dark:text-indigo-400">{Math.round(dayTotal * 10) / 10}</span> : "—"}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold text-indigo-700 dark:text-indigo-400 sticky left-0 bg-muted/50 z-10 border-r">
                        {Math.round(employeesWithOvertime.reduce((s, r) => s + r.dailyRecords.reduce((rs, rec) => rs + (rec.overtimeHours || 0), 0), 0) * 10) / 10}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-center font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                        {formatDZD(employeesWithOvertime.reduce((s, r) => {
                          const rate = parseFloat(r.hourlyRate || "0");
                          const ot = r.dailyRecords.reduce((rs, rec) => rs + (rec.overtimeHours || 0), 0);
                          return s + rate * ot;
                        }, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* ---- Print table: ALL dates, hidden on screen ---- */}
              <div className="hidden print:block" id="overtime-print-table">
                {/* عنوان الجدول */}
                <div className="print-title">
                  <div className="print-title-main">جدول الساعات الإضافية</div>
                  <div className="print-title-sub">
                    الفترة: {dateFrom?.slice(5).replace("-", "/")}/{dateFrom?.slice(0,4)} — {dateTo?.slice(5).replace("-", "/")}/{dateTo?.slice(0,4)}
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right font-bold">الموظف</TableHead>
                      <TableHead className="text-center font-bold">الرقم</TableHead>
                      <TableHead className="text-center font-bold">الورشة</TableHead>
                      {allOvertimeDates.map(d => (
                        <TableHead key={d} className="text-center font-medium p-0.5">
                          {d.slice(5).replace("-", "/")}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold">المجموع</TableHead>
                      <TableHead className="text-center font-bold">سعر/س</TableHead>
                      <TableHead className="text-center font-bold">المبلغ (د.ج)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overtimeWorkshopGroups.map(({ workshopName: wsName, employees: wsEmps }) => {
                      const printColSpan = 3 + allOvertimeDates.length + 3;
                      const wsOT = wsEmps.reduce((s, r) => s + r.dailyRecords.reduce((rs, rec) => rs + (rec.overtimeHours || 0), 0), 0);
                      const wsPay = wsEmps.reduce((s, r) => s + parseFloat(r.hourlyRate || "0") * r.dailyRecords.reduce((rs, rec) => rs + (rec.overtimeHours || 0), 0), 0);
                      return [
                        <TableRow key={`ws-ph-${wsName}`} className="print-ws-header">
                          <TableCell colSpan={printColSpan} className="font-bold">
                            ▶ {wsName}
                          </TableCell>
                        </TableRow>,
                        ...wsEmps.map(r => {
                          const byDate = overtimeDayMap.get(r.employeeId);
                          const totalOT = r.dailyRecords.reduce((s, rec) => s + (rec.overtimeHours || 0), 0);
                          const rate = parseFloat(r.hourlyRate || "0");
                          const totalPay = totalOT * rate;
                          return (
                            <TableRow key={r.employeeId}>
                              <TableCell className="font-medium text-right">{r.employeeName}</TableCell>
                              <TableCell className="text-center">{r.employeeCode}</TableCell>
                              <TableCell className="text-center">{r.workshopName || "—"}</TableCell>
                              {allOvertimeDates.map(d => {
                                const rec = byDate?.get(d);
                                const ot = rec?.overtimeHours ?? 0;
                                const pendingHoliday = rec?.pending && rec?.status === "holiday" && !!rec?.checkIn;
                                return (
                                  <TableCell key={d} className="text-center">
                                    {ot > 0 ? (ot % 1 === 0 ? ot.toFixed(0) : ot.toFixed(1))
                                      : pendingHoliday ? "؟" : "—"}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center font-bold">{Math.round(totalOT * 10) / 10}</TableCell>
                              <TableCell className="text-center">{rate > 0 ? rate.toFixed(2) : "—"}</TableCell>
                              <TableCell className="text-center font-bold">{rate > 0 && totalOT > 0 ? totalPay.toFixed(2) : "—"}</TableCell>
                            </TableRow>
                          );
                        }),
                        <TableRow key={`ws-pt-${wsName}`} className="print-ws-subtotal">
                          <TableCell className="font-bold text-right" colSpan={3}>إجمالي {wsName}</TableCell>
                          {allOvertimeDates.map(d => {
                            const dayTotal = wsEmps.reduce((s, emp) => {
                              const rec = overtimeDayMap.get(emp.employeeId)?.get(d);
                              return s + (rec?.overtimeHours ?? 0);
                            }, 0);
                            return <TableCell key={d} className="text-center font-bold">{dayTotal > 0 ? Math.round(dayTotal * 10) / 10 : "—"}</TableCell>;
                          })}
                          <TableCell className="text-center font-bold">{Math.round(wsOT * 10) / 10}</TableCell>
                          <TableCell />
                          <TableCell className="text-center font-bold">{wsPay > 0 ? wsPay.toFixed(2) : "—"}</TableCell>
                        </TableRow>,
                      ];
                    })}
                    {/* Grand total */}
                    <TableRow className="print-grand-total">
                      <TableCell className="font-bold text-right" colSpan={3}>الإجمالي الكلي</TableCell>
                      {allOvertimeDates.map(d => {
                        const dayTotal = employeesWithOvertime.reduce((s, emp) => {
                          const rec = overtimeDayMap.get(emp.employeeId)?.get(d);
                          return s + (rec?.overtimeHours ?? 0);
                        }, 0);
                        return <TableCell key={d} className="text-center font-bold">{dayTotal > 0 ? Math.round(dayTotal * 10) / 10 : "—"}</TableCell>;
                      })}
                      <TableCell className="text-center font-bold">
                        {Math.round(employeesWithOvertime.reduce((s, r) => s + r.dailyRecords.reduce((rs, rec) => rs + (rec.overtimeHours || 0), 0), 0) * 10) / 10}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-center font-bold">
                        {employeesWithOvertime.reduce((s, r) => {
                          const rate = parseFloat(r.hourlyRate || "0");
                          const ot = r.dailyRecords.reduce((rs, rec) => rs + (rec.overtimeHours || 0), 0);
                          return s + rate * ot;
                        }, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================== LEVEL 2: Workshops in a Rule ======================== */}
      {selectedRule && !selectedWorkshop && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="gap-1 -mt-2" onClick={() => { setSelectedRule(null); setSelectedCompanyId("all"); }} data-testid="button-back-to-rules">
              <ChevronLeft className="h-4 w-4 rotate-180" />
              العودة للفترات
            </Button>

            {companies.length > 1 && (
              <div className="flex items-center gap-2 -mt-2">
                <span className="text-xs text-muted-foreground">تصفية بالشركة:</span>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="h-8 w-44 text-xs" data-testid="select-company-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الشركات</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {(() => {
            const ruleWorkshops = getWorkshopsForRule(selectedRule, selectedCompanyId);
            if (ruleWorkshops.length === 0) {
              return (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                    <Wrench className="h-10 w-10 mb-2 opacity-30" />
                    <p>لا توجد ورشات مرتبطة بهذه الفترة</p>
                  </CardContent>
                </Card>
              );
            }
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ruleWorkshops.map(({ workshop, count }) => (
                  <Card
                    key={workshop!.id}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                    onClick={() => setSelectedWorkshop(workshop!)}
                    data-testid={`card-workshop-${workshop!.id}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Wrench className="h-4 w-4 text-primary" />
                        </div>
                        {workshop!.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{count} موظف</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ======================== LEVEL 3: Employee Report ======================== */}
      {selectedRule && selectedWorkshop && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" className="gap-1 -mt-2" onClick={() => setSelectedWorkshop(null)} data-testid="button-back-to-workshops">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            العودة للورشات
          </Button>

          {/* Summary cards */}
          {!reportLoading && reportData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الموظفون</p>
                    <p className="text-xl font-bold">{reportData.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">أيام الحضور</p>
                    <p className="text-xl font-bold">{reportData.reduce((s, r) => s + r.presentDays + r.lateDays, 0)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">أيام التأخير</p>
                    <p className="text-xl font-bold">{reportData.reduce((s, r) => s + r.lateDays, 0)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">أيام الغياب</p>
                    <p className="text-xl font-bold">{reportData.reduce((s, r) => s + r.absentDays, 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Legend */}
          {!reportLoading && reportData.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
              <span className="font-medium">الألوان:</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 inline-block"></span> حاضر</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 inline-block"></span> متأخر</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 inline-block"></span> غائب</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 inline-block"></span> عطلة</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700 inline-block"></span> إجازة</span>
              <span className="mr-auto text-[10px] text-muted-foreground/70">انقر على أي خلية للتعديل</span>
            </div>
          )}

          {reportLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : reportData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
                <p>لا توجد بيانات حضور للفترة المحددة</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 bg-muted/30">
                        <TableHead className="text-right sticky right-0 bg-muted/30 z-10 min-w-[130px] font-bold">الموظف</TableHead>
                        <TableHead className="text-center min-w-[60px] font-bold text-xs">الرقم</TableHead>
                        {allDates.map((d) => {
                          const isWeekend = [5, 6].includes(new Date(d + "T00:00:00").getDay());
                          return (
                            <TableHead key={d} className={`text-center min-w-[76px] px-0.5 py-1 ${isWeekend ? "bg-blue-50/80 dark:bg-blue-950/20" : ""}`}>
                              <div className="text-[10px] text-muted-foreground leading-tight">{getArabicDay(d)}</div>
                              <div className="text-xs font-mono font-medium leading-tight">{d.slice(5).replace("-", "/")}</div>
                            </TableHead>
                          );
                        })}
                        <TableHead className="text-center min-w-[90px] font-bold bg-muted/30 sticky left-0 z-10">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((r) => {
                        const byDate = empDayMap.get(r.employeeId);
                        return (
                          <TableRow key={r.employeeId} data-testid={`row-report-${r.employeeId}`} className="hover:bg-transparent">
                            <TableCell className="font-medium sticky right-0 bg-background z-10 border-l">{r.employeeName}</TableCell>
                            <TableCell className="text-muted-foreground text-xs text-center">{r.employeeCode}</TableCell>
                            {allDates.map((d) => {
                              const rec = byDate?.get(d);
                              if (!rec) {
                                const syntheticRec: DailyRecord = {
                                  attendanceId: null, date: d, checkIn: null, checkOut: null,
                                  normalizedCheckIn: null, normalizedCheckOut: null, status: "absent",
                                  lateMinutes: 0, earlyLeaveMinutes: 0, effectiveLateMinutes: 0,
                                  effectiveEarlyLeaveMinutes: 0, totalHours: null, dailyScore: 0,
                                  pending: false, overtimeHours: 0,
                                };
                                const frozenEmpty = isOwner && isCellFrozen(d, r.workshopId, r.workRuleId);
                                return (
                                  <TableCell key={d} className="p-0">
                                    <button
                                      className={`w-full min-h-[52px] flex items-center justify-center text-muted-foreground text-xs transition-colors ${isOwner && !frozenEmpty ? "cursor-pointer hover:bg-muted/40" : "cursor-default"}`}
                                      onClick={() => openEditCell(r, d, syntheticRec)}
                                      data-testid={`button-edit-cell-${r.employeeId}-${d}`}
                                    >
                                      {frozenEmpty ? <Lock className="h-3 w-3 text-muted-foreground/40" /> : "—"}
                                    </button>
                                  </TableCell>
                                );
                              }

                              const frozen = isOwner && isCellFrozen(d, r.workshopId, r.workRuleId);
                              const bgClass = getCellBg(rec.status);
                              const scoreColorClass = getCellScoreColor(rec.status, rec.dailyScore);

                              return (
                                <TableCell key={d} className="p-0" data-testid={`cell-${r.employeeId}-${d}`}>
                                  <button
                                    className={`w-full min-h-[52px] px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${bgClass} ${isOwner && !frozen ? "cursor-pointer" : "cursor-default"}`}
                                    onClick={() => openEditCell(r, d, rec)}
                                    title={frozen ? `${r.employeeName} — ${d}\nالشهر مجمّد في الأرشيف` : `${r.employeeName} — ${d}\nالحالة: ${rec.status}\nدخول: ${rec.checkIn ?? "—"} | خروج: ${rec.checkOut ?? "—"}`}
                                    data-testid={`button-edit-cell-${r.employeeId}-${d}`}
                                  >
                                    {frozen && (
                                      <Lock className="h-3 w-3 text-muted-foreground/50 mb-0.5" />
                                    )}
                                    {rec.status === "absent" ? (
                                      <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                                    ) : rec.status === "rest" ? (
                                      <>
                                        <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">راحة</span>
                                      </>
                                    ) : rec.status === "leave" ? (
                                      <span className={`text-xs font-bold ${scoreColorClass}`}>إجازة</span>
                                    ) : rec.status === "holiday" ? (
                                      <>
                                        <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                                        {rec.checkIn && (
                                          <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono"><span className="text-green-600 dark:text-green-400 font-bold not-italic">د:</span>{rec.checkIn}</span>
                                        )}
                                      </>
                                    ) : rec.pending ? (
                                      <>
                                        <span className="text-base font-bold text-amber-500 dark:text-amber-400">؟</span>
                                        <span className="text-[10px] font-mono text-muted-foreground leading-none"><span className="text-green-600 dark:text-green-400 font-bold">د:</span>{rec.checkIn}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                                        {rec.checkIn && (
                                          <span className="text-[10px] font-mono text-muted-foreground leading-none"><span className="text-green-600 dark:text-green-400 font-bold">د:</span>{rec.checkIn}</span>
                                        )}
                                        {rec.checkOut && (
                                          <span className="text-[10px] font-mono text-muted-foreground leading-none"><span className="text-red-500 dark:text-red-400 font-bold">خ:</span>{rec.checkOut}</span>
                                        )}
                                      </>
                                    )}
                                  </button>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-bold bg-muted/10 sticky left-0 z-10 border-r">
                              {(() => {
                                const bonus = r.monthBonus ?? 0;
                                const displayScore = r.attendanceScore + bonus;
                                const denominator = r.normalizedTotalDays ?? r.totalDays;
                                return (
                                  <>
                                    <span className={`text-sm ${scoreColor(displayScore, denominator)}`} data-testid={`score-${r.employeeId}`}>
                                      {Number.isInteger(displayScore) ? displayScore.toFixed(0) : displayScore.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-muted-foreground mr-1">/{denominator}</span>
                                  </>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Totals row */}
                      <TableRow className="bg-muted/50 font-bold border-t-2">
                        <TableCell className="sticky right-0 bg-muted/50 z-10 border-l">المجموع</TableCell>
                        <TableCell />
                        {allDates.map((d) => {
                          const dayTotal = dateTotals.get(d) ?? 0;
                          return (
                            <TableCell key={d} className="text-center text-xs px-1 py-2">
                              <span className={scoreColor(dayTotal, reportData.length)}>
                                {dayTotal.toFixed(2)}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center sticky left-0 bg-muted/50 z-10 border-r">
                          <span className={`text-sm ${scoreColor(totalScore, maxScore)}`}>
                            {totalScore.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground mr-1">/{maxScore}</span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Monthly Trend Chart */}
          {selectedRule && selectedWorkshop && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: "hsl(271 76% 45%)" }} />
                  تطور الحضور — آخر 6 أشهر
                  <span className="text-xs font-normal text-muted-foreground">({selectedWorkshop.name})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {trendLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        width={38}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value}%`, name]}
                        contentStyle={{
                          fontSize: "12px",
                          direction: "rtl",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--background))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "11px", paddingTop: "6px", direction: "rtl" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="presentRate"
                        name="نسبة الحضور %"
                        stroke="hsl(160 70% 38%)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(160 70% 38%)" }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="absentRate"
                        name="نسبة الغياب %"
                        stroke="hsl(0 72% 51%)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(0 72% 51%)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات كافية</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ======================== GRANTS REPORT SECTION ======================== */}
      {isOwnerOrAttendence && (
        <div className="space-y-4 mt-6 mx-4 mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-lg font-bold">تقرير المنح والعقوبات</h2>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">الشهر</Label>
                  <Select value={grantsMonth} onValueChange={v => { setGrantsMonth(v); setGrantsEnabled(false); }}>
                    <SelectTrigger className="w-44" data-testid="select-grants-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">المنحة / العقوبة</Label>
                  <Select value={grantsGrantId} onValueChange={v => { setGrantsGrantId(v); setGrantsEnabled(false); }}>
                    <SelectTrigger className="w-52" data-testid="select-grants-grant">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المنح والعقوبات</SelectItem>
                      {allGrants.filter(g => g.type === "grant").length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-bold text-green-600 dark:text-green-400">المنح</div>
                          {allGrants.filter(g => g.type === "grant").map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </>
                      )}
                      {allGrants.filter(g => g.type === "penalty").length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-bold text-red-600 dark:text-red-400">العقوبات</div>
                          {allGrants.filter(g => g.type === "penalty").map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setGrantsEnabled(true)}
                  disabled={grantsReportLoading}
                  data-testid="button-compute-grants-report"
                >
                  {grantsReportLoading ? "جاري الحساب..." : "احتساب التقرير"}
                </Button>
                {grantsReportData.length > 0 && (
                  <Button variant="outline" className="gap-1.5" onClick={exportGrantsReportToExcel} data-testid="button-export-grants-excel">
                    <FileSpreadsheet className="h-4 w-4" />
                    تصدير Excel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {grantsEnabled && !grantsReportLoading && grantsReportData.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-10 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mb-3 opacity-20" />
                <p>لا توجد بيانات — تأكد من تعريف منح وموظفين مستهدفين</p>
              </CardContent>
            </Card>
          )}

          {grantsReportData.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right font-bold">اسم الموظف</TableHead>
                      <TableHead className="text-center font-bold">الرقم</TableHead>
                      <TableHead className="text-right font-bold">الورشة</TableHead>
                      <TableHead className="text-right font-bold">المنحة</TableHead>
                      <TableHead className="text-center font-bold">النوع</TableHead>
                      <TableHead className="text-center font-bold">المبلغ الأساسي</TableHead>
                      <TableHead className="text-center font-bold">المبلغ المحسوب</TableHead>
                      <TableHead className="text-center font-bold">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grantsReportData.map((row, i) => (
                      <TableRow
                        key={`${row.grantId}-${row.employeeId}`}
                        className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        data-testid={`row-grant-${i}`}
                      >
                        <TableCell className="font-medium">{row.employeeName}</TableCell>
                        <TableCell className="text-center font-mono text-xs">{row.employeeCode}</TableCell>
                        <TableCell>{row.workshopName || "—"}</TableCell>
                        <TableCell>{row.grantName}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={row.grantType === "grant"
                            ? "border-green-300 text-green-700 dark:text-green-400"
                            : "border-red-300 text-red-700 dark:text-red-400"}>
                            {row.grantType === "grant" ? "منحة" : "عقوبة"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">{row.baseAmount.toFixed(2)} د.ج</TableCell>
                        <TableCell className="text-center font-bold">
                          {row.cancelled ? "—" : `${row.finalAmount.toFixed(2)} د.ج`}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.cancelled ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 gap-1 border-0" data-testid={`status-cancelled-${i}`}>
                              <X className="h-3 w-3" /> ملغى
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 gap-1 border-0" data-testid={`status-approved-${i}`}>
                              <Check className="h-3 w-3" /> مقبول
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* صف الإجمالي */}
                    <TableRow className="bg-muted font-bold border-t-2">
                      <TableCell colSpan={6} className="text-right">
                        الإجمالي ({grantsReportData.filter(r => !r.cancelled).length} موظف مقبول)
                      </TableCell>
                      <TableCell className="text-center text-primary font-bold" data-testid="text-grants-total">
                        {grantsReportData.reduce((s, r) => s + r.finalAmount, 0).toFixed(2)} د.ج
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ======================== EDIT ATTENDANCE DIALOG ======================== */}
      <Dialog open={!!editCell} onOpenChange={(open) => { if (!open) setEditCell(null); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل سجل الحضور</DialogTitle>
            <DialogDescription>
              {editCell && (
                <span>
                  <span className="font-semibold text-foreground">{editCell.employeeName}</span>
                  {" — "}
                  <span className="font-mono">{editCell.date}</span>
                  {" ("}
                  <span>{editCell.date ? getArabicDay(editCell.date) : ""}</span>
                  {")"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>الحالة</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="late">متأخر</SelectItem>
                  <SelectItem value="absent">غائب</SelectItem>
                  <SelectItem value="leave">إجازة</SelectItem>
                  <SelectItem value="rest">يوم راحة (مناوبة 24 ساعة)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>وقت الدخول</Label>
                <Input
                  type="time"
                  value={editForm.checkIn}
                  onChange={(e) => setEditForm(f => ({ ...f, checkIn: e.target.value }))}
                  data-testid="input-checkin"
                  disabled={editForm.status === "absent" || editForm.status === "leave" || editForm.status === "rest"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>وقت الخروج</Label>
                <Input
                  type="time"
                  value={editForm.checkOut}
                  onChange={(e) => setEditForm(f => ({ ...f, checkOut: e.target.value }))}
                  data-testid="input-checkout"
                  disabled={editForm.status === "absent" || editForm.status === "leave" || editForm.status === "rest"}
                />
              </div>
            </div>

            {editCell?.record.attendanceId && (
              <p className="text-xs text-muted-foreground">
                رقم السجل: <span className="font-mono">{editCell.record.attendanceId}</span>
              </p>
            )}
            {!editCell?.record.attendanceId && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                لا يوجد سجل في قاعدة البيانات — سيتم إنشاء سجل جديد عند الحفظ.
              </p>
            )}
          </div>

          <DialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
            {editCell?.record.attendanceId && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 ml-auto"
                onClick={handleDeleteAttendance}
                disabled={deleteAttendanceMutation.isPending}
                data-testid="button-delete-attendance"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف السجل
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditCell(null)} data-testid="button-cancel-edit">
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAttendance}
              disabled={saveAttendanceMutation.isPending}
              data-testid="button-save-attendance"
            >
              {saveAttendanceMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
