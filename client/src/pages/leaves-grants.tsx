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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Gift, BarChart3, Trash2, Plus, ChevronLeft, Sun, Moon, Wrench, Users } from "lucide-react";
import type { Workshop } from "@shared/schema";

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  isPaid: boolean;
  targetType: string;
  shiftValue: string | null;
  workshopId: string | null;
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
  const [targetType, setTargetType] = useState<"all" | "shift" | "workshop">("all");
  const [shiftValue, setShiftValue] = useState<"morning" | "evening">("morning");
  const [workshopId, setWorkshopId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: leaves = [], isLoading } = useQuery<Leave[]>({ queryKey: ["/api/leaves"] });

  const createMutation = useMutation({
    mutationFn: (body: object) => apiRequest("POST", "/api/leaves", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      toast({ title: "تم تسجيل العطلة", description: "تمت الإضافة بنجاح" });
      setStartDate(""); setEndDate(""); setNotes("");
      setTargetType("all"); setIsPaid("paid");
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
    const body: Record<string, unknown> = {
      startDate, endDate,
      isPaid: isPaid === "paid",
      targetType,
      notes: notes || null,
    };
    if (targetType === "shift") body.shiftValue = shiftValue;
    if (targetType === "workshop") body.workshopId = workshopId || null;
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
              <Select value={targetType} onValueChange={v => setTargetType(v as "all" | "shift" | "workshop")}>
                <SelectTrigger data-testid="select-target-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل العمال</SelectItem>
                  <SelectItem value="shift">فترة محددة</SelectItem>
                  <SelectItem value="workshop">ورشة محددة</SelectItem>
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

  const shouldFetchReport = view === "employees" && selectedWorkshopId !== null;
  const { data: report, isLoading: reportLoading } = useQuery<AnnualReport>({
    queryKey: ["/api/annual-report", selectedYear, selectedWorkshopId],
    queryFn: async () => {
      const url = `/api/annual-report?year=${selectedYear}&workshopId=${selectedWorkshopId}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: shouldFetchReport,
  });

  // تصفية الورشات حسب الفترة المختارة: نأخذ الورشات التي يوجد فيها عمال بالفترة المحددة
  // (للتبسيط: نعرض كل الورشات ونترك المستخدم يختار)

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
                    {workshops.filter(() => true).length} ورشة
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
        ) : workshops.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد ورشات</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workshops.map(ws => (
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Gift className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg">المنح — قريباً</p>
              <p className="text-sm text-muted-foreground">سيتم إضافة هذه الميزة في تحديث قادم</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annual" className="mt-4">
          <AnnualReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
