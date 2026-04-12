import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight, Calendar, Pencil, Trash2, Plus, Clock, User, Building2,
  CreditCard, CheckCircle2, XCircle, AlarmClock, Umbrella, Timer, FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Employee, Workshop, Position } from "@shared/schema";

type DateMode = "day" | "week" | "month";

interface DailyRecord {
  attendanceId: string | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  effectiveLateMinutes: number;
  totalHours: string | null;
  dailyScore: number;
}

interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  workshopId: string;
  workshopName: string;
  dailyRecords: DailyRecord[];
  attendanceScore: number;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, hsl(271 76% 45%), hsl(280 70% 55%))",
    "linear-gradient(135deg, hsl(43 96% 48%), hsl(36 90% 55%))",
    "linear-gradient(135deg, hsl(160 70% 38%), hsl(155 65% 48%))",
    "linear-gradient(135deg, hsl(220 80% 50%), hsl(230 75% 60%))",
    "linear-gradient(135deg, hsl(320 70% 48%), hsl(330 65% 58%))",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getArabicDay(dateStr: string) {
  return ARABIC_DAYS[new Date(dateStr + "T00:00:00").getDay()];
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

function statusLabel(status: string) {
  const map: Record<string, string> = {
    present: "حاضر", late: "متأخر", absent: "غائب",
    leave: "إجازة", holiday: "عطلة", rest: "راحة",
  };
  return map[status] ?? status;
}

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "present") return "default";
  if (status === "late") return "secondary";
  if (status === "absent") return "destructive";
  return "outline";
}

function statusRowClass(status: string): string {
  if (status === "absent") return "bg-red-50 dark:bg-red-950/20";
  if (status === "late") return "bg-amber-50 dark:bg-amber-950/20";
  if (status === "leave") return "bg-purple-50 dark:bg-purple-950/20";
  if (status === "holiday") return "bg-blue-50 dark:bg-blue-950/20";
  if (status === "rest") return "bg-slate-50 dark:bg-slate-800/20";
  return "";
}

