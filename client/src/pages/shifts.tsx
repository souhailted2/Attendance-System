import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Clock, Users, ChevronDown, ChevronUp, ArrowLeftRight, Sun, Moon } from "lucide-react";
import type { WorkRule, Employee } from "@shared/schema";
import { PageHeader } from "@/components/page-header";

type ShiftKey = "morning" | "evening";

export default function Shifts() {
  const { toast } = useToast();
  const [editingRule, setEditingRule] = useState<WorkRule | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("08:00");
  const [formEnd, setFormEnd] = useState("16:00");
  const [formLate, setFormLate] = useState("0");
  const [formLatePenalty, setFormLatePenalty] = useState("0");
  const [formEarlyPenalty, setFormEarlyPenalty] = useState("0");
  const [formAbsence, setFormAbsence] = useState("0");
  const [form24hShift, setForm24hShift] = useState(false);

  const { data: rules = [], isLoading: rulesLoading } = useQuery<WorkRule[]>({ queryKey: ["/api/work-rules"] });
  const { data: employees = [], isLoading: empsLoading } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  const activeEmployees = employees.filter((e) => e.isActive);
  const morningEmps = activeEmployees.filter((e) => (e.shift || "morning") === "morning");
  const eveningEmps = activeEmployees.filter((e) => e.shift === "evening");

  const morningRule = rules.find((r) => r.name.includes("صباح")) || rules.find((r) => r.isDefault) || rules[0];
  const eveningRule = rules.find((r) => r.name.includes("مساء")) || rules[1];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/work-rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-rules"] });
      toast({ title: "تم إنشاء الفترة بنجاح" });
      resetForm();
      setCreateOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/work-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-rules"] });
      toast({ title: "تم تحديث الفترة بنجاح" });
      resetForm();
      setEditingRule(null);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/work-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-rules"] });
      toast({ title: "تم حذف الفترة" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const moveEmpMutation = useMutation({
    mutationFn: ({ id, shift, workRuleId }: { id: string; shift: string; workRuleId?: string | null }) =>
      apiRequest("PATCH", `/api/employees/${id}`, { shift, workRuleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "تم تغيير فترة الموظف" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function resetForm() {
    setFormName(""); setFormStart("08:00"); setFormEnd("16:00");
    setFormLate("0"); setFormLatePenalty("0"); setFormEarlyPenalty("0"); setFormAbsence("0");
    setForm24hShift(false);
  }

  function openEdit(rule: WorkRule) {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormStart(rule.workStartTime);
    setFormEnd(rule.workEndTime);
    setFormLate(String(rule.lateGraceMinutes));
    setFormLatePenalty(rule.latePenaltyPerMinute);
    setFormEarlyPenalty(rule.earlyLeavePenaltyPerMinute);
    setFormAbsence(rule.absencePenalty);
    setForm24hShift(!!rule.is24hShift);
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: formName,
      workStartTime: form24hShift ? "08:00" : formStart,
      workEndTime: form24hShift ? "08:00" : formEnd,
      lateGraceMinutes: parseInt(formLate) || 0,
      latePenaltyPerMinute: formLatePenalty,
      earlyLeavePenaltyPerMinute: formEarlyPenalty,
      absencePenalty: formAbsence,
      is24hShift: form24hShift,
    };
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function moveEmployee(emp: Employee, toShift: ShiftKey) {
    const targetRule = toShift === "morning" ? morningRule : eveningRule;
    moveEmpMutation.mutate({ id: emp.id, shift: toShift, workRuleId: targetRule?.id ?? null });
  }

  const isLoading = rulesLoading || empsLoading;

  const shiftConfig: { key: ShiftKey; label: string; icon: any; rule?: WorkRule; emps: Employee[]; color: string; badgeClass: string }[] = [
    {
      key: "morning",
      label: "الفترة الصباحية",
      icon: Sun,
      rule: morningRule,
      emps: morningEmps,
      color: "border-amber-200 dark:border-amber-800",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    },
    {
      key: "evening",
      label: "الفترة المسائية",
      icon: Moon,
      rule: eveningRule,
      emps: eveningEmps,
      color: "border-indigo-200 dark:border-indigo-800",
      badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    },
  ];

  return (
    <div dir="rtl">
      <PageHeader
        title="الفترات"
        subtitle="إدارة فترات العمل الصباحية والمسائية"
        action={
          <Button data-testid="button-create-shift" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 ml-1" />
            إنشاء فترة جديدة
          </Button>
        }
      />
      <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          {shiftConfig.map((s) => {
            const isExpanded = expandedShift === s.key;
            return (
              <Card key={s.key} className={`border-2 ${s.color}`} data-testid={`card-shift-${s.key}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${s.badgeClass}`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{s.label}</CardTitle>
                        {s.rule ? (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {s.rule.is24hShift ? (
                              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">مناوبة 24 ساعة</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {s.rule.workStartTime} — {s.rule.workEndTime}
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground">|</span>
                            <span className="text-sm text-muted-foreground">قاعدة: {s.rule.name}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">لا توجد قاعدة عمل مرتبطة</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1" data-testid={`badge-shift-count-${s.key}`}>
                        <Users className="h-3 w-3" />
                        {s.emps.length} موظف
                      </Badge>
                      {s.rule && (
                        <>
                          <Button size="sm" variant="outline" data-testid={`button-edit-shift-${s.key}`} onClick={() => openEdit(s.rule!)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-destructive" data-testid={`button-delete-shift-${s.key}`}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الفترة؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف قاعدة العمل "{s.rule.name}". هذا لن يؤثر على الموظفين المسجلين في هذه الفترة.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteRuleMutation.mutate(s.rule!.id)}>حذف</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Collapsible open={isExpanded} onOpenChange={(v) => setExpandedShift(v ? s.key : null)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between" data-testid={`button-toggle-employees-${s.key}`}>
                        <span className="text-sm">عرض الموظفين ({s.emps.length})</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      {s.emps.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">لا يوجد موظفون في هذه الفترة</p>
                      ) : (
                        <div className="divide-y rounded-md border overflow-hidden">
                          {s.emps.map((emp) => {
                            const otherShift: ShiftKey = s.key === "morning" ? "evening" : "morning";
                            const otherLabel = s.key === "morning" ? "نقل للمسائية" : "نقل للصباحية";
                            return (
                              <div key={emp.id} className="flex items-center justify-between px-3 py-2 bg-background hover:bg-muted/30 transition-colors" data-testid={`row-employee-${emp.id}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-10">{emp.employeeCode}</span>
                                  <span className="text-sm font-medium">{emp.name}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs gap-1"
                                  data-testid={`button-move-emp-${emp.id}`}
                                  disabled={moveEmpMutation.isPending}
                                  onClick={() => moveEmployee(emp, otherShift)}
                                >
                                  <ArrowLeftRight className="h-3 w-3" />
                                  {otherLabel}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })}

          {rules.filter((r) => !r.name.includes("صباح") && !r.name.includes("مساء")).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">فترات أخرى</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rules.filter((r) => !r.name.includes("صباح") && !r.name.includes("مساء")).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20" data-testid={`row-rule-${r.id}`}>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {r.name}
                        {r.is24hShift && <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full">24 ساعة</span>}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {r.is24hShift ? "مناوبة 24 ساعة دوارة" : `${r.workStartTime} — ${r.workEndTime}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(r)} data-testid={`button-edit-rule-${r.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-destructive" data-testid={`button-delete-rule-${r.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف قاعدة العمل؟</AlertDialogTitle>
                            <AlertDialogDescription>سيتم حذف "{r.name}" نهائياً.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRuleMutation.mutate(r.id)}>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={!!editingRule} onOpenChange={(v) => !v && setEditingRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الفترة</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="space-y-1">
              <Label>اسم الفترة</Label>
              <Input data-testid="input-rule-name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
              <input type="checkbox" id="edit-24h-shift" data-testid="checkbox-24h-shift" checked={form24hShift} onChange={(e) => setForm24hShift(e.target.checked)} className="h-4 w-4 accent-orange-500" />
              <Label htmlFor="edit-24h-shift" className="cursor-pointer text-sm font-medium">مناوبة 24 ساعة دوارة (حراسة)</Label>
            </div>
            {!form24hShift && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>وقت الدخول</Label>
                  <Input type="time" data-testid="input-rule-start" value={formStart} onChange={(e) => setFormStart(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>وقت الخروج</Label>
                  <Input type="time" data-testid="input-rule-end" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} required />
                </div>
              </div>
            )}
            {form24hShift && (
              <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 rounded p-2">
                المناوبة: 08:00 ← 08:00 (اليوم التالي) | الحضور = 2.00 | يوم الراحة = 1.00
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>مهلة التأخير (دقيقة)</Label>
                <Input type="number" min="0" data-testid="input-rule-late" value={formLate} onChange={(e) => setFormLate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>غرامة التأخير/دقيقة</Label>
                <Input type="number" min="0" data-testid="input-rule-late-penalty" value={formLatePenalty} onChange={(e) => setFormLatePenalty(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>غرامة الخروج المبكر/دقيقة</Label>
                <Input type="number" min="0" data-testid="input-rule-early-penalty" value={formEarlyPenalty} onChange={(e) => setFormEarlyPenalty(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>غرامة الغياب</Label>
                <Input type="number" min="0" data-testid="input-rule-absence" value={formAbsence} onChange={(e) => setFormAbsence(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingRule(null)}>إلغاء</Button>
              <Button type="submit" data-testid="button-save-rule" disabled={updateRuleMutation.isPending}>حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء فترة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="space-y-1">
              <Label>اسم الفترة</Label>
              <Input data-testid="input-new-rule-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="مثال: الفترة الليلية" required />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
              <input type="checkbox" id="new-24h-shift" data-testid="checkbox-new-24h-shift" checked={form24hShift} onChange={(e) => setForm24hShift(e.target.checked)} className="h-4 w-4 accent-orange-500" />
              <Label htmlFor="new-24h-shift" className="cursor-pointer text-sm font-medium">مناوبة 24 ساعة دوارة (حراسة)</Label>
            </div>
            {!form24hShift && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>وقت الدخول</Label>
                  <Input type="time" data-testid="input-new-rule-start" value={formStart} onChange={(e) => setFormStart(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>وقت الخروج</Label>
                  <Input type="time" data-testid="input-new-rule-end" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} required />
                </div>
              </div>
            )}
            {form24hShift && (
              <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 rounded p-2">
                المناوبة: 08:00 ← 08:00 (اليوم التالي) | الحضور = 2.00 | يوم الراحة = 1.00
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>مهلة التأخير (دقيقة)</Label>
                <Input type="number" min="0" data-testid="input-new-rule-late" value={formLate} onChange={(e) => setFormLate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>غرامة التأخير/دقيقة</Label>
                <Input type="number" min="0" data-testid="input-new-rule-late-penalty" value={formLatePenalty} onChange={(e) => setFormLatePenalty(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>غرامة الخروج المبكر/دقيقة</Label>
                <Input type="number" min="0" data-testid="input-new-rule-early-penalty" value={formEarlyPenalty} onChange={(e) => setFormEarlyPenalty(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>غرامة الغياب</Label>
                <Input type="number" min="0" data-testid="input-new-rule-absence" value={formAbsence} onChange={(e) => setFormAbsence(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
              <Button type="submit" data-testid="button-create-rule-submit" disabled={createMutation.isPending}>إنشاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
