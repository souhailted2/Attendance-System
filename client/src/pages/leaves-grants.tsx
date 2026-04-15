import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Gift, BarChart3, Trash2, Plus, ChevronLeft, Sun, Moon, Wrench, Users, User, X, TrendingUp, TrendingDown, Ban } from "lucide-react";
import { fmtDZD } from "@/lib/utils";
import type { Workshop, Employee } from "@shared/schema";

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  isPaid: boolean;
  targetType: string;
  shiftValue: string | null;
  workshopId: string | null;
  employeeId: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
}

interface AnnualEmployee {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  workshopId: string;
  workshopName: string;
  shift: string;
  months: Record<string, number>;
  annualScore: number;
}

interface AnnualReport {
  year: number;
  fiscalMonths: string[];
  employees: AnnualEmployee[];
}

const MONTH_NAMES: Record<string, string> = {
  "01": "جانفي", "02": "فيفري", "03": "مارس", "04": "أفريل",
  "05": "ماي", "06": "جوان", "07": "جويلية", "08": "أوت",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[m] || m} ${y}`;
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

// ---- Tab: العطل ----
function LeavesTab() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPaid, setIsPaid] = useState<"paid" | "unpaid">("paid");
  const [targetType, setTargetType] = useState<"all" | "shift" | "workshop" | "employee">("all");
  const [shiftValue, setShiftValue] = useState<"morning" | "evening">("morning");
  const [workshopId, setWorkshopId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [notes, setNotes] = useState("");

  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: leaves = [], isLoading } = useQuery<Leave[]>({ queryKey: ["/api/leaves"] });

  const activeEmployees = employees.filter(e => e.isActive);
  const filteredEmployees = employeeSearch.trim()
    ? activeEmployees.filter(e =>
        e.name.includes(employeeSearch) ||
        e.employeeCode.includes(employeeSearch)
      )
    : activeEmployees;

  const createMutation = useMutation({
    mutationFn: (body: object) => apiRequest("POST", "/api/leaves", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      toast({ title: "تم تسجيل العطلة", description: "تمت الإضافة بنجاح" });
      setStartDate(""); setEndDate(""); setNotes("");
      setTargetType("all"); setIsPaid("paid");
      setSelectedEmployeeId(""); setEmployeeSearch("");
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/leaves/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      toast({ title: "تم الحذف" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  function handleSubmit() {
    if (!startDate || !endDate) {
      toast({ title: "خطأ", description: "يجب تحديد تاريخ البداية والنهاية", variant: "destructive" });
      return;
    }
    if (startDate > endDate) {
      toast({ title: "خطأ", description: "تاريخ البداية يجب أن يكون قبل النهاية", variant: "destructive" });
      return;
    }
    if (targetType === "employee" && !selectedEmployeeId) {
      toast({ title: "خطأ", description: "يجب اختيار العامل", variant: "destructive" });
      return;
    }
    const body: Record<string, unknown> = {
      startDate, endDate,
      isPaid: isPaid === "paid",
      targetType,
      notes: notes || null,
    };
    if (targetType === "shift") body.shiftValue = shiftValue;
    if (targetType === "workshop") body.workshopId = workshopId || null;
    if (targetType === "employee") body.employeeId = selectedEmployeeId;
    createMutation.mutate(body);
  }

  function targetLabel(lv: Leave) {
    if (lv.targetType === "all") return <Badge variant="secondary"><Users className="h-3 w-3 ml-1" />كل العمال</Badge>;
    if (lv.targetType === "shift") {
      const icon = lv.shiftValue === "morning" ? <Sun className="h-3 w-3 ml-1" /> : <Moon className="h-3 w-3 ml-1" />;
      return <Badge variant="outline">{icon}{lv.shiftValue === "morning" ? "الفترة الصباحية" : "الفترة المسائية"}</Badge>;
    }
    if (lv.targetType === "workshop") {
      const ws = workshops.find(w => w.id === lv.workshopId);
      return <Badge variant="outline"><Wrench className="h-3 w-3 ml-1" />{ws?.name || "ورشة"}</Badge>;
    }
    if (lv.targetType === "employee") {
      const emp = employees.find(e => e.id === lv.employeeId);
      return <Badge variant="outline"><User className="h-3 w-3 ml-1" />{emp ? `${emp.name} — ${emp.employeeCode}` : "عامل محدد"}</Badge>;
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* نموذج الإضافة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            تسجيل عطلة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label data-testid="label-start-date">تاريخ البداية</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                data-testid="input-leave-start"
              />
            </div>
            <div className="space-y-1">
              <Label data-testid="label-end-date">تاريخ النهاية</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                data-testid="input-leave-end"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>نوع العطلة</Label>
              <Select value={isPaid} onValueChange={v => setIsPaid(v as "paid" | "unpaid")}>
                <SelectTrigger data-testid="select-leave-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">مدفوعة الأجر (1.00)</SelectItem>
                  <SelectItem value="unpaid">غير مدفوعة الأجر (0.00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>المعنيون</Label>
              <Select value={targetType} onValueChange={v => { setTargetType(v as "all" | "shift" | "workshop" | "employee"); setSelectedEmployeeId(""); setEmployeeSearch(""); }}>
                <SelectTrigger data-testid="select-target-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل العمال</SelectItem>
                  <SelectItem value="shift">فترة محددة</SelectItem>
                  <SelectItem value="workshop">ورشة محددة</SelectItem>
                  <SelectItem value="employee">عامل محدد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === "shift" && (
            <div className="space-y-1">
              <Label>الفترة</Label>
              <Select value={shiftValue} onValueChange={v => setShiftValue(v as "morning" | "evening")}>
                <SelectTrigger data-testid="select-shift-value">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning"><Sun className="inline h-3 w-3 ml-1" />الفترة الصباحية</SelectItem>
                  <SelectItem value="evening"><Moon className="inline h-3 w-3 ml-1" />الفترة المسائية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === "workshop" && (
            <div className="space-y-1">
              <Label>الورشة</Label>
              <Select value={workshopId} onValueChange={setWorkshopId}>
                <SelectTrigger data-testid="select-workshop">
                  <SelectValue placeholder="اختر ورشة..." />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === "employee" && (
            <div className="space-y-2">
              <Label>اختر العامل</Label>
              <Input
                placeholder="ابحث بالاسم أو الرقم..."
                value={employeeSearch}
                onChange={e => { setEmployeeSearch(e.target.value); setSelectedEmployeeId(""); }}
                data-testid="input-employee-search"
              />
              {selectedEmployeeId ? (
                <div className="flex items-center gap-2 p-2 rounded-md border border-primary bg-primary/5">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium flex-1">
                    {employees.find(e => e.id === selectedEmployeeId)?.name}
                    {" — "}
                    {employees.find(e => e.id === selectedEmployeeId)?.employeeCode}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setSelectedEmployeeId(""); setEmployeeSearch(""); }}>
                    تغيير
                  </Button>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد نتائج</p>
                  ) : (
                    filteredEmployees.slice(0, 30).map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => { setSelectedEmployeeId(emp.id); setEmployeeSearch(""); }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-right transition-colors"
                        data-testid={`button-select-employee-${emp.id}`}
                      >
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-sm">{emp.name}</span>
                        <span className="text-xs text-muted-foreground">{emp.employeeCode}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label>ملاحظات (اختياري)</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="وصف العطلة..."
              data-testid="input-leave-notes"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="w-full"
            data-testid="button-add-leave"
          >
            <Plus className="h-4 w-4 ml-1" />
            {createMutation.isPending ? "جاري الحفظ..." : "إضافة العطلة"}
          </Button>
        </CardContent>
      </Card>

      {/* قائمة العطل المسجلة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            العطل المسجلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : leaves.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد عطل مسجلة</p>
          ) : (
            <div className="space-y-2">
              {leaves.map(lv => (
                <div
                  key={lv.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                  data-testid={`row-leave-${lv.id}`}
                >
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <Badge variant={lv.isPaid ? "default" : "destructive"} data-testid={`status-leave-${lv.id}`}>
                      {lv.isPaid ? "مدفوعة" : "غير مدفوعة"}
                    </Badge>
                    <span className="text-sm font-medium" data-testid={`text-leave-dates-${lv.id}`}>
                      {lv.startDate === lv.endDate ? lv.startDate : `${lv.startDate} ← ${lv.endDate}`}
                      {" "}
                      <span className="text-muted-foreground">({daysBetween(lv.startDate, lv.endDate)} يوم)</span>
                    </span>
                    {targetLabel(lv)}
                    {lv.notes && <span className="text-xs text-muted-foreground truncate">{lv.notes}</span>}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        data-testid={`button-delete-leave-${lv.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف العطلة</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل تريد حذف هذه العطلة؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(lv.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Tab: التقرير السنوي ----
function AnnualReportTab() {
  const { toast } = useToast();

  // السنوات المتاحة: الـ5 سنوات الأخيرة
  const currentYear = new Date().getFullYear();
  // السنة المالية تبدأ في جويلية، لذا إذا كنا في يناير-يونيو نكون في السنة المالية للسنة الماضية
  const currentFiscalYear = new Date().getMonth() >= 6 ? currentYear : currentYear - 1;
  const availableYears = [currentFiscalYear - 1, currentFiscalYear, currentFiscalYear + 1].filter(y => y >= 2020);

  type View = "shifts" | "workshops" | "employees";
  const [view, setView] = useState<View>("shifts");
  const [selectedYear, setSelectedYear] = useState<number>(currentFiscalYear);
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening" | null>(null);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

  const { data: workshops = [], isLoading: workshopsLoading } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  // الورشات المرتبطة بالفترة المختارة
  const workshopsForShift = selectedShift
    ? workshops.filter(ws =>
        employees.some(e => e.isActive && e.workshopId === ws.id && (e.shift || "morning") === selectedShift)
      )
    : workshops;

  const shouldFetchReport = view === "employees" && selectedWorkshopId !== null && selectedShift !== null;
  const { data: report, isLoading: reportLoading } = useQuery<AnnualReport>({
    queryKey: ["/api/annual-report", selectedYear, selectedWorkshopId, selectedShift],
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(selectedYear) });
      if (selectedWorkshopId) params.set("workshopId", selectedWorkshopId);
      if (selectedShift) params.set("shift", selectedShift);
      const res = await fetch(`/api/annual-report?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: shouldFetchReport,
  });

  // الورشات المرتبطة بالفترة المختارة: الورشات التي يوجد فيها عمال بالفترة المحددة
  // نجلب الموظفين لمعرفة الورشات ذات الصلة

  function scoreColor(score: number): string {
    if (score >= 27) return "text-green-600 dark:text-green-400 font-bold";
    if (score >= 20) return "text-yellow-600 dark:text-yellow-400 font-semibold";
    return "text-red-600 dark:text-red-400 font-semibold";
  }

  // عرض الفترات
  if (view === "shifts") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Label>السنة المالية:</Label>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-48" data-testid="select-fiscal-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(y => (
                <SelectItem key={y} value={String(y)}>
                  {`جويلية ${y} — جوان ${y + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">اختر الفترة لعرض الورشات المرتبطة بها:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["morning", "evening"] as const).map(shift => (
            <Card
              key={shift}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => { setSelectedShift(shift); setView("workshops"); }}
              data-testid={`card-shift-${shift}`}
            >
              <CardContent className="flex items-center gap-4 p-6">
                {shift === "morning"
                  ? <Sun className="h-8 w-8 text-yellow-500" />
                  : <Moon className="h-8 w-8 text-blue-500" />
                }
                <div>
                  <p className="font-semibold text-lg">{shift === "morning" ? "الفترة الصباحية" : "الفترة المسائية"}</p>
                  <p className="text-sm text-muted-foreground">
                    {workshops.filter(ws => employees.some(e => e.isActive && e.workshopId === ws.id && (e.shift || "morning") === shift)).length} ورشة
                  </p>
                </div>
                <ChevronLeft className="h-5 w-5 mr-auto text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // عرض الورشات
  if (view === "workshops") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("shifts")}
            data-testid="button-back-to-shifts"
          >
            <ChevronLeft className="h-4 w-4 ml-1" />
            رجوع
          </Button>
          <Badge variant="outline">
            {selectedShift === "morning" ? <><Sun className="h-3 w-3 ml-1" />الفترة الصباحية</> : <><Moon className="h-3 w-3 ml-1" />الفترة المسائية</>}
          </Badge>
          <Badge variant="secondary">{`جويلية ${selectedYear} — جوان ${selectedYear + 1}`}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">اختر الورشة لعرض التقرير السنوي:</p>

        {workshopsLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : workshopsForShift.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد ورشات مرتبطة بهذه الفترة</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workshopsForShift.map(ws => (
              <Card
                key={ws.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => { setSelectedWorkshopId(ws.id); setView("employees"); }}
                data-testid={`card-workshop-${ws.id}`}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <Wrench className="h-6 w-6 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ws.name}</p>
                    {ws.description && <p className="text-xs text-muted-foreground truncate">{ws.description}</p>}
                  </div>
                  <ChevronLeft className="h-5 w-5 mr-auto text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // عرض جدول الموظفين
  const selectedWorkshop = workshops.find(w => w.id === selectedWorkshopId);
  const fiscalMonths = report?.fiscalMonths ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView("workshops")}
          data-testid="button-back-to-workshops"
        >
          <ChevronLeft className="h-4 w-4 ml-1" />
          رجوع
        </Button>
        <Badge variant="outline">
          {selectedShift === "morning" ? <><Sun className="h-3 w-3 ml-1" />صباحية</> : <><Moon className="h-3 w-3 ml-1" />مسائية</>}
        </Badge>
        <Badge variant="secondary">
          <Wrench className="h-3 w-3 ml-1" />
          {selectedWorkshop?.name}
        </Badge>
        <Badge>{`جويلية ${selectedYear} — جوان ${selectedYear + 1}`}</Badge>
      </div>

      {reportLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : !report ? (
        <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky right-0 bg-background z-10 min-w-[140px]">الموظف</TableHead>
                <TableHead className="min-w-[70px] text-center">الرقم</TableHead>
                {fiscalMonths.map(ym => (
                  <TableHead key={ym} className="min-w-[75px] text-center text-xs">
                    {monthLabel(ym)}
                  </TableHead>
                ))}
                <TableHead className="min-w-[80px] text-center font-bold bg-primary/10">السنوي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center text-muted-foreground py-8">
                    لا يوجد موظفون في هذه الورشة
                  </TableCell>
                </TableRow>
              ) : (
                report.employees.map(emp => (
                  <TableRow key={emp.employeeId} data-testid={`row-annual-${emp.employeeId}`}>
                    <TableCell className="sticky right-0 bg-background font-medium" data-testid={`text-emp-name-${emp.employeeId}`}>
                      {emp.employeeName}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground" data-testid={`text-emp-code-${emp.employeeId}`}>
                      {emp.employeeCode}
                    </TableCell>
                    {fiscalMonths.map(ym => {
                      const score = emp.months[ym] ?? 0;
                      return (
                        <TableCell key={ym} className={`text-center text-sm ${scoreColor(score)}`} data-testid={`text-score-${emp.employeeId}-${ym}`}>
                          {score.toFixed(2)}
                        </TableCell>
                      );
                    })}
                    <TableCell className={`text-center font-bold bg-primary/5 ${scoreColor(emp.annualScore)}`} data-testid={`text-annual-score-${emp.employeeId}`}>
                      {emp.annualScore.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ---- Tab: المنح والعقوبات ----
// ============================================================

interface GrantConditionFull {
  id: string; grantId: string; conditionType: string;
  attendancePeriodType: string | null; attendancePeriodValue: string | null;
  absenceMode: string | null; daysThreshold: string | null;
  weekdayCount: string | null; weekdays: string | null;
  minutesThreshold: number | null; violationsThreshold: number | null;
  effectType: string; effectAmount: string | null;
}
interface GrantFull {
  id: string; name: string; amount: string; type: string;
  targetType: string; shiftValue: string | null; workshopId: string | null;
  employeeIds: string | null; createdAt: string; createdBy: string;
  conditions: GrantConditionFull[];
}
interface ConditionDraft {
  localId: string; conditionType: string;
  attendancePeriodType: string; attendancePeriodValue: string; monthsCount: string;
  specificWeeksDates: string[];
  absenceMode: string; daysThreshold: string; weekdayCount: string; weekdays: string[];
  minutesThreshold: string; violationsThreshold: string;
  effectType: string; effectAmount: string;
}

const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const PERIOD_LABELS: Record<string, string> = {
  day: "يوم", week: "أسبوع", month: "شهر", months: "أشهر (حدد العدد)", year: "سنة",
  specific_day: "يوم محدد", specific_week: "أسبوع محدد",
  specific_weeks: "أسابيع محددة (تواريخ متعددة)", specific_month: "شهر محدد",
};

function conditionSummary(c: GrantConditionFull): string {
  const eff = c.effectType === "cancel" ? "← إلغاء المنحة" :
    c.effectType === "add" ? `← +${fmtDZD(c.effectAmount)}` : `← -${fmtDZD(c.effectAmount)}`;
  if (c.conditionType === "violations_exceed")
    return `تجاوز ${c.violationsThreshold} عقوبة ${eff}`;
  if (c.conditionType === "late")
    return `تأخر > ${c.minutesThreshold} دق ${eff}`;
  if (c.conditionType === "early_leave")
    return `خروج مبكر > ${c.minutesThreshold} دق ${eff}`;
  if (c.conditionType === "attendance") {
    const pt = PERIOD_LABELS[c.attendancePeriodType ?? ""] ?? c.attendancePeriodType;
    let pv: string;
    if (c.attendancePeriodType === "months") {
      pv = `${c.attendancePeriodValue} أشهر`;
    } else if (c.attendancePeriodType === "specific_weeks") {
      try { const weeks = JSON.parse(c.attendancePeriodValue ?? "[]") as string[]; pv = `${weeks.length} أسابيع محددة`; } catch { pv = "أسابيع محددة"; }
    } else if (["specific_day", "specific_week", "specific_month"].includes(c.attendancePeriodType ?? "")) {
      pv = c.attendancePeriodValue ?? "";
    } else {
      pv = pt;
    }
    return `غياب في (${pv}) ${eff}`;
  }
  if (c.conditionType === "absence") {
    let base = "";
    if (c.absenceMode === "count") {
      base = c.daysThreshold === "1" ? "يوم غياب" : c.daysThreshold === "2" ? "يومي غياب" : "أكثر من يومين غياب";
    } else {
      const days = c.weekdays ? JSON.parse(c.weekdays).join(" و") : "";
      base = `غياب ${days}`;
    }
    return `${base} ${eff}`;
  }
  return c.conditionType;
}

function targetLabel(g: GrantFull, workshops: Workshop[]): string {
  if (g.targetType === "all") return "كل العمال";
  if (g.targetType === "shift") return g.shiftValue === "morning" ? "الفترة الصباحية" : "الفترة المسائية";
  if (g.targetType === "workshop") {
    const ws = workshops.find(w => w.id === g.workshopId);
    return ws ? `ورشة: ${ws.name}` : "ورشة";
  }
  if (g.targetType === "employee") {
    try { const ids = JSON.parse(g.employeeIds ?? "[]"); return `${ids.length} موظف محدد`; } catch { return "موظف محدد"; }
  }
  return g.targetType;
}

function newCondition(): ConditionDraft {
  return {
    localId: Math.random().toString(36).slice(2),
    conditionType: "", attendancePeriodType: "month", attendancePeriodValue: "", monthsCount: "2",
    specificWeeksDates: [],
    absenceMode: "count", daysThreshold: "1", weekdayCount: "1", weekdays: [],
    minutesThreshold: "30", violationsThreshold: "3", effectType: "deduct", effectAmount: "",
  };
}

function conditionToPayload(c: ConditionDraft) {
  const base = { conditionType: c.conditionType, effectType: c.effectType, effectAmount: c.effectAmount || null };
  if (c.conditionType === "attendance") {
    let periodValue: string | null = null;
    if (c.attendancePeriodType === "months") periodValue = c.monthsCount;
    else if (c.attendancePeriodType === "specific_weeks") periodValue = JSON.stringify(c.specificWeeksDates);
    else if (["specific_day", "specific_week", "specific_month"].includes(c.attendancePeriodType)) periodValue = c.attendancePeriodValue || null;
    return { ...base, attendancePeriodType: c.attendancePeriodType, attendancePeriodValue: periodValue };
  }
  if (c.conditionType === "late" || c.conditionType === "early_leave")
    return { ...base, minutesThreshold: parseInt(c.minutesThreshold) || 0 };
  if (c.conditionType === "absence") return {
    ...base,
    absenceMode: c.absenceMode,
    daysThreshold: c.absenceMode === "count" ? c.daysThreshold : null,
    weekdayCount: c.absenceMode === "weekday" ? c.weekdayCount : null,
    weekdays: c.absenceMode === "weekday" ? JSON.stringify(c.weekdays) : null,
  };
  if (c.conditionType === "violations_exceed")
    return { ...base, violationsThreshold: parseInt(c.violationsThreshold) || 1, effectType: "cancel", effectAmount: null };
  return base;
}

function ConditionRow({ cond, onChange, onDelete }: {
  cond: ConditionDraft;
  onChange: (c: ConditionDraft) => void;
  onDelete: () => void;
}) {
  const set = (patch: Partial<ConditionDraft>) => onChange({ ...cond, ...patch });
  const toggleWeekday = (day: string) => {
    const next = cond.weekdays.includes(day)
      ? cond.weekdays.filter(d => d !== day)
      : [...cond.weekdays, day];
    set({ weekdays: next });
  };

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/30 relative">
      <Button variant="ghost" size="icon" className="absolute top-2 left-2 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDelete} data-testid="button-delete-condition">
        <X className="h-4 w-4" />
      </Button>
      <div className="w-full pl-8">
        <Select value={cond.conditionType} onValueChange={v => {
          if (v === "attendance") set({ conditionType: v, effectType: "cancel", effectAmount: "" });
          else set({ conditionType: v, effectType: "deduct", effectAmount: "" });
        }}>
          <SelectTrigger className="w-full" data-testid="select-condition-type">
            <SelectValue placeholder="اختر نوع الشرط..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="attendance">شرط الحضور الكامل</SelectItem>
            <SelectItem value="late">شرط التأخر</SelectItem>
            <SelectItem value="early_leave">شرط الخروج المبكر</SelectItem>
            <SelectItem value="absence">شرط الغياب</SelectItem>
            <SelectItem value="violations_exceed">شرط تجاوز العقوبات (إلغاء المنحة)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {cond.conditionType === "attendance" && (
        <div className="space-y-2">
          <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1.5 text-xs text-amber-800 dark:text-amber-200">
            <span>⚠</span>
            <span>يُفعَّل هذا الشرط عند غياب الموظف في الفترة المختارة (الحضور غير كامل)</span>
          </div>
          <Label className="text-xs text-muted-foreground">فترة الحضور المطلوبة</Label>
          <Select value={cond.attendancePeriodType} onValueChange={v => set({ attendancePeriodType: v })}>
            <SelectTrigger data-testid="select-attendance-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">يوم</SelectItem>
              <SelectItem value="week">أسبوع</SelectItem>
              <SelectItem value="month">شهر</SelectItem>
              <SelectItem value="months">عدة أشهر (حدد العدد)</SelectItem>
              <SelectItem value="year">سنة</SelectItem>
              <SelectItem value="specific_day">يوم محدد</SelectItem>
              <SelectItem value="specific_week">أسبوع محدد (تاريخ البداية)</SelectItem>
              <SelectItem value="specific_weeks">أسابيع محددة (تواريخ متعددة)</SelectItem>
              <SelectItem value="specific_month">شهر محدد</SelectItem>
            </SelectContent>
          </Select>
          {cond.attendancePeriodType === "months" && (
            <Input type="number" min={1} placeholder="عدد الأشهر" value={cond.monthsCount}
              onChange={e => set({ monthsCount: e.target.value })} data-testid="input-months-count" />
          )}
          {cond.attendancePeriodType === "specific_day" && (
            <Input type="date" value={cond.attendancePeriodValue}
              onChange={e => set({ attendancePeriodValue: e.target.value })} data-testid="input-specific-day" />
          )}
          {cond.attendancePeriodType === "specific_week" && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ بداية الأسبوع</p>
              <Input type="date" value={cond.attendancePeriodValue}
                onChange={e => set({ attendancePeriodValue: e.target.value })} data-testid="input-specific-week" />
            </div>
          )}
          {cond.attendancePeriodType === "specific_month" && (
            <Input type="month" value={cond.attendancePeriodValue}
              onChange={e => set({ attendancePeriodValue: e.target.value })} data-testid="input-specific-month" />
          )}
          {cond.attendancePeriodType === "specific_weeks" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">تواريخ بداية الأسابيع</Label>
              {cond.specificWeeksDates.map((date, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input type="date" value={date}
                    onChange={e => {
                      const updated = [...cond.specificWeeksDates];
                      updated[idx] = e.target.value;
                      set({ specificWeeksDates: updated });
                    }}
                    data-testid={`input-specific-week-${idx}`} />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                    onClick={() => set({ specificWeeksDates: cond.specificWeeksDates.filter((_, i) => i !== idx) })}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1"
                onClick={() => set({ specificWeeksDates: [...cond.specificWeeksDates, ""] })}
                data-testid="button-add-specific-week">
                <Plus className="h-3 w-3" /> إضافة أسبوع
              </Button>
            </div>
          )}
        </div>
      )}

      {(cond.conditionType === "late" || cond.conditionType === "early_leave") && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">إذا تجاوز</Label>
          <Input type="number" min={0} className="w-20" value={cond.minutesThreshold}
            onChange={e => set({ minutesThreshold: e.target.value })} data-testid="input-minutes-threshold" />
          <span className="text-xs text-muted-foreground">دقيقة</span>
        </div>
      )}

      {cond.conditionType === "absence" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">نمط الغياب</Label>
          <Select value={cond.absenceMode} onValueChange={v => set({ absenceMode: v })}>
            <SelectTrigger data-testid="select-absence-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">بعدد الأيام (عام)</SelectItem>
              <SelectItem value="weekday">بأيام الأسبوع (محدد — أولوية على العام)</SelectItem>
            </SelectContent>
          </Select>
          {cond.absenceMode === "count" && (
            <Select value={cond.daysThreshold} onValueChange={v => set({ daysThreshold: v })}>
              <SelectTrigger data-testid="select-days-threshold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">يوم واحد</SelectItem>
                <SelectItem value="2">يومان</SelectItem>
                <SelectItem value="more">أكثر من يومين</SelectItem>
              </SelectContent>
            </Select>
          )}
          {cond.absenceMode === "weekday" && (
            <div className="space-y-2">
              <Select value={cond.weekdayCount} onValueChange={v => set({ weekdayCount: v })}>
                <SelectTrigger data-testid="select-weekday-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">يوم واحد من الأسبوع</SelectItem>
                  <SelectItem value="2">يومان من الأسبوع</SelectItem>
                  <SelectItem value="more">أكثر من يومين من الأسبوع</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-xs text-muted-foreground">اختر الأيام</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS_AR.map(day => (
                  <label key={day} className="flex items-center gap-1 cursor-pointer text-sm" data-testid={`checkbox-weekday-${day}`}>
                    <Checkbox
                      checked={cond.weekdays.includes(day)}
                      onCheckedChange={() => toggleWeekday(day)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {cond.conditionType === "violations_exceed" && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">إذا تجاوز عدد العقوبات</Label>
          <Input type="number" min={1} className="w-20" value={cond.violationsThreshold}
            onChange={e => set({ violationsThreshold: e.target.value })} data-testid="input-violations-threshold" />
          <span className="text-xs text-muted-foreground">عقوبة</span>
        </div>
      )}

      {cond.conditionType !== "" && cond.conditionType !== "violations_exceed" && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">الأثر</Label>
          <Select value={cond.effectType} onValueChange={v => set({ effectType: v })}>
            <SelectTrigger className="w-36" data-testid="select-effect-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cond.conditionType === "attendance" && (
                <SelectItem value="cancel">إلغاء المنحة</SelectItem>
              )}
              <SelectItem value="deduct">يُخصم منه</SelectItem>
              <SelectItem value="add">يُضاف له</SelectItem>
            </SelectContent>
          </Select>
          {cond.effectType !== "cancel" && (
            <>
              <Input type="number" min={0} placeholder="المبلغ (دج)" value={cond.effectAmount}
                onChange={e => set({ effectAmount: e.target.value })} className="w-32" data-testid="input-effect-amount" />
              <span className="text-xs text-muted-foreground">دج</span>
            </>
          )}
          {cond.effectType === "cancel" && (
            <span className="text-sm text-destructive font-medium">تُلغى المنحة بالكامل</span>
          )}
        </div>
      )}

      {cond.conditionType === "violations_exceed" && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <Ban className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">تُلغى المنحة بالكامل عند تحقق هذا الشرط</span>
        </div>
      )}
    </div>
  );
}

function GrantCard({ grant, workshops, employees, onDelete }: {
  grant: GrantFull; workshops: Workshop[]; employees: Employee[]; onDelete: () => void;
}) {
  const isGrant = grant.type === "grant";
  const empIds: string[] = grant.employeeIds ? JSON.parse(grant.employeeIds) : [];
  const empNames = empIds.map(id => employees.find(e => e.id === id)?.name ?? id).join("، ");

  return (
    <Card className={`border-r-4 ${isGrant ? "border-r-green-500" : "border-r-red-500"}`} data-testid={`card-grant-${grant.id}`}>
      <CardContent className="pt-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base">{grant.name}</span>
            <Badge variant={isGrant ? "default" : "destructive"} className="text-xs">
              {isGrant ? "منحة" : "عقوبة"}
            </Badge>
            <Badge variant="outline" className="text-xs font-bold">
              {fmtDZD(grant.amount)}
            </Badge>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" data-testid={`button-delete-grant-${grant.id}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>سيتم حذف "{grant.name}" وكل شروطها. لا يمكن التراجع.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">{targetLabel(grant, workshops)}</Badge>
          {grant.targetType === "employee" && empNames && (
            <span className="text-xs text-muted-foreground">{empNames}</span>
          )}
        </div>
        {grant.conditions.length > 0 && (
          <div className="space-y-1 pt-1">
            {grant.conditions.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                {c.effectType === "add" ? <TrendingUp className="h-3 w-3 text-green-600 shrink-0" /> :
                  c.effectType === "deduct" ? <TrendingDown className="h-3 w-3 text-red-600 shrink-0" /> :
                    <Ban className="h-3 w-3 text-orange-600 shrink-0" />}
                <span>{conditionSummary(c)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GrantsTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [grantName, setGrantName] = useState("");
  const [grantAmount, setGrantAmount] = useState("");
  const [grantType, setGrantType] = useState<"grant" | "penalty">("grant");
  const [targetType, setTargetType] = useState<"all" | "shift" | "workshop" | "employee">("all");
  const [shiftValue, setShiftValue] = useState<"morning" | "evening">("morning");
  const [workshopId, setWorkshopId] = useState("");
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [conditions, setConditions] = useState<ConditionDraft[]>([]);
  const [empSearch, setEmpSearch] = useState("");

  const { data: grants = [], isLoading: grantsLoading } = useQuery<GrantFull[]>({ queryKey: ["/api/grants"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  const addMutation = useMutation({
    mutationFn: (body: object) => apiRequest("POST", "/api/grants", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({ title: "تم الحفظ", description: `تمت إضافة "${grantName}" بنجاح` });
      resetForm();
      setDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/grants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({ title: "تم الحذف" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  function resetForm() {
    setGrantName(""); setGrantAmount(""); setGrantType("grant");
    setTargetType("all"); setShiftValue("morning"); setWorkshopId("");
    setSelectedEmpIds([]); setConditions([]); setEmpSearch("");
  }

  function handleSubmit() {
    if (!grantName.trim()) return toast({ title: "اسم المنحة مطلوب", variant: "destructive" });
    if (!grantAmount || isNaN(parseFloat(grantAmount))) return toast({ title: "المبلغ يجب أن يكون رقماً", variant: "destructive" });
    if (targetType === "workshop" && !workshopId) return toast({ title: "اختر الورشة", variant: "destructive" });
    if (targetType === "employee" && selectedEmpIds.length === 0) return toast({ title: "اختر موظفاً واحداً على الأقل", variant: "destructive" });
    for (const c of conditions) {
      if (!c.conditionType) return toast({ title: "اختر نوع الشرط لكل صف", variant: "destructive" });
      if (c.conditionType !== "violations_exceed" && c.effectType !== "cancel" && !c.effectAmount) return toast({ title: "أدخل مبلغ الأثر لكل شرط", variant: "destructive" });
      if (c.conditionType === "absence" && c.absenceMode === "weekday" && c.weekdays.length === 0)
        return toast({ title: "اختر يوماً واحداً على الأقل في شرط الغياب", variant: "destructive" });
    }
    addMutation.mutate({
      name: grantName.trim(),
      amount: String(parseFloat(grantAmount)),
      type: grantType,
      targetType,
      shiftValue: targetType === "shift" ? shiftValue : null,
      workshopId: targetType === "workshop" ? workshopId : null,
      employeeIds: targetType === "employee" ? JSON.stringify(selectedEmpIds) : null,
      conditions: conditions.map(conditionToPayload),
    });
  }

  const grantsList = grants.filter(g => g.type === "grant");
  const penaltiesList = grants.filter(g => g.type === "penalty");
  const filteredEmps = employees.filter(e =>
    e.isActive && (empSearch === "" || e.name.includes(empSearch) || e.employeeCode.includes(empSearch))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">المنح والعقوبات</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2" data-testid="button-add-grant">
          <Plus className="h-4 w-4" /> إضافة منحة / عقوبة
        </Button>
      </div>

      {grantsLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* المنح */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-700 dark:text-green-400">المنح ({grantsList.length})</h3>
            </div>
            {grantsList.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">لا توجد منح مضافة</CardContent></Card>
            ) : (
              grantsList.map(g => (
                <GrantCard key={g.id} grant={g} workshops={workshops} employees={employees}
                  onDelete={() => deleteMutation.mutate(g.id)} />
              ))
            )}
          </div>
          {/* العقوبات */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-700 dark:text-red-400">العقوبات ({penaltiesList.length})</h3>
            </div>
            {penaltiesList.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">لا توجد عقوبات مضافة</CardContent></Card>
            ) : (
              penaltiesList.map(g => (
                <GrantCard key={g.id} grant={g} workshops={workshops} employees={employees}
                  onDelete={() => deleteMutation.mutate(g.id)} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة منحة / عقوبة جديدة</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pl-1">
            <div className="space-y-4 pl-2">
              {/* الاسم والمبلغ والنوع */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label data-testid="label-grant-name">الاسم</Label>
                  <Input placeholder="مثال: منحة المداومة" value={grantName}
                    onChange={e => setGrantName(e.target.value)} data-testid="input-grant-name" />
                </div>
                <div className="space-y-1">
                  <Label>المبلغ (دج)</Label>
                  <Input type="number" min={0} placeholder="5000" value={grantAmount}
                    onChange={e => setGrantAmount(e.target.value)} data-testid="input-grant-amount" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>النوع</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={grantType === "grant" ? "default" : "outline"}
                    className="gap-2 flex-1" onClick={() => setGrantType("grant")} data-testid="button-type-grant">
                    <TrendingUp className="h-4 w-4" /> منحة
                  </Button>
                  <Button type="button" variant={grantType === "penalty" ? "destructive" : "outline"}
                    className="gap-2 flex-1" onClick={() => setGrantType("penalty")} data-testid="button-type-penalty">
                    <TrendingDown className="h-4 w-4" /> عقوبة
                  </Button>
                </div>
              </div>

              <Separator />

              {/* النطاق */}
              <div className="space-y-2">
                <Label>نطاق التطبيق</Label>
                <Select value={targetType} onValueChange={v => setTargetType(v as "all" | "shift" | "workshop" | "employee")}>
                  <SelectTrigger data-testid="select-target-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"><span className="flex items-center gap-2"><Users className="h-4 w-4" />كل العمال</span></SelectItem>
                    <SelectItem value="shift"><span className="flex items-center gap-2"><Sun className="h-4 w-4" />فترة معينة</span></SelectItem>
                    <SelectItem value="workshop"><span className="flex items-center gap-2"><Wrench className="h-4 w-4" />ورشة محددة</span></SelectItem>
                    <SelectItem value="employee"><span className="flex items-center gap-2"><User className="h-4 w-4" />عامل أو أكثر</span></SelectItem>
                  </SelectContent>
                </Select>
                {targetType === "shift" && (
                  <Select value={shiftValue} onValueChange={v => setShiftValue(v as "morning" | "evening")}>
                    <SelectTrigger data-testid="select-shift-value"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning"><Sun className="h-4 w-4 inline ml-1" />صباحية</SelectItem>
                      <SelectItem value="evening"><Moon className="h-4 w-4 inline ml-1" />مسائية</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {targetType === "workshop" && (
                  <Select value={workshopId} onValueChange={setWorkshopId}>
                    <SelectTrigger data-testid="select-workshop-id"><SelectValue placeholder="اختر الورشة..." /></SelectTrigger>
                    <SelectContent>
                      {workshops.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {targetType === "employee" && (
                  <div className="space-y-2 border rounded-lg p-2">
                    <Input placeholder="بحث باسم أو رقم..." value={empSearch}
                      onChange={e => setEmpSearch(e.target.value)} data-testid="input-emp-search" />
                    <ScrollArea className="h-40">
                      <div className="space-y-1">
                        {filteredEmps.map(emp => (
                          <label key={emp.id} className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer text-sm">
                            <Checkbox
                              checked={selectedEmpIds.includes(emp.id)}
                              onCheckedChange={checked => {
                                setSelectedEmpIds(prev =>
                                  checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id)
                                );
                              }}
                              data-testid={`checkbox-emp-${emp.id}`}
                            />
                            <span>{emp.name}</span>
                            <span className="text-muted-foreground text-xs">{emp.employeeCode}</span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                    {selectedEmpIds.length > 0 && (
                      <p className="text-xs text-primary">{selectedEmpIds.length} موظف محدد</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* الشروط */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>الشروط</Label>
                  <Button type="button" variant="outline" size="sm" className="gap-2"
                    onClick={() => setConditions(prev => [...prev, newCondition()])} data-testid="button-add-condition">
                    <Plus className="h-4 w-4" /> إضافة شرط
                  </Button>
                </div>
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p><strong>قاعدة الأولوية:</strong> يُحسب شرط "تجاوز العقوبات" أولاً — إذا تحقق تُلغى المنحة بالكامل.</p>
                  <p><strong>الغياب:</strong> شرط "يوم أسبوع محدد" (محدد) يلغي شرط "بعدد الأيام" (عام) عند التطابق — لا يُجمعان.</p>
                </div>
                {conditions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">لا توجد شروط — المبلغ الأساسي يُمنح كاملاً</p>
                )}
                {conditions.map((c, i) => (
                  <ConditionRow key={c.localId} cond={c}
                    onChange={updated => setConditions(prev => prev.map((x, j) => j === i ? updated : x))}
                    onDelete={() => setConditions(prev => prev.filter((_, j) => j !== i))} />
                ))}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-grant">إلغاء</Button>
            <Button onClick={handleSubmit} disabled={addMutation.isPending} data-testid="button-save-grant">
              {addMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- الصفحة الرئيسية ----
export default function LeavesGrants() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">العطل والمنح</h1>
      </div>

      <Tabs defaultValue="leaves" dir="rtl">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="leaves" className="flex items-center gap-2" data-testid="tab-leaves">
            <CalendarDays className="h-4 w-4" />
            العطل
          </TabsTrigger>
          <TabsTrigger value="grants" className="flex items-center gap-2" data-testid="tab-grants">
            <Gift className="h-4 w-4" />
            المنح
          </TabsTrigger>
          <TabsTrigger value="annual" className="flex items-center gap-2" data-testid="tab-annual">
            <BarChart3 className="h-4 w-4" />
            التقرير السنوي
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaves" className="mt-4">
          <LeavesTab />
        </TabsContent>

        <TabsContent value="grants" className="mt-4">
          <GrantsTab />
        </TabsContent>

        <TabsContent value="annual" className="mt-4">
          <AnnualReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