export default function EmployeeAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(lastDayOfMonth());

  const [editRecord, setEditRecord] = useState<DailyRecord | null>(null);
  const [editForm, setEditForm] = useState({ status: "present", checkIn: "", checkOut: "" });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ date: todayStr(), status: "present", checkIn: "", checkOut: "" });

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: positions = [] } = useQuery<Position[]>({ queryKey: ["/api/positions"] });

  const employee = employees.find((e) => e.id === id);
  const workshop = workshops.find((w) => w.id === employee?.workshopId);
  const position = positions.find((p) => p.id === employee?.positionId);

  const reportUrl = `/api/reports/range?from=${dateFrom}&to=${dateTo}&employeeId=${id}`;
  const { data: reportData = [], isLoading: reportLoading } = useQuery<EmployeeReport[]>({
    queryKey: ["/api/reports/range", dateFrom, dateTo, id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(reportUrl);
      if (!res.ok) throw new Error("فشل تحميل التقرير");
      return res.json();
    },
  });

  const empReport = reportData[0];
  const records = useMemo(
    () => (empReport?.dailyRecords ?? []).slice().sort((a, b) => b.date.localeCompare(a.date)),
    [empReport],
  );

  const saveAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceId, date, data }: {
      attendanceId: string | null; date: string;
      data: { status: string; checkIn: string | null; checkOut: string | null };
    }) => {
      if (attendanceId) {
        return apiRequest("PATCH", `/api/attendance/${attendanceId}`, data);
      }
      return apiRequest("POST", `/api/attendance`, { employeeId: id, date, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
      toast({ title: "تم حفظ السجل بنجاح" });
      setEditRecord(null);
      setAddDialogOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ في الحفظ", description: err.message, variant: "destructive" }),
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (attendanceId: string) => apiRequest("DELETE", `/api/attendance/${attendanceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
      toast({ title: "تم حذف السجل" });
      setEditRecord(null);
    },
    onError: (err: Error) => toast({ title: "خطأ في الحذف", description: err.message, variant: "destructive" }),
  });

  function handleDateMode(mode: DateMode) {
    setDateMode(mode);
    const d = new Date();
    if (mode === "day") {
      setDateFrom(todayStr()); setDateTo(todayStr());
    } else if (mode === "week") {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(new Date().setDate(diff));
      const sun = new Date(new Date(mon).setDate(mon.getDate() + 6));
      setDateFrom(mon.toISOString().slice(0, 10));
      setDateTo(sun.toISOString().slice(0, 10));
    } else {
      setDateFrom(firstDayOfMonth()); setDateTo(lastDayOfMonth());
    }
  }

  function openEdit(rec: DailyRecord) {
    setEditRecord(rec);
    setEditForm({
      status: rec.status === "holiday" ? "present" : rec.status,
      checkIn: rec.checkIn ?? "",
      checkOut: rec.checkOut ?? "",
    });
  }

  function handleSave() {
    if (!editRecord) return;
    saveAttendanceMutation.mutate({
      attendanceId: editRecord.attendanceId,
      date: editRecord.date,
      data: {
        status: editForm.status,
        checkIn: editForm.checkIn || null,
        checkOut: editForm.checkOut || null,
      },
    });
  }

  function handleAdd() {
    saveAttendanceMutation.mutate({
      attendanceId: null,
      date: addForm.date,
      data: {
        status: addForm.status,
        checkIn: addForm.checkIn || null,
        checkOut: addForm.checkOut || null,
      },
    });
  }

  function handleDelete() {
    if (!editRecord?.attendanceId) return;
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    deleteAttendanceMutation.mutate(editRecord.attendanceId);
  }

  const statusOptions = [
    { value: "present", label: "حاضر" },
    { value: "late", label: "متأخر" },
    { value: "absent", label: "غائب" },
    { value: "leave", label: "إجازة" },
    { value: "rest", label: "راحة" },
  ];

  const totalHours = useMemo(() => {
    const sum = (empReport?.dailyRecords ?? []).reduce((acc, r) => {
      const h = parseFloat(r.totalHours ?? "0");
      return acc + (isNaN(h) ? 0 : h);
    }, 0);
    return sum.toFixed(1);
  }, [empReport]);

  const attendancePct = empReport && empReport.totalDays > 0
    ? Math.round(((empReport.presentDays + empReport.lateDays) / empReport.totalDays) * 100)
    : 0;

  function exportEmployeeExcel() {
    if (!empReport || !records.length) return;
    const statusMap: Record<string, string> = {
      present: "حاضر", late: "متأخر", absent: "غائب",
      leave: "إجازة", holiday: "عطلة", rest: "راحة",
    };
    const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const rows = [...records].sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({
      "التاريخ": r.date,
      "اليوم": DAYS[new Date(r.date + "T00:00:00").getDay()],
      "الحالة": statusMap[r.status] ?? r.status,
      "دخول": r.checkIn ?? "",
      "خروج": r.checkOut ?? "",
      "تأخر (دقيقة)": r.effectiveLateMinutes || 0,
      "الساعات": r.totalHours ?? "",
      "الدرجة": r.dailyScore.toFixed(2),
    }));
    const summaryRows = [
      {} as Record<string, unknown>,
      { "التاريخ": "الملخص" },
      { "التاريخ": "إجمالي الأيام", "اليوم": empReport.totalDays },
      { "التاريخ": "حاضر", "اليوم": empReport.presentDays },
      { "التاريخ": "متأخر", "اليوم": empReport.lateDays },
      { "التاريخ": "غائب", "اليوم": empReport.absentDays },
      { "التاريخ": "إجازة", "اليوم": empReport.leaveDays },
      { "التاريخ": "إجمالي الساعات", "اليوم": totalHours },
      { "التاريخ": "نقاط الالتزام", "اليوم": empReport.attendanceScore.toFixed(2) },
    ];
    const ws = XLSX.utils.json_to_sheet([...rows, ...summaryRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الحضور");
    const empName = employee?.name ?? "موظف";
    const filename = `حضور_${empName}_${dateFrom}_${dateTo}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header — Employee Profile Card */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => navigate("/employees")} data-testid="button-back">
          <ChevronRight className="h-5 w-5" />
        </Button>

        {employee ? (
          <div className="flex-1 flex items-start gap-4 rounded-2xl border bg-card p-4 shadow-sm">
            {/* Avatar */}
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: getAvatarGradient(employee.name) }}
              data-testid="img-employee-avatar"
            >
              {getInitials(employee.name)}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate" data-testid="text-employee-name">
                {employee.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />#{employee.employeeCode}
                </span>
                {workshop && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />{workshop.name}
                  </span>
                )}
                {position && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />{position.name}
                  </span>
                )}
                {employee.cardNumber && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />{employee.cardNumber}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {employee.shift === "morning" ? "وردية صباحية" : "وردية مسائية"}
                </Badge>
                {employee.isActive
                  ? <Badge variant="default" className="text-xs">نشط</Badge>
                  : <Badge variant="destructive" className="text-xs">غير نشط</Badge>
                }
                {employee.contractEndDate && (() => {
                  const daysLeft = Math.ceil((new Date(employee.contractEndDate!).getTime() - Date.now()) / 86400000);
                  if (daysLeft < 0) return <Badge variant="destructive" className="text-xs">عقد منتهي</Badge>;
                  if (daysLeft <= 30) return <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">ينتهي بعد {daysLeft} يوم</Badge>;
                  return null;
                })()}
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                onClick={() => { setAddForm({ date: todayStr(), status: "absent", checkIn: "", checkOut: "" }); setAddDialogOpen(true); }}
                data-testid="button-add-attendance"
                size="sm"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة سجل
              </Button>
              {empReport && records.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportEmployeeExcel}
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950/30"
                  data-testid="button-export-employee-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  تصدير Excel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Skeleton className="flex-1 h-24 rounded-2xl" />
        )}
      </div>

      {/* Date filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {(["day", "week", "month"] as DateMode[]).map((m) => (
                <Button key={m} size="sm" variant={dateMode === m ? "default" : "outline"} onClick={() => handleDateMode(m)} data-testid={`button-datemode-${m}`}>
                  {m === "day" ? "اليوم" : m === "week" ? "الأسبوع" : "الشهر"}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 mr-auto">
              <Label className="text-xs text-muted-foreground">من</Label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDateMode("month"); }} className="w-36 h-8 text-sm" data-testid="input-date-from" />
              <Label className="text-xs text-muted-foreground">إلى</Label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDateMode("month"); }} className="w-36 h-8 text-sm" data-testid="input-date-to" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      {reportLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : empReport && (
        <div className="space-y-3">
          {/* Attendance rate + total hours — wide cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Attendance % with progress bar */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">نسبة الحضور</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-attendance-pct">
                  {attendancePct}%
                </p>
                <div className="mt-2 h-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {empReport.presentDays + empReport.lateDays} من أصل {empReport.totalDays} يوم
                </p>
              </CardContent>
            </Card>

            {/* Total hours */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">إجمالي الساعات</span>
                  <Timer className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-total-hours">
                  {totalHours}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ساعة عمل في الفترة المحددة
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Day-count KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "حاضر", value: empReport.presentDays,
                icon: CheckCircle2,
                color: "text-green-600 dark:text-green-400",
                bg: "bg-green-50 dark:bg-green-950/20",
                testid: "text-present-days",
              },
              {
                label: "متأخر", value: empReport.lateDays,
                icon: AlarmClock,
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-50 dark:bg-amber-950/20",
                testid: "text-late-days",
              },
              {
                label: "غائب", value: empReport.absentDays,
                icon: XCircle,
                color: "text-red-600 dark:text-red-400",
                bg: "bg-red-50 dark:bg-red-950/20",
                testid: "text-absent-days",
              },
              {
                label: "إجازة", value: empReport.leaveDays,
                icon: Umbrella,
                color: "text-purple-600 dark:text-purple-400",
                bg: "bg-purple-50 dark:bg-purple-950/20",
                testid: "text-leave-days",
              },
            ].map((kpi) => (
              <Card key={kpi.label} className={`border-0 shadow-sm ${kpi.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${kpi.color}`} data-testid={kpi.testid}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">يوم</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Attendance table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            سجل الحضور
            {empReport && (
              <span className="text-sm font-normal text-muted-foreground mr-auto">
                الدرجة: {empReport.attendanceScore.toFixed(2)} / {empReport.totalDays}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reportLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-3 opacity-40" />
              <p>لا توجد سجلات في هذا النطاق</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-3 text-right font-medium">التاريخ</th>
                    <th className="p-3 text-right font-medium">اليوم</th>
                    <th className="p-3 text-right font-medium">دخول</th>
                    <th className="p-3 text-right font-medium">خروج</th>
                    <th className="p-3 text-right font-medium">الحالة</th>
                    <th className="p-3 text-right font-medium">التأخر</th>
                    <th className="p-3 text-right font-medium">الدرجة</th>
                    <th className="p-3 text-center font-medium">تعديل</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.date} className={`border-b transition-colors hover:bg-muted/20 ${statusRowClass(rec.status)}`} data-testid={`row-attendance-${rec.date}`}>
                      <td className="p-3 font-mono text-xs">{rec.date}</td>
                      <td className="p-3 text-muted-foreground">{getArabicDay(rec.date)}</td>
                      <td className="p-3">
                        {rec.checkIn ? (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-green-500" />{rec.checkIn}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        {rec.checkOut ? (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-red-400" />{rec.checkOut}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusBadgeVariant(rec.status)} className="text-xs">
                          {statusLabel(rec.status)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {rec.effectiveLateMinutes > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 text-xs">{rec.effectiveLateMinutes} د</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 font-mono text-xs">{rec.dailyScore.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(rec)} data-testid={`button-edit-attendance-${rec.date}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={(o) => { if (!o) setEditRecord(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل سجل {editRecord?.date}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وقت الدخول</Label>
                <Input type="time" value={editForm.checkIn} onChange={(e) => setEditForm((f) => ({ ...f, checkIn: e.target.value }))} data-testid="input-edit-checkin" />
              </div>
              <div className="space-y-2">
                <Label>وقت الخروج</Label>
                <Input type="time" value={editForm.checkOut} onChange={(e) => setEditForm((f) => ({ ...f, checkOut: e.target.value }))} data-testid="input-edit-checkout" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between gap-2">
            <div>
              {editRecord?.attendanceId && (
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteAttendanceMutation.isPending} data-testid="button-delete-attendance">
                  <Trash2 className="h-4 w-4 ml-1" />
                  حذف
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditRecord(null)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={saveAttendanceMutation.isPending} data-testid="button-save-attendance">
                {saveAttendanceMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(o) => { if (!o) setAddDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة سجل حضور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={addForm.date} onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))} data-testid="input-add-date" />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={addForm.status} onValueChange={(v) => setAddForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-add-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وقت الدخول</Label>
                <Input type="time" value={addForm.checkIn} onChange={(e) => setAddForm((f) => ({ ...f, checkIn: e.target.value }))} data-testid="input-add-checkin" />
              </div>
              <div className="space-y-2">
                <Label>وقت الخروج</Label>
                <Input type="time" value={addForm.checkOut} onChange={(e) => setAddForm((f) => ({ ...f, checkOut: e.target.value }))} data-testid="input-add-checkout" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleAdd} disabled={saveAttendanceMutation.isPending} data-testid="button-confirm-add">
              {saveAttendanceMutation.isPending ? "جارٍ الحفظ..." : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
