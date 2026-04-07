import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, Clock, Users, ChevronLeft, Pencil, Check, X,
  Sun, Moon, Star, Wrench, AlertTriangle, Calendar,
} from "lucide-react";
import type { WorkRule, Workshop, Employee } from "@shared/schema";

type DateMode = "day" | "week" | "month" | "year";

interface DailyRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  normalizedCheckIn: string;
  normalizedCheckOut: string;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  totalHours: string | null;
  dailyScore: number;
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
  totalLateMinutes: number;
  totalHours: number;
  attendanceScore: number;
  dailyRecords: DailyRecord[];
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
  const now = new Date();

  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(lastDayOfMonth());

  const [selectedRule, setSelectedRule] = useState<WorkRule | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [graceForm, setGraceForm] = useState({
    earlyArrivalGraceMinutes: 0,
    lateGraceMinutes: 0,
    earlyLeaveGraceMinutes: 0,
    lateLeaveGraceMinutes: 0,
  });

  const { data: workRules = [], isLoading: rulesLoading } = useQuery<WorkRule[]>({ queryKey: ["/api/work-rules"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });

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

  function getWorkshopsForRule(rule: WorkRule) {
    const empsInRule = activeEmployees.filter((e) => e.workRuleId === rule.id);
    const workshopIds = [...new Set(empsInRule.map((e) => e.workshopId).filter(Boolean))];
    return workshopIds.map((wid) => ({
      workshop: workshops.find((w) => w.id === wid),
      count: empsInRule.filter((e) => e.workshopId === wid).length,
    })).filter((x) => x.workshop);
  }

  function getEmpCountForRule(rule: WorkRule) {
    return activeEmployees.filter((e) => e.workRuleId === rule.id).length;
  }

  const totalScore = useMemo(() => reportData.reduce((s, r) => s + (r.attendanceScore || 0), 0), [reportData]);
  const maxScore = useMemo(() => reportData.reduce((s, r) => s + (r.totalDays || 0), 0), [reportData]);

  const breadcrumb = selectedWorkshop
    ? `${selectedRule?.name} ← ${selectedWorkshop.name}`
    : selectedRule
    ? selectedRule.name
    : null;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">التقارير</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {breadcrumb ? (
              <button
                className="text-primary hover:underline"
                onClick={() => { setSelectedWorkshop(null); setSelectedRule(null); }}
              >
                الفترات
              </button>
            ) : "اختر فترة عمل لعرض التقرير"}
            {selectedRule && !selectedWorkshop && (
              <span> ← <span className="text-foreground">{selectedRule.name}</span></span>
            )}
            {selectedWorkshop && (
              <>
                <span> ← </span>
                <button className="text-primary hover:underline" onClick={() => setSelectedWorkshop(null)}>
                  {selectedRule?.name}
                </button>
                <span> ← <span className="text-foreground">{selectedWorkshop.name}</span></span>
              </>
            )}
          </p>
        </div>

        {/* Date range picker */}
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
        </div>
      </div>

      {/* ======================== LEVEL 1: Work Rule Cards ======================== */}
      {!selectedRule && (
        rulesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full" /><Skeleton className="h-44 w-full" />
          </div>
        ) : workRules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
              <p>لا توجد فترات عمل مُعرَّفة. أضف فترات من صفحة قواعد العمل.</p>
            </CardContent>
          </Card>
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

              return (
                <Card
                  key={rule.id}
                  className={`border-2 transition-all ${isEditing ? "border-primary" : "hover:border-primary/50 hover:shadow-md"}`}
                  data-testid={`card-rule-${rule.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {rule.name.includes("صباح") ? (
                          <Sun className="h-4 w-4 text-amber-500" />
                        ) : rule.name.includes("مساء") ? (
                          <Moon className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <Star className="h-4 w-4 text-primary" />
                        )}
                        {rule.name}
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
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{rule.workStartTime} — {rule.workEndTime}</span>
                      <Badge variant="outline" className="mr-auto gap-1 text-xs">
                        <Users className="h-3 w-3" />{getEmpCountForRule(rule)} موظف
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Grace windows display / edit */}
                    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">نافذة المهلة</p>
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
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">الوصول:</span>
                            <span className="font-mono">{arrivalFrom} → {arrivalTo} <span className="text-muted-foreground">(= {rule.workStartTime})</span></span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">المغادرة:</span>
                            <span className="font-mono">{departureFrom} → {departureTo} <span className="text-muted-foreground">(= {rule.workEndTime})</span></span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Click to drill down */}
                    {!isEditing && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
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
          </div>
        )
      )}

      {/* ======================== LEVEL 2: Workshops in a Rule ======================== */}
      {selectedRule && !selectedWorkshop && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" className="gap-1 -mt-2" onClick={() => setSelectedRule(null)} data-testid="button-back-to-rules">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            العودة للفترات
          </Button>

          {(() => {
            const ruleWorkshops = getWorkshopsForRule(selectedRule);
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
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => setSelectedWorkshop(workshop!)}
                    data-testid={`card-workshop-${workshop!.id}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
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
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
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
                  <div className="h-9 w-9 rounded-md bg-green-500/10 flex items-center justify-center">
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
                  <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center">
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
                  <div className="h-9 w-9 rounded-md bg-destructive/10 flex items-center justify-center">
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
                      <TableRow>
                        <TableHead className="text-right sticky right-0 bg-background">الموظف</TableHead>
                        <TableHead className="text-right">الرقم</TableHead>
                        <TableHead className="text-right">أيام العمل</TableHead>
                        <TableHead className="text-right">حضور</TableHead>
                        <TableHead className="text-right">تأخير</TableHead>
                        <TableHead className="text-right">غياب</TableHead>
                        <TableHead className="text-right">دق. التأخير</TableHead>
                        <TableHead className="text-right">النقطة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((r) => (
                        <TableRow key={r.employeeId} data-testid={`row-report-${r.employeeId}`}>
                          <TableCell className="font-medium sticky right-0 bg-background">{r.employeeName}</TableCell>
                          <TableCell className="text-muted-foreground">{r.employeeCode}</TableCell>
                          <TableCell>{r.totalDays}</TableCell>
                          <TableCell><span className="text-green-600 dark:text-green-400 font-medium">{r.presentDays}</span></TableCell>
                          <TableCell><span className={r.lateDays > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>{r.lateDays || "-"}</span></TableCell>
                          <TableCell><span className={r.absentDays > 0 ? "text-destructive font-medium" : ""}>{r.absentDays || "-"}</span></TableCell>
                          <TableCell>{r.totalLateMinutes || "-"}</TableCell>
                          <TableCell>
                            <span className={`text-sm ${scoreColor(r.attendanceScore, r.totalDays)}`} data-testid={`score-${r.employeeId}`}>
                              {r.attendanceScore.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground mr-1">/ {r.totalDays}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals row */}
                      <TableRow className="bg-muted/50 font-bold border-t-2">
                        <TableCell className="sticky right-0 bg-muted/50">المجموع</TableCell>
                        <TableCell />
                        <TableCell>{reportData.reduce((s, r) => s + r.totalDays, 0)}</TableCell>
                        <TableCell className="text-green-600 dark:text-green-400">{reportData.reduce((s, r) => s + r.presentDays, 0)}</TableCell>
                        <TableCell className="text-amber-600 dark:text-amber-400">{reportData.reduce((s, r) => s + r.lateDays, 0)}</TableCell>
                        <TableCell className="text-destructive">{reportData.reduce((s, r) => s + r.absentDays, 0)}</TableCell>
                        <TableCell>{reportData.reduce((s, r) => s + r.totalLateMinutes, 0)}</TableCell>
                        <TableCell>
                          <span className={`text-sm ${scoreColor(totalScore, maxScore)}`}>
                            {totalScore.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground mr-1">/ {maxScore}</span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
