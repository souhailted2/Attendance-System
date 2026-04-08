import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
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
  Archive, Sun, Moon, Star, Wrench, Users, Trash2, Calendar, Search, X,
} from "lucide-react";
import type { WorkRule, Workshop } from "@shared/schema";

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
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
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

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getArabicDay(dateStr: string): string {
  return ARABIC_DAYS[new Date(dateStr + "T00:00:00").getDay()];
}

function getCellBg(status: string): string {
  if (status === "absent") return "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50";
  if (status === "holiday") return "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50";
  if (status === "leave") return "bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50";
  if (status === "late") return "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50";
  return "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50";
}

function getCellScoreColor(status: string, score: number): string {
  if (status === "absent") return "text-red-600 dark:text-red-400";
  if (status === "holiday") return "text-blue-600 dark:text-blue-400";
  if (status === "leave") return "text-purple-600 dark:text-purple-400";
  if (score >= 0.95) return "text-green-700 dark:text-green-400";
  if (score >= 0.80) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

function scoreColor(score: number, max: number): string {
  if (max === 0) return "text-muted-foreground";
  const ratio = score / max;
  if (ratio >= 0.95) return "text-green-600 dark:text-green-400 font-bold";
  if (ratio >= 0.8) return "text-amber-600 dark:text-amber-400 font-semibold";
  return "text-red-600 dark:text-red-400 font-semibold";
}

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return {
    from: `${monthStr}-01`,
    to: `${monthStr}-${String(last).padStart(2, "0")}`,
  };
}

