import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CalendarRange, Plus, Trash2, RefreshCw, Pencil, Moon, Clock } from "lucide-react";
import type { WorkRule } from "@shared/schema";

interface ScheduleOverride {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  workRuleId: string | null;
  workStartTime: string;
  workEndTime: string;
  isOvernight: boolean;
  notes: string | null;
  weeklyOffDays: number[] | null;
}

const WEEKDAYS = [
  { dow: 0, label: "الأحد" },
  { dow: 1, label: "الاثنين" },
  { dow: 2, label: "الثلاثاء" },
  { dow: 3, label: "الأربعاء" },
  { dow: 4, label: "الخميس" },
  { dow: 5, label: "الجمعة" },
  { dow: 6, label: "السبت" },
];

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

function formatTime(t: string) {
  return t;
}

const EMPTY_FORM = {
  name: "",
  dateFrom: "",
  dateTo: "",
  workRuleId: "__all__",
  workStartTime: "",
  workEndTime: "",
  isOvernight: false,
  notes: "",
  weeklyOffDays: [] as number[],
};

export default function ScheduleOverrides() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [recalcId, setRecalcId] = useState<string | null>(null);

  const { data: overrides = [], isLoading } = useQuery<ScheduleOverride[]>({
    queryKey: ["/api/schedule-overrides"],
  });

  const { data: workRules = [] } = useQuery<WorkRule[]>({
    queryKey: ["/api/work-rules"],
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => apiRequest("POST", "/api/schedule-overrides", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-overrides"] });
      toast({ title: "تم إنشاء الجدول الخاص بنجاح" });
      setShowDialog(false);
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) => apiRequest("PATCH", `/api/schedule-overrides/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-overrides"] });
      toast({ title: "تم تحديث الجدول الخاص بنجاح" });
      setShowDialog(false);
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/schedule-overrides/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-overrides"] });
      toast({ title: "تم حذف الجدول الخاص" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const recalcMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/schedule-overrides/${id}/recalculate`, {});
      return res.json() as Promise<{ message: string; updated: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/monthly-trend"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/monthly-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/weekly"] });
      toast({ title: "تمت إعادة الحساب بنجاح", description: `تم إعادة حساب ${data?.updated ?? 0} سجل` });
      setRecalcId(null);
    },
    onError: (e: any) => {
      toast({ title: "خطأ في إعادة الحساب", description: e.message, variant: "destructive" });
      setRecalcId(null);
    },
  });

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowDialog(true);
  }

  function openEdit(o: ScheduleOverride) {
    setEditId(o.id);
    setForm({
      name: o.name,
      dateFrom: o.dateFrom,
      dateTo: o.dateTo,
      workRuleId: o.workRuleId || "__all__",
      workStartTime: o.workStartTime,
      workEndTime: o.workEndTime,
      isOvernight: o.isOvernight,
      notes: o.notes || "",
      weeklyOffDays: o.weeklyOffDays ?? [],
    });
    setShowDialog(true);
  }

  function toggleWeekDay(dow: number) {
    setForm(prev => {
      const cur = prev.weeklyOffDays;
      return {
        ...prev,
        weeklyOffDays: cur.includes(dow) ? cur.filter(d => d !== dow) : [...cur, dow],
      };
    });
  }

  function handleSubmit() {
    if (!form.name || !form.dateFrom || !form.dateTo || !form.workStartTime || !form.workEndTime) {
      toast({ title: "يرجى تعبئة جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const body = {
      name: form.name,
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      workRuleId: form.workRuleId === "__all__" ? null : form.workRuleId,
      workStartTime: form.workStartTime,
      workEndTime: form.workEndTime,
      isOvernight: form.isOvernight,
      notes: form.notes || null,
      weeklyOffDays: form.weeklyOffDays.length > 0 ? form.weeklyOffDays : null,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, body });
    } else {
      createMutation.mutate(body);
    }
  }

  function getWorkRuleName(id: string | null) {
    if (!id) return "جميع الجداول";
    const wr = workRules.find((r) => r.id === id);
    return wr ? wr.name : id;
  }

  function getOffDaysLabel(days: number[] | null): string {
    if (!days || days.length === 0) return "";
    return days.map(d => WEEKDAYS.find(w => w.dow === d)?.label ?? d).join(" + ");
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">جداول خاصة</h1>
            <p className="text-sm text-muted-foreground">جداول العمل الاستثنائية (رمضان، المواسم، إلخ)</p>
          </div>
        </div>
        <Button onClick={openCreate} data-testid="button-create-override">
          <Plus className="h-4 w-4 ml-1" />
          إضافة جدول خاص
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">قائمة الجداول الخاصة</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : overrides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarRange className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد جداول خاصة بعد</p>
              <p className="text-sm mt-1">أضف جدولاً خاصاً لرمضان أو أي فترة استثنائية</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">من</TableHead>
                  <TableHead className="text-right">إلى</TableHead>
                  <TableHead className="text-right">المدة</TableHead>
                  <TableHead className="text-right">قاعدة العمل</TableHead>
                  <TableHead className="text-right">وقت العمل</TableHead>
                  <TableHead className="text-right">أيام الراحة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.map((o) => (
                  <TableRow key={o.id} data-testid={`row-override-${o.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {o.isOvernight && <Moon className="h-3.5 w-3.5 text-blue-500" />}
                        {o.name}
                      </div>
                    </TableCell>
                    <TableCell>{o.dateFrom}</TableCell>
                    <TableCell>{o.dateTo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{daysBetween(o.dateFrom, o.dateTo)} يوم</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getWorkRuleName(o.workRuleId)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatTime(o.workStartTime)}</span>
                        <span className="text-muted-foreground">←</span>
                        <span>{formatTime(o.workEndTime)}</span>
                        {o.isOvernight && <Badge variant="secondary" className="text-xs">ليلي</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {o.weeklyOffDays && o.weeklyOffDays.length > 0 ? (
                        <span className="text-xs text-muted-foreground">{getOffDaysLabel(o.weeklyOffDays)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(o)}
                          data-testid={`button-edit-override-${o.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                              data-testid={`button-recalc-override-${o.id}`}
                              onClick={() => setRecalcId(o.id)}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>إعادة حساب الحضور</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم إعادة حساب سجلات الحضور للفترة من <strong>{o.dateFrom}</strong> إلى <strong>{o.dateTo}</strong> باستخدام أوقات الجدول الخاص <strong>"{o.name}"</strong>.
                                <br /><br />
                                هذه العملية ستُحدّث: دقائق التأخر، دقائق الخروج المبكر، إجمالي الساعات، والغرامات.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => recalcMutation.mutate(o.id)}
                                disabled={recalcMutation.isPending}
                                data-testid={`button-confirm-recalc-${o.id}`}
                              >
                                {recalcMutation.isPending ? "جارٍ الحساب..." : "تأكيد إعادة الحساب"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-override-${o.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الجدول الخاص</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف الجدول الخاص "{o.name}"؟ لن يتم التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(o.id)}
                                data-testid={`button-confirm-delete-${o.id}`}
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {overrides.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-muted-foreground">
              <strong>ملاحظة:</strong> زر <RefreshCw className="h-3 w-3 inline mx-1 text-green-600 dark:text-green-400" /> يُعيد حساب سجلات الحضور الموجودة في قاعدة البيانات للفترة المحددة وفق أوقات الجدول الخاص. لا يُنشئ سجلات جديدة.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? "تعديل الجدول الخاص" : "إضافة جدول خاص"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto flex-1 px-1">
            <div className="space-y-1">
              <Label htmlFor="override-name">اسم الجدول *</Label>
              <Input
                id="override-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: رمضان 2026، الفترة الصيفية"
                data-testid="input-override-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="override-date-from">من تاريخ *</Label>
                <Input
                  id="override-date-from"
                  type="date"
                  value={form.dateFrom}
                  onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
                  data-testid="input-override-date-from"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="override-date-to">إلى تاريخ *</Label>
                <Input
                  id="override-date-to"
                  type="date"
                  value={form.dateTo}
                  onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
                  data-testid="input-override-date-to"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>قاعدة العمل المستهدفة</Label>
              <Select
                value={form.workRuleId}
                onValueChange={(v) => setForm({ ...form, workRuleId: v })}
              >
                <SelectTrigger data-testid="select-override-work-rule">
                  <SelectValue placeholder="اختر قاعدة عمل أو اتركها للكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">جميع قواعد العمل</SelectItem>
                  {workRules.map((wr) => (
                    <SelectItem key={wr.id} value={wr.id}>{wr.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">إذا تركتها "الكل"، سيُطبَّق الجدول على جميع الموظفين في الفترة</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="override-start">وقت بدء العمل *</Label>
                <Input
                  id="override-start"
                  type="time"
                  value={form.workStartTime}
                  onChange={(e) => setForm({ ...form, workStartTime: e.target.value })}
                  data-testid="input-override-start-time"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="override-end">وقت انتهاء العمل *</Label>
                <Input
                  id="override-end"
                  type="time"
                  value={form.workEndTime}
                  onChange={(e) => setForm({ ...form, workEndTime: e.target.value })}
                  data-testid="input-override-end-time"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Switch
                id="override-overnight"
                checked={form.isOvernight}
                onCheckedChange={(v) => setForm({ ...form, isOvernight: v })}
                data-testid="switch-override-overnight"
              />
              <div>
                <Label htmlFor="override-overnight" className="cursor-pointer flex items-center gap-1.5">
                  <Moon className="h-4 w-4 text-blue-500" />
                  دوام ليلي (يتجاوز منتصف الليل)
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">فعّل هذا إذا كانت ساعة الانتهاء في اليوم التالي (مثلاً: بداية 22:00 ونهاية 05:00)</p>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <Label className="text-sm font-medium">أيام الراحة الأسبوعية (اختياري)</Label>
              <p className="text-xs text-muted-foreground">إذا تركتها فارغة، تُطبَّق أيام الراحة العامة للتطبيق</p>
              <div className="flex flex-wrap gap-3 mt-1">
                {WEEKDAYS.map(({ dow, label }) => (
                  <div key={dow} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`dow-${dow}`}
                      checked={form.weeklyOffDays.includes(dow)}
                      onCheckedChange={() => toggleWeekDay(dow)}
                      data-testid={`checkbox-offday-${dow}`}
                    />
                    <Label htmlFor={`dow-${dow}`} className="text-sm cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
              {form.weeklyOffDays.length > 0 && (
                <p className="text-xs text-primary mt-1">
                  أيام الراحة المحددة: {getOffDaysLabel(form.weeklyOffDays)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="override-notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="override-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية عن هذا الجدول"
                rows={2}
                data-testid="textarea-override-notes"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} data-testid="button-cancel-override">
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-override">
              {isPending ? "جارٍ الحفظ..." : editId ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
