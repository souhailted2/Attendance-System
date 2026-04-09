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
import { Plus, ClipboardCheck, UserCheck, UserX, Clock, CalendarDays, Radio, Trash2, Search, LogIn, LogOut } from "lucide-react";
import type { Employee, AttendanceRecord } from "@shared/schema";

export default function Attendance() {
  const { toast } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;

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
    mutationFn: ({ recordId, type }: { recordId: string; type: "in" | "out" | "none" | "rest" }) => {
      if (type === "none" || type === "rest") {
        return apiRequest("DELETE", `/api/attendance/${recordId}`);
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
  // canDelete: "in" | "out" | "none" | "rest" — نوع الحذف المسموح للصف
  const allMovements: Array<{
    id: string;
    recordId: string;
    emp: Employee | undefined;
    date: string;
    time: string;
    type: "in" | "out" | "rest";
    middleAbsenceMinutes?: number;
    canDelete: "in" | "out" | "none" | "rest";
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
        allMovements.push({
          id: `${record.id}-p${idx}`,
          recordId: record.id,
          emp,
          date: record.date,
          time: punchTime,
          type: punchType,
          middleAbsenceMinutes: isLast ? recMiddle : undefined,
          canDelete: isFirst ? "in" : isLast ? "out" : "none",
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

  // ترتيب الحركات تنازلياً (الأحدث أولاً)
  allMovements.sort((a, b) => b.time.localeCompare(a.time));

  // تصفية البحث بالاسم أو رقم الموظف
  const q = searchQuery.trim().toLowerCase();
  const movements = q
    ? allMovements.filter((mv) =>
        mv.emp?.name?.toLowerCase().includes(q) ||
        mv.emp?.employeeCode?.toLowerCase().includes(q) ||
        mv.emp?.cardNumber?.toLowerCase().includes(q)
      )
    : allMovements;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" data-testid="text-page-title">سجل الحضور</h1>
            {isToday && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                <Radio className="h-3 w-3 animate-pulse" />
                مباشر
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dateLabel}
            {isToday && dataUpdatedAt > 0 && (
              <span className="mr-2 text-xs">
                · آخر تحديث: {new Date(dataUpdatedAt).toLocaleTimeString("ar-SA")}
              </span>
            )}
          </p>
        </div>
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
        </div>
      </div>

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
      ) : movements.length === 0 && q ? (
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
                                  هل أنت متأكد من حذف وقت <strong>{mv.canDelete === "in" ? "الدخول" : "الخروج"}</strong> للموظف <strong>{mv.emp?.name || "غير معروف"}</strong> بتاريخ {formatArabicDate(mv.date)} الساعة {mv.time || "-"}؟
                                  <br />
                                  سيُمسح هذا الوقت فقط دون حذف بقية بيانات اليوم.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ recordId: mv.recordId, type: mv.canDelete })}
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

      {/* Total count */}
      {allMovements.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {q && movements.length !== allMovements.length
            ? `${movements.length} من ${allMovements.length} حركة`
            : `إجمالي الحركات: ${allMovements.length}`}
        </p>
      )}
    </div>
  );
}