function arabicMonthName(monthStr: string): string {
  const MONTHS = [
    "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  const [y, m] = monthStr.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export default function MonthlyArchive() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && user.username !== "bachir tedjani") {
      navigate("/");
    }
  }, [user, navigate]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const { from: dateFrom, to: dateTo } = useMemo(() => monthBounds(selectedMonth), [selectedMonth]);
  const [searchTerm, setSearchTerm] = useState("");

  const [editCell, setEditCell] = useState<EditCell | null>(null);
  const [editForm, setEditForm] = useState({ status: "present", checkIn: "", checkOut: "" });

  const { data: workRules = [] } = useQuery<WorkRule[]>({ queryKey: ["/api/work-rules"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });

  const reportUrl = `/api/reports/range?from=${dateFrom}&to=${dateTo}`;
  const { data: reportData = [], isLoading } = useQuery<EmployeeReport[]>({
    queryKey: ["/api/reports/range", dateFrom, dateTo],
    queryFn: async () => {
      const res = await fetch(reportUrl);
      if (!res.ok) throw new Error("فشل تحميل التقرير");
      return res.json();
    },
    enabled: !!dateFrom && !!dateTo,
  });

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

  function openEditCell(emp: EmployeeReport, date: string, rec: DailyRecord) {
    setEditCell({ employeeId: emp.employeeId, employeeName: emp.employeeName, date, record: rec });
    setEditForm({
      status: rec.status === "holiday" ? "present" : rec.status,
      checkIn: rec.checkIn ?? "",
      checkOut: rec.checkOut ?? "",
    });
  }

  function handleSave() {
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

  function handleDelete() {
    if (!editCell?.record.attendanceId) return;
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    deleteAttendanceMutation.mutate(editCell.record.attendanceId);
  }

  const allDates = useMemo(() => {
    const s = new Set<string>();
    for (const emp of reportData) for (const r of emp.dailyRecords) s.add(r.date);
    return Array.from(s).sort();
  }, [reportData]);

  const grouped = useMemo(() => {
    const byRule = new Map<string, { rule: WorkRule; workshops: { workshop: Workshop | undefined; emps: EmployeeReport[] }[] }>();

    for (const emp of reportData) {
      const rule = workRules.find(r => r.id === emp.workRuleId);
      if (!rule) continue;
      if (!byRule.has(emp.workRuleId)) {
        byRule.set(emp.workRuleId, { rule, workshops: [] });
      }
      const ruleGroup = byRule.get(emp.workRuleId)!;
      let wsGroup = ruleGroup.workshops.find(w => w.workshop?.id === emp.workshopId);
      if (!wsGroup) {
        wsGroup = { workshop: workshops.find(w => w.id === emp.workshopId), emps: [] };
        ruleGroup.workshops.push(wsGroup);
      }
      wsGroup.emps.push(emp);
    }
    return Array.from(byRule.values());
  }, [reportData, workRules, workshops]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return grouped;
    return grouped
      .map(({ rule, workshops: wsGroups }) => {
        const filteredWs = wsGroups
          .map((wsGroup: { workshop: Workshop | undefined; emps: EmployeeReport[] }) => {
            const wsMatch = wsGroup.workshop?.name.toLowerCase().includes(q);
            const filteredEmps = wsMatch
              ? wsGroup.emps
              : wsGroup.emps.filter(
                  (e) =>
                    e.employeeName.toLowerCase().includes(q) ||
                    e.employeeCode.toLowerCase().includes(q)
                );
            return { ...wsGroup, emps: filteredEmps };
          })
          .filter((ws) => ws.emps.length > 0);
        return { rule, workshops: filteredWs };
      })
      .filter((g) => g.workshops.length > 0);
  }, [grouped, searchTerm]);

  function renderTable(emps: EmployeeReport[], ruleName: string, workshopName: string) {
    const tableTotal = emps.reduce((s, r) => s + r.attendanceScore, 0);
    const tableMax = emps.reduce((s, r) => s + (r.normalizedTotalDays ?? r.totalDays), 0);

    return (
      <div className="overflow-x-auto rounded-lg border mb-6">
        <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{workshopName}</span>
          <span className="text-muted-foreground text-xs">—</span>
          <span className="text-xs text-muted-foreground">{ruleName}</span>
          <Badge variant="outline" className="mr-auto text-xs gap-1">
            <Users className="h-3 w-3" />{emps.length} موظف
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 bg-muted/20">
              <TableHead className="text-right sticky right-0 bg-muted/20 z-10 min-w-[130px] font-bold">الموظف</TableHead>
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
              <TableHead className="text-center min-w-[90px] font-bold bg-muted/20 sticky left-0 z-10">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emps.map((r) => {
              const byDate = new Map<string, DailyRecord>();
              for (const rec of r.dailyRecords) byDate.set(rec.date, rec);

              return (
                <TableRow key={r.employeeId} className="hover:bg-transparent" data-testid={`row-archive-${r.employeeId}`}>
                  <TableCell className="font-medium sticky right-0 bg-background z-10 border-l">{r.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground text-xs text-center">{r.employeeCode}</TableCell>
                  {allDates.map((d) => {
                    const rec = byDate.get(d);
                    if (!rec) {
                      const syntheticRec: DailyRecord = {
                        attendanceId: null, date: d, checkIn: null, checkOut: null,
                        normalizedCheckIn: null, normalizedCheckOut: null, status: "absent",
                        lateMinutes: 0, earlyLeaveMinutes: 0, effectiveLateMinutes: 0,
                        effectiveEarlyLeaveMinutes: 0, totalHours: null, dailyScore: 0,
                        pending: false, overtimeHours: 0,
                      };
                      return (
                        <TableCell key={d} className="p-0">
                          <button
                            className="w-full min-h-[52px] flex items-center justify-center text-muted-foreground text-xs cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => openEditCell(r, d, syntheticRec)}
                            data-testid={`button-edit-archive-${r.employeeId}-${d}`}
                          >—</button>
                        </TableCell>
                      );
                    }

                    const bgClass = getCellBg(rec.status);
                    const scoreColorClass = getCellScoreColor(rec.status, rec.dailyScore);

                    return (
                      <TableCell key={d} className="p-0" data-testid={`cell-archive-${r.employeeId}-${d}`}>
                        <button
                          className={`w-full min-h-[52px] px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${bgClass}`}
                          onClick={() => openEditCell(r, d, rec)}
                          title={`${r.employeeName} — ${d}\nالحالة: ${rec.status}\nدخول: ${rec.checkIn ?? "—"} | خروج: ${rec.checkOut ?? "—"}`}
                          data-testid={`button-edit-archive-${r.employeeId}-${d}`}
                        >
                          {rec.status === "absent" ? (
                            <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                          ) : rec.status === "leave" ? (
                            <span className={`text-xs font-bold ${scoreColorClass}`}>إجازة</span>
                          ) : rec.status === "holiday" ? (
                            <>
                              <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                              {rec.checkIn && (
                                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono">{rec.checkIn}</span>
                              )}
                            </>
                          ) : rec.pending ? (
                            <>
                              <span className="text-base font-bold text-amber-500 dark:text-amber-400">؟</span>
                              <span className="text-[10px] font-mono text-muted-foreground leading-none">{rec.checkIn}</span>
                            </>
                          ) : (
                            <>
                              <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                              {rec.checkIn && (
                                <span className="text-[10px] font-mono text-muted-foreground leading-none">{rec.checkIn}</span>
                              )}
                              {rec.checkOut && (
                                <span className="text-[10px] font-mono text-muted-foreground leading-none">{rec.checkOut}</span>
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
                      const display = r.attendanceScore + bonus;
                      const denom = r.normalizedTotalDays ?? r.totalDays;
                      return (
                        <>
                          <span className={`text-sm ${scoreColor(display, denom)}`} data-testid={`score-archive-${r.employeeId}`}>
                            {Number.isInteger(display) ? display.toFixed(0) : display.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground mr-1">/{denom}</span>
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
                const dayTotal = emps.reduce((s, emp) => {
                  const rec = emp.dailyRecords.find(r => r.date === d);
                  return s + (rec?.dailyScore ?? 0);
                }, 0);
                return (
                  <TableCell key={d} className="text-center text-xs px-1 py-2">
                    <span className={scoreColor(dayTotal, emps.length)}>{dayTotal.toFixed(2)}</span>
                  </TableCell>
                );
              })}
              <TableCell className="text-center sticky left-0 bg-muted/50 z-10 border-r">
                <span className={`text-sm ${scoreColor(tableTotal, tableMax)}`}>{tableTotal.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground mr-1">/{tableMax}</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Archive className="h-6 w-6 text-primary" />
            حفظ الاشهر
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            سجل الحضور الشهري — مرتب حسب الفترات والورشات
          </p>
        </div>

        {/* Controls: month picker + search */}
        <div className="flex flex-wrap items-stretch gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div className="space-y-0.5">
                <Label className="text-xs text-muted-foreground">اختيار الشهر</Label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block h-8 rounded-md border border-input bg-background px-3 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="input-month"
                />
              </div>
              <Badge variant="secondary" className="text-xs font-medium">
                {arabicMonthName(selectedMonth)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-sm flex-1 min-w-[220px]">
            <CardContent className="p-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالورشة أو اسم العامل أو رقمه"
                  className="h-8 text-sm pl-6"
                  data-testid="input-search-archive"
                  dir="rtl"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-clear-search"
                    title="مسح البحث"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <Badge variant="outline" className="text-xs whitespace-nowrap shrink-0">
                  {filtered.reduce((s, g) => s + g.workshops.reduce((ws, w) => ws + w.emps.length, 0), 0)} نتيجة
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : reportData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-20 text-muted-foreground">
            <Archive className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-base">لا توجد بيانات حضور لشهر {arabicMonthName(selectedMonth)}</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 && searchTerm ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-base">لا توجد نتائج لـ «{searchTerm}»</p>
            <Button variant="ghost" className="mt-2 text-sm" onClick={() => setSearchTerm("")}>
              مسح البحث
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filtered.map(({ rule, workshops: wsGroups }) => (
            <div key={rule.id} className="space-y-1">
              {/* Work rule header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-1.5 rounded-md ${rule.name.includes("صباح") ? "bg-amber-100 dark:bg-amber-950/50" : rule.name.includes("مساء") ? "bg-indigo-100 dark:bg-indigo-950/50" : "bg-primary/10"}`}>
                  {rule.name.includes("صباح") ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : rule.name.includes("مساء") ? (
                    <Moon className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <Star className="h-4 w-4 text-primary" />
                  )}
                </div>
                <h2 className="text-lg font-bold">{rule.name}</h2>
                <span className="text-sm text-muted-foreground font-mono">{rule.workStartTime} — {rule.workEndTime}</span>
                <div className="flex-1 h-px bg-border mr-2" />
              </div>

              {/* Workshop tables */}
              {wsGroups.map((wsGroup: { workshop: Workshop | undefined; emps: EmployeeReport[] }) => (
                <div key={wsGroup.workshop?.id ?? "unknown"}>
                  {renderTable(wsGroup.emps, rule.name, wsGroup.workshop?.name ?? "ورشة غير محددة")}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
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
                <SelectTrigger data-testid="select-status-archive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="late">متأخر</SelectItem>
                  <SelectItem value="absent">غائب</SelectItem>
                  <SelectItem value="leave">إجازة</SelectItem>
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
                  data-testid="input-checkin-archive"
                  disabled={editForm.status === "absent" || editForm.status === "leave"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>وقت الخروج</Label>
                <Input
                  type="time"
                  value={editForm.checkOut}
                  onChange={(e) => setEditForm(f => ({ ...f, checkOut: e.target.value }))}
                  data-testid="input-checkout-archive"
                  disabled={editForm.status === "absent" || editForm.status === "leave"}
                />
              </div>
            </div>

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
                onClick={handleDelete}
                disabled={deleteAttendanceMutation.isPending}
                data-testid="button-delete-archive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف السجل
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditCell(null)} data-testid="button-cancel-archive">
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveAttendanceMutation.isPending}
              data-testid="button-save-archive"
            >
              {saveAttendanceMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
