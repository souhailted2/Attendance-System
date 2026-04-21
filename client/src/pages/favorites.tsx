import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import {
  Star, Users as UsersIcon, ClipboardList, Hash, Building2,
  ChevronRight, ChevronLeft, Pencil, Trash2, Check, X,
} from "lucide-react";
import type { Employee, Workshop, Position } from "@shared/schema";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function lastDayOf(year: number, month: number) {
  const d = new Date(year, month, 0);
  return `${year}-${pad(month)}-${pad(d.getDate())}`;
}
function getArabicDay(dateStr: string) {
  return ARABIC_DAYS[new Date(dateStr + "T00:00:00").getDay()];
}

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
  dailyRecords: DailyRecord[];
  attendanceScore: number;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
}

function statusLabel(status: string) {
  const m: Record<string, string> = {
    present: "حاضر", late: "متأخر", absent: "غائب",
    leave: "إجازة", holiday: "عطلة", rest: "راحة",
  };
  return m[status] ?? status;
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

const STATUS_OPTIONS = [
  { value: "present", label: "حاضر" },
  { value: "late", label: "متأخر" },
  { value: "absent", label: "غائب" },
  { value: "leave", label: "إجازة" },
  { value: "rest", label: "راحة" },
];

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const isOwner = user?.username === "owner";
  const isOwnerOrAttendence = isOwner || user?.username === "attendence";

  const now = new Date();
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [editCell, setEditCell] = useState<DailyRecord | null>(null);
  const [editForm, setEditForm] = useState({ status: "present", checkIn: "", checkOut: "" });
  const [editingScore, setEditingScore] = useState(false);
  const [scoreInput, setScoreInput] = useState("");

  const { data: employees = [], isLoading } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: positions = [] } = useQuery<Position[]>({ queryKey: ["/api/positions"] });

  const favoriteEmployees = employees.filter((e) => favorites.includes(e.id));
  const selectedEmp = employees.find((e) => e.id === selectedEmpId);
  const selectedWorkshop = workshops.find((w) => w.id === selectedEmp?.workshopId);
  const selectedPosition = positions.find((p) => p.id === selectedEmp?.positionId);

  const monthStr = `${viewYear}-${pad(viewMonth)}`;
  const fromDate = `${viewYear}-${pad(viewMonth)}-01`;
  const toDate = lastDayOf(viewYear, viewMonth);

  const { data: reportData = [], isLoading: reportLoading } = useQuery<EmployeeReport[]>({
    queryKey: ["/api/reports/range", fromDate, toDate, selectedEmpId],
    enabled: !!selectedEmpId,
    queryFn: async () => {
      const res = await fetch(`/api/reports/range?from=${fromDate}&to=${toDate}&employeeId=${selectedEmpId}`);
      if (!res.ok) throw new Error("فشل تحميل التقرير");
      return res.json();
    },
  });

  const { data: overrideData } = useQuery<{ score: number | null }>({
    queryKey: ["/api/attendance-score-override", selectedEmpId, monthStr],
    enabled: !!selectedEmpId && isOwner,
    queryFn: async () => {
      const res = await fetch(`/api/attendance-score-override?employeeId=${selectedEmpId}&month=${monthStr}`);
      if (!res.ok) throw new Error("فشل جلب الإجمالي");
      return res.json();
    },
  });

  const empReport = reportData[0];
  const records = useMemo(
    () => (empReport?.dailyRecords ?? []).slice().sort((a, b) => a.date.localeCompare(b.date)),
    [empReport]
  );

  const allDates = useMemo(() => {
    const dates: string[] = [];
    const last = new Date(viewYear, viewMonth, 0).getDate();
    for (let d = 1; d <= last; d++) {
      dates.push(`${viewYear}-${pad(viewMonth)}-${pad(d)}`);
    }
    return dates;
  }, [viewYear, viewMonth]);

  const dayMap = useMemo(() => {
    const m = new Map<string, DailyRecord>();
    for (const rec of records) m.set(rec.date, rec);
    return m;
  }, [records]);

  const overrideScore = overrideData?.score ?? null;
  const displayScore = overrideScore !== null ? overrideScore : (empReport?.attendanceScore ?? 0);

  const saveAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceId, date, data }: {
      attendanceId: string | null; date: string;
      data: { status: string; checkIn: string | null; checkOut: string | null };
    }) => {
      if (attendanceId) {
        return apiRequest("PATCH", `/api/attendance/${attendanceId}`, data);
      }
      return apiRequest("POST", `/api/attendance`, { employeeId: selectedEmpId, date, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
      toast({ title: "تم حفظ السجل بنجاح" });
      setEditCell(null);
    },
    onError: (err: Error) => toast({ title: "خطأ في الحفظ", description: err.message, variant: "destructive" }),
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (attendanceId: string) => apiRequest("DELETE", `/api/attendance/${attendanceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
      toast({ title: "تم حذف السجل" });
      setEditCell(null);
    },
    onError: (err: Error) => toast({ title: "خطأ في الحذف", description: err.message, variant: "destructive" }),
  });

  const setOverrideMutation = useMutation({
    mutationFn: (score: number) =>
      apiRequest("POST", `/api/attendance-score-override`, { employeeId: selectedEmpId, month: monthStr, score }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-score-override"] });
      toast({ title: "تم حفظ الإجمالي المعدَّل" });
      setEditingScore(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: () =>
      apiRequest("DELETE", `/api/attendance-score-override`, { employeeId: selectedEmpId, month: monthStr }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-score-override"] });
      toast({ title: "تم إلغاء التعديل" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function openEdit(rec: DailyRecord) {
    setEditCell(rec);
    setEditForm({
      status: rec.status === "holiday" ? "present" : rec.status,
      checkIn: rec.checkIn ?? "",
      checkOut: rec.checkOut ?? "",
    });
  }

  function handleSave() {
    if (!editCell) return;
    saveAttendanceMutation.mutate({
      attendanceId: editCell.attendanceId,
      date: editCell.date,
      data: {
        status: editForm.status,
        checkIn: editForm.checkIn || null,
        checkOut: editForm.checkOut || null,
      },
    });
  }

  function handleDelete() {
    if (!editCell?.attendanceId) return;
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    deleteAttendanceMutation.mutate(editCell.attendanceId);
  }

  const minDate = new Date(now.getFullYear(), now.getMonth() - 23, 1);
  const isOldestMonth = viewYear < minDate.getFullYear() ||
    (viewYear === minDate.getFullYear() && viewMonth <= minDate.getMonth() + 1);

  function prevMonth() {
    if (isOldestMonth) return;
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1) return;
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1;

  function openReport(empId: string) {
    setSelectedEmpId(empId);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
    setEditingScore(false);
  }

  if (selectedEmpId && selectedEmp) {
    return (
      <div className="p-6 space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedEmpId(null)} data-testid="button-back-to-favorites">
            <ChevronRight className="h-4 w-4 ml-1" />
            رجوع
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ background: isDark ? "linear-gradient(135deg, hsl(271 76% 60%), hsl(280 70% 68%))" : "linear-gradient(135deg, hsl(271 76% 45%), hsl(280 70% 55%))" }}
            >
              {selectedEmp.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-lg leading-tight" data-testid="text-emp-name">{selectedEmp.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {selectedWorkshop && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{selectedWorkshop.name}</span>}
                {selectedPosition && <span>{selectedPosition.name}</span>}
                <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{selectedEmp.employeeCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={nextMonth} disabled={isCurrentMonth} data-testid="button-next-month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[140px] text-center" data-testid="text-month-label">
            {MONTHS_AR[viewMonth - 1]} {viewYear}
          </span>
          <Button variant="outline" size="icon" onClick={prevMonth} disabled={isOldestMonth} data-testid="button-prev-month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {reportLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card><CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-present-days">{empReport?.presentDays ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">حاضر</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-late-days">{empReport?.lateDays ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">متأخر</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-absent-days">{empReport?.absentDays ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">غائب</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-leave-days">{empReport?.leaveDays ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">إجازة</p>
              </CardContent></Card>
            </div>

            {/* Attendance Cross-Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 bg-muted/30">
                        <TableHead className="text-right sticky right-0 bg-muted/30 z-10 min-w-[130px] font-bold">
                          {selectedEmp?.name}
                        </TableHead>
                        {allDates.map((d) => {
                          const day = new Date(d + "T00:00:00").getDay();
                          const isWeekend = day === 5 || day === 6;
                          return (
                            <TableHead key={d} className={`text-center min-w-[72px] px-0.5 py-1 ${isWeekend ? "bg-blue-50/80 dark:bg-blue-950/20" : ""}`}>
                              <div className="text-[10px] text-muted-foreground leading-tight">{getArabicDay(d)}</div>
                              <div className="text-xs font-mono font-medium leading-tight">{d.slice(5).replace("-", "/")}</div>
                            </TableHead>
                          );
                        })}
                        <TableHead className={`text-center min-w-[100px] font-bold sticky left-0 z-10 border-r ${overrideScore !== null ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-muted/30"}`}>
                          الإجمالي
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="font-medium sticky right-0 bg-background z-10 border-l text-sm">
                          {selectedEmp?.employeeCode && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Hash className="h-3 w-3" />{selectedEmp.employeeCode}
                            </span>
                          )}
                        </TableCell>
                        {allDates.map((d) => {
                          const rec = dayMap.get(d);
                          if (!rec) {
                            const syntheticRec: DailyRecord = {
                              attendanceId: null, date: d,
                              checkIn: null, checkOut: null,
                              normalizedCheckIn: null, normalizedCheckOut: null,
                              status: "absent", lateMinutes: 0, earlyLeaveMinutes: 0,
                              effectiveLateMinutes: 0, effectiveEarlyLeaveMinutes: 0,
                              totalHours: null, dailyScore: 0, pending: false, overtimeHours: 0,
                            };
                            return (
                              <TableCell key={d} className="p-0">
                                <button
                                  className={`w-full min-h-[52px] flex items-center justify-center text-muted-foreground text-xs transition-colors ${isOwnerOrAttendence ? "cursor-pointer hover:bg-muted/40" : "cursor-default"}`}
                                  onClick={() => isOwnerOrAttendence && openEdit(syntheticRec)}
                                  data-testid={`button-cell-${d}`}
                                >
                                  —
                                </button>
                              </TableCell>
                            );
                          }
                          const bgClass = getCellBg(rec.status);
                          const scoreColorClass = getCellScoreColor(rec.status, rec.dailyScore);
                          return (
                            <TableCell key={d} className="p-0" data-testid={`cell-${d}`}>
                              <button
                                className={`w-full min-h-[52px] px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${bgClass} ${isOwnerOrAttendence ? "cursor-pointer" : "cursor-default"}`}
                                onClick={() => isOwnerOrAttendence && openEdit(rec)}
                                title={`${d}\nالحالة: ${rec.status}\nدخول: ${rec.checkIn ?? "—"} | خروج: ${rec.checkOut ?? "—"}`}
                                data-testid={`button-cell-${d}`}
                              >
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
                                      <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono leading-none">
                                        <span className="text-green-600 dark:text-green-400 font-bold">د:</span>{rec.checkIn}
                                      </span>
                                    )}
                                  </>
                                ) : rec.pending ? (
                                  <>
                                    <span className="text-base font-bold text-amber-500 dark:text-amber-400">؟</span>
                                    <span className="text-[10px] font-mono text-muted-foreground leading-none">
                                      <span className="text-green-600 dark:text-green-400 font-bold">د:</span>{rec.checkIn}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                                    {rec.checkIn && (
                                      <span className="text-[10px] font-mono text-muted-foreground leading-none">
                                        <span className="text-green-600 dark:text-green-400 font-bold">د:</span>{rec.checkIn}
                                      </span>
                                    )}
                                    {rec.checkOut && (
                                      <span className="text-[10px] font-mono text-muted-foreground leading-none">
                                        <span className="text-red-500 dark:text-red-400 font-bold">خ:</span>{rec.checkOut}
                                      </span>
                                    )}
                                  </>
                                )}
                              </button>
                            </TableCell>
                          );
                        })}
                        {/* Total cell */}
                        <TableCell className={`text-center font-bold sticky left-0 z-10 border-r p-2 ${overrideScore !== null ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-muted/10"}`}>
                          <div className="flex flex-col items-center gap-1">
                            {overrideScore !== null && !editingScore && (
                              <Badge variant="outline" className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 px-1 py-0">
                                ✓ معدَّل
                              </Badge>
                            )}
                            {editingScore ? (
                              <div className="flex flex-col items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={scoreInput}
                                  onChange={(e) => setScoreInput(e.target.value)}
                                  className="h-7 w-20 text-sm text-center px-1"
                                  data-testid="input-score-override"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-green-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const v = parseFloat(scoreInput);
                                      if (!isNaN(v)) setOverrideMutation.mutate(v);
                                    }}
                                    disabled={setOverrideMutation.isPending}
                                    data-testid="button-save-score"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-muted-foreground"
                                    onClick={(e) => { e.stopPropagation(); setEditingScore(false); }}
                                    data-testid="button-cancel-score"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm font-bold" data-testid="text-total-score">
                                  {displayScore.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground">/{empReport?.totalDays ?? 0}</span>
                                {isOwner && (
                                  <div className="flex gap-0.5 mt-0.5">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-5 w-5"
                                      onClick={(e) => { e.stopPropagation(); setScoreInput(String(displayScore)); setEditingScore(true); }}
                                      data-testid="button-edit-score"
                                      title="تعديل الإجمالي"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    {overrideScore !== null && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5 text-destructive hover:text-destructive"
                                        onClick={(e) => { e.stopPropagation(); deleteOverrideMutation.mutate(); }}
                                        data-testid="button-delete-score-override"
                                        title="إلغاء التعديل"
                                        disabled={deleteOverrideMutation.isPending}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editCell} onOpenChange={(open) => !open && setEditCell(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل سجل {editCell?.date}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>الحالة</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>وقت الدخول</Label>
                  <Input
                    type="time"
                    value={editForm.checkIn}
                    onChange={(e) => setEditForm(f => ({ ...f, checkIn: e.target.value }))}
                    data-testid="input-check-in"
                  />
                </div>
                <div className="space-y-1">
                  <Label>وقت الخروج</Label>
                  <Input
                    type="time"
                    value={editForm.checkOut}
                    onChange={(e) => setEditForm(f => ({ ...f, checkOut: e.target.value }))}
                    data-testid="input-check-out"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button onClick={handleSave} disabled={saveAttendanceMutation.isPending} data-testid="button-save-edit">
                حفظ
              </Button>
              <Button variant="outline" onClick={() => setEditCell(null)} data-testid="button-cancel-edit">
                إلغاء
              </Button>
              {editCell?.attendanceId && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteAttendanceMutation.isPending}
                  className="ml-auto"
                  data-testid="button-delete-edit"
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  حذف
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---- قائمة المفضلة ----
  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          المفضلة
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          الموظفون المفضلون — وصول سريع لسجلات حضورهم
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : favoriteEmployees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
            <Star className="h-14 w-14 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">لم تقم بإضافة أي موظف للمفضلة بعد</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              اذهب إلى صفحة الموظفين واضغط على أيقونة النجمة ⭐ بجانب أي موظف لإضافته هنا
            </p>
            <Link href="/employees">
              <Button variant="outline" className="mt-2" data-testid="link-go-employees">
                <UsersIcon className="h-4 w-4 ml-2" />
                الذهاب إلى الموظفين
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteEmployees.map((emp) => {
            const workshop = workshops.find((w) => w.id === emp.workshopId);
            const position = positions.find((p) => p.id === emp.positionId);
            return (
              <Card key={emp.id} data-testid={`card-favorite-${emp.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{emp.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" data-testid={`text-fav-name-${emp.id}`}>{emp.name}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />{emp.employeeCode}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => toggleFavorite(emp.id)}
                      data-testid={`button-remove-fav-${emp.id}`}
                      title="إزالة من المفضلة"
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {workshop && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Building2 className="h-3 w-3" />{workshop.name}
                      </Badge>
                    )}
                    {position && (
                      <Badge variant="outline" className="text-xs">{position.name}</Badge>
                    )}
                    <Badge variant={emp.shift === "morning" ? "default" : "secondary"} className="text-xs">
                      {emp.shift === "morning" ? "صباحي" : "مسائي"}
                    </Badge>
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => openReport(emp.id)}
                    data-testid={`button-view-attendance-${emp.id}`}
                  >
                    <ClipboardList className="h-4 w-4 ml-2" />
                    عرض سجل الحضور
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
