import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardCheck, UserCheck, UserX, Clock, CalendarDays, Radio, Trash2, Search, LogIn, LogOut, Fingerprint, X } from "lucide-react";
import type { Employee, AttendanceRecord } from "@shared/schema";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { useAuth } from "@/hooks/use-auth";

const ATTENDANCE_PAGE_SIZE = 30;

export default function Attendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isOwner = user?.username === "owner";

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [date, searchQuery]);

  const [employeeId, setEmployeeId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;

  // --- إضافة بصمة يدوية (مالك فقط) ---
  const [punchOpen, setPunchOpen] = useState(false);
  const [punchSearch, setPunchSearch] = useState("");
  const [punchEmpId, setPunchEmpId] = useState("");
  const [punchEmpName, setPunchEmpName] = useState("");
  const [punchDate, setPunchDate] = useState(today);
  const [punchTime, setPunchTime] = useState(() => new Date().toTimeString().slice(0, 5));

  function resetPunchForm() {
    setPunchSearch(""); setPunchEmpId(""); setPunchEmpName("");
    setPunchDate(today);
    setPunchTime(new Date().toTimeString().slice(0, 5));
  }

  const punchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/attendance?date=${punchDate}`, { credentials: "include" });
      const records: AttendanceRecord[] = await res.json();
      const existing = records.find((r) => r.employeeId === punchEmpId);
      if (!existing) {
        return apiRequest("POST", "/api/attendance", {
          employeeId: punchEmpId, date: punchDate, checkIn: punchTime, status: "present",
        });
      }
      // يوجد سجل: أضف checkOut (أو صحح وقت الخروج)
      return apiRequest("PATCH", `/api/attendance/${existing.id}`, { checkOut: punchTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "تمت إضافة البصمة" });
      setPunchOpen(false);
      resetPunchForm();
    },
    onError: (err: any) => {
      const msg = err?.body?.message ?? err.message ?? "خطأ";
      toast({ title: "خطأ في إضافة البصمة", description: msg, variant: "destructive" });
    },
  });

  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: attendance, isLoading, dataUpdatedAt } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance", `?date=${date}`],
    refetchInterval: isToday ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  // SSE — تحديث فوري لحظة وصول حركة جديدة من الجهاز
  useEffect(() => {
    if (!isToday) return;
    const es = new EventSource("/api/attendance/events");
    es.onmessage = (e) => {
      if (e.data === "update") {
        queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      }
    };
    return () => es.close();
  }, [isToday]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/attendance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "تم تسجيل الحضور بنجاح" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ recordId, type, punchIndex }: { recordId: string; type: "in" | "out" | "punch" | "none" | "rest"; punchIndex?: number }) => {
      if (type === "none" || type === "rest") {
        return apiRequest("DELETE", `/api/attendance/${recordId}`);
      }
      if (type === "punch" && punchIndex !== undefined) {
        return apiRequest("PATCH", `/api/attendance/${recordId}`, { removePunchIndex: punchIndex });
      }
      const patch = type === "in" ? { checkIn: null } : { checkOut: null };
      return apiRequest("PATCH", `/api/attendance/${recordId}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "تم حذف الوقت بنجاح" });
    },
    onError: (err: any) => {
      const msg = err?.body?.message ?? err.message ?? "خطأ في الحذف";
      toast({ title: msg.includes("لم يعجب") ? "التعديل مقفول" : "خطأ في الحذف", description: msg, variant: "destructive" });
    },
  });

  function resetForm() {
    setEmployeeId(""); setCheckIn(""); setCheckOut(""); setStatus("present"); setNotes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ employeeId, date, checkIn, checkOut, status, notes });
  }

  const activeEmployees = employees?.filter((e) => e.isActive) || [];

  const presentCount = attendance?.filter((r) => r.status === "present").length || 0;
  const lateCount    = attendance?.filter((r) => r.status === "late").length || 0;
  const leaveCount   = attendance?.filter((r) => r.status === "leave").length || 0;
  // الغياب = إجمالي الموظفين النشطين ناقص (حاضر + متأخر + إجازة) — الموظف الغائب لا يملك سجلاً
  const absentCount  = Math.max(0, activeEmployees.length - presentCount - lateCount - leaveCount);

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("ar-DZ", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // تنسيق التاريخ: "2026-04-07" → "الثلاثاء 07/04/2026"
  function formatArabicDate(dateStr: string) {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts.map(Number);
    const d = new Date(year, month - 1, day);
    const dayName = d.toLocaleDateString("ar-DZ", { weekday: "long" });
    return `${dayName} ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  }

  // توسيع كل سجل يومي إلى حركات فردية
  // canDelete: "in" | "out" | "punch" | "none" | "rest" — نوع الحذف المسموح للصف
  const allMovements: Array<{
    id: string;
    recordId: string;
    emp: Employee | undefined;
    date: string;
    time: string;
    type: "in" | "out" | "rest";
    middleAbsenceMinutes?: number;
    canDelete: "in" | "out" | "punch" | "none" | "rest";
    punchIndex?: number;
  }> = [];

  for (const record of attendance || []) {
    const emp = employees?.find((e) => e.id === record.employeeId);
    const recMiddle = record.middleAbsenceMinutes;

    // يوم الراحة (مناوبة 24 ساعة)
    if ((record as any).status === "rest") {
      allMovements.push({ id: `${record.id}-rest`, recordId: record.id, emp, date: record.date, time: "", type: "rest", canDelete: "rest" });
      continue;
    }

    // محاولة قراءة البصمات الخام من rawPunches
    let rawPunches: string[] = [];
    try {
      const rp = (record as any).rawPunches;
      if (rp) rawPunches = JSON.parse(rp);
    } catch { rawPunches = []; }

    if (rawPunches.length >= 2) {
      // عرض كل البصمات من rawPunches: index زوجي = دخول، فردي = خروج
      rawPunches.forEach((punchTime, idx) => {
        const punchType: "in" | "out" = idx % 2 === 0 ? "in" : "out";
        const isFirst = idx === 0;
        const isLast = idx === rawPunches.length - 1;
        const isMiddle = !isFirst && !isLast;
        allMovements.push({
          id: `${record.id}-p${idx}`,
          recordId: record.id,
          emp,
          date: record.date,
          time: punchTime,
          type: punchType,
          middleAbsenceMinutes: isLast ? recMiddle : undefined,
          canDelete: isFirst ? "in" : isLast ? "out" : isMiddle ? "punch" : "none",
          punchIndex: idx,
        });
      });
    } else if (rawPunches.length === 1) {
      // دخول فقط بدون خروج
      allMovements.push({ id: `${record.id}-p0`, recordId: record.id, emp, date: record.date, time: rawPunches[0], type: "in", canDelete: "in" });
    } else {
      // لا توجد rawPunches — الطريقة القديمة
      if (record.checkIn) {
        allMovements.push({ id: `${record.id}-in`, recordId: record.id, emp, date: record.date, time: record.checkIn, type: "in", canDelete: "in" });
      }
      if (record.checkOut && record.checkOut !== record.checkIn) {
        allMovements.push({ id: `${record.id}-out`, recordId: record.id, emp, date: record.date, time: record.checkOut, type: "out", middleAbsenceMinutes: recMiddle, canDelete: "out" });
      }
      if (!record.checkIn && !record.checkOut) {
        allMovements.push({ id: `${record.id}-none`, recordId: record.id, emp, date: record.date, time: "", type: "in", canDelete: "none" });
      }
    }
  }

  // ترتيب الحركات: الأحدث أولاً (تنازلياً حسب الوقت)
  allMovements.sort((a, b) => b.time.localeCompare(a.time));

  // تصفية البحث بالاسم أو رقم الموظف
  const q = searchQuery.trim().toLowerCase();
  const filteredMovements = q
    ? allMovements.filter((mv) =>
        mv.emp?.name?.toLowerCase().includes(q) ||
        mv.emp?.employeeCode?.toLowerCase().includes(q) ||
        mv.emp?.cardNumber?.toLowerCase().includes(q)
      )
    : allMovements;

  const attendanceTotalPages = Math.max(1, Math.ceil(filteredMovements.length / ATTENDANCE_PAGE_SIZE));
  const safePage = Math.min(page, attendanceTotalPages);
  const movements = filteredMovements.slice((safePage - 1) * ATTENDANCE_PAGE_SIZE, safePage * ATTENDANCE_PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span>سجل الحضور</span>
            {isToday && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                <Radio className="h-3 w-3 animate-pulse" />
                مباشر
              </span>
            )}
          </span>
        }
        subtitle={
          isToday && dataUpdatedAt > 0
            ? `${dateLabel} · آخر تحديث: ${new Date(dataUpdatedAt).toLocaleTimeString("ar-SA")}`
            : dateLabel
        }
        action={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-48"
              data-testid="input-attendance-date"
            />
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-attendance">
                  <Plus className="h-4 w-4 ml-2" />
                  تسجيل حضور
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل حضور جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>الموظف *</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger data-testid="select-employee">
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} ({e.employeeCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وقت الحضور</Label>
                    <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} data-testid="input-checkin" />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت الانصراف</Label>
                    <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} data-testid="input-checkout" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">حاضر</SelectItem>
                      <SelectItem value="late">متأخر</SelectItem>
                      <SelectItem value="absent">غائب</SelectItem>
                      <SelectItem value="leave">إجازة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-notes" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setOpen(false); resetForm(); }}>إلغاء</Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || !employeeId}
                    data-testid="button-submit-attendance"
                  >
                    تسجيل
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>

            {/* زر إضافة بصمة — للمالك فقط */}
            {isOwner && (
              <Dialog open={punchOpen} onOpenChange={(o) => { setPunchOpen(o); if (!o) resetPunchForm(); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-add-punch">
                    <Fingerprint className="h-4 w-4 ml-2" />
                    إضافة بصمة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة بصمة يدوية</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-1">
                    {/* البحث عن الموظف */}
                    <div className="space-y-2">
                      <Label>الموظف *</Label>
                      {punchEmpId ? (
                        <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/40">
                          <span className="font-medium text-sm">{punchEmpName}</span>
                          <Button
                            type="button" variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => { setPunchEmpId(""); setPunchEmpName(""); setPunchSearch(""); }}
                            data-testid="button-punch-clear-emp"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              placeholder="ابحث بالاسم أو الرقم أو البطاقة..."
                              value={punchSearch}
                              onChange={(e) => setPunchSearch(e.target.value)}
                              className="pr-9"
                              autoFocus
                              data-testid="input-punch-search"
                            />
                          </div>
                          {punchSearch.trim().length > 0 && (
                            <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-sm">
                              {activeEmployees
                                .filter((e) => {
                                  const q = punchSearch.trim().toLowerCase();
                                  return (
                                    e.name?.toLowerCase().includes(q) ||
                                    e.employeeCode?.toLowerCase().includes(q) ||
                                    (e.cardNumber ?? "").toLowerCase().includes(q)
                                  );
                                })
                                .slice(0, 8)
                                .map((e) => (
                                  <button
                                    key={e.id}
                                    type="button"
                                    className="w-full text-right px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2"
                                    onClick={() => { setPunchEmpId(e.id); setPunchEmpName(`${e.name} (${e.employeeCode})`); setPunchSearch(""); }}
                                    data-testid={`option-punch-emp-${e.id}`}
                                  >
                                    <span className="font-medium">{e.name}</span>
                                    <span className="text-muted-foreground text-xs">{e.employeeCode}</span>
                                    {e.cardNumber && <span className="text-muted-foreground text-xs mr-auto font-mono">{e.cardNumber}</span>}
                                  </button>
                                ))}
                              {activeEmployees.filter((e) => {
                                const q = punchSearch.trim().toLowerCase();
                                return e.name?.toLowerCase().includes(q) || e.employeeCode?.toLowerCase().includes(q) || (e.cardNumber ?? "").toLowerCase().includes(q);
                              }).length === 0 && (
                                <p className="px-3 py-3 text-sm text-muted-foreground text-center">لا توجد نتائج</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* التاريخ والوقت */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>التاريخ *</Label>
                        <Input
                          type="date"
                          value={punchDate}
                          onChange={(e) => setPunchDate(e.target.value)}
                          data-testid="input-punch-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الوقت *</Label>
                        <Input
                          type="time"
                          value={punchTime}
                          onChange={(e) => setPunchTime(e.target.value)}
                          data-testid="input-punch-time"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                      سيحدد النظام تلقائياً نوع البصمة: دخول إذا لم يُسجَّل للموظف في هذا اليوم، وخروج إذا كان الدخول مسجلاً.
                    </p>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button" variant="secondary"
                        onClick={() => { setPunchOpen(false); resetPunchForm(); }}
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="button"
                        disabled={!punchEmpId || !punchDate || !punchTime || punchMutation.isPending}
                        onClick={() => punchMutation.mutate()}
                        data-testid="button-submit-punch"
                      >
                        <Fingerprint className="h-4 w-4 ml-2" />
                        {punchMutation.isPending ? "جاري الحفظ..." : "حفظ البصمة"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />
      <div className="p-6 space-y-5">
      {/* Summary stats */}
      {!isLoading && attendance && attendance.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">حاضر</p>
                <p className="text-xl font-bold">{presentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-chart-5/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-chart-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">متأخر</p>
                <p className="text-xl font-bold">{lateCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <UserX className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">غائب</p>
                <p className="text-xl font-bold">{absentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-4 w-4 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجازة</p>
                <p className="text-xl font-bold">{leaveCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search box */}
      {!isLoading && allMovements.length > 0 && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="بحث بالاسم أو رقم الموظف أو رقم البطاقة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
            data-testid="input-search-attendance"
          />
        </div>
      )}

      {/* Movements table */}
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : movements.length === 0 && allMovements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد سجلات حضور لهذا التاريخ</p>
          </CardContent>
        </Card>
      ) : filteredMovements.length === 0 && q ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد نتائج للبحث عن "{searchQuery}"</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-24">رقم الموظف</TableHead>
                    <TableHead className="text-right">اسم الموظف</TableHead>
                    <TableHead className="text-right w-32">رقم البطاقة</TableHead>
                    <TableHead className="text-right w-32">التاريخ</TableHead>
                    <TableHead className="text-right w-36">نوع الحركة</TableHead>
                    <TableHead className="text-right w-32">وقت الحركة</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mv) => (
                    <TableRow key={mv.id} data-testid={`row-movement-${mv.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {mv.emp?.employeeCode || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{mv.emp?.name || "غير معروف"}</p>
                        {mv.middleAbsenceMinutes && mv.middleAbsenceMinutes > 0 ? (
                          <span className="inline-block text-[10px] font-medium text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded mt-0.5" data-testid={`badge-middle-absence-${mv.id}`}>
                            غياب وسط الفترة: {mv.middleAbsenceMinutes} دقيقة
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {mv.emp?.cardNumber || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatArabicDate(mv.date)}
                      </TableCell>
                      <TableCell>
                        {mv.type === "rest" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-md" data-testid={`badge-type-${mv.id}`}>
                            يوم راحة — مناوبة 24 ساعة
                          </span>
                        ) : !mv.time ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md" data-testid={`badge-type-${mv.id}`}>
                            لم يُسجل الوقت
                          </span>
                        ) : mv.type === "in" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-1 rounded-md" data-testid={`badge-type-${mv.id}`}>
                            <LogIn className="h-3.5 w-3.5" />
                            تسجيل الدخول
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-md" data-testid={`badge-type-${mv.id}`}>
                            <LogOut className="h-3.5 w-3.5" />
                            تسجيل الخروج
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mv.time ? (
                          <span className="font-mono text-base font-semibold tabular-nums">
                            {mv.time}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mv.canDelete !== "none" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                data-testid={`button-delete-${mv.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف السجل</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {mv.canDelete === "punch" ? (
                                    <>
                                      هل أنت متأكد من حذف <strong>البصمة الوسيطة</strong> للموظف <strong>{mv.emp?.name || "غير معروف"}</strong> بتاريخ {formatArabicDate(mv.date)} الساعة {mv.time || "-"}؟
                                      <br />
                                      ستُحذف هذه البصمة وتُعاد حساب دقائق الغياب الوسيطي تلقائياً.
                                    </>
                                  ) : (
                                    <>
                                      هل أنت متأكد من حذف وقت <strong>{mv.canDelete === "in" ? "الدخول" : "الخروج"}</strong> للموظف <strong>{mv.emp?.name || "غير معروف"}</strong> بتاريخ {formatArabicDate(mv.date)} الساعة {mv.time || "-"}؟
                                      <br />
                                      سيُمسح هذا الوقت فقط دون حذف بقية بيانات اليوم.
                                    </>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ recordId: mv.recordId, type: mv.canDelete, punchIndex: mv.punchIndex })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Count + Pagination */}
      {allMovements.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground text-center" data-testid="text-movements-count">
            {q && filteredMovements.length !== allMovements.length
              ? `${filteredMovements.length} من ${allMovements.length} حركة`
              : `إجمالي الحركات: ${allMovements.length}`}
          </p>
          {filteredMovements.length > ATTENDANCE_PAGE_SIZE && (
            <Pagination
              currentPage={safePage}
              totalPages={attendanceTotalPages}
              onPageChange={setPage}
              totalItems={filteredMovements.length}
              pageSize={ATTENDANCE_PAGE_SIZE}
              itemLabel="سجل"
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}
