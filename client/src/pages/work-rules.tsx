import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Scale, Pencil, Trash2 } from "lucide-react";
import { RowActions } from "@/components/row-actions";
import type { WorkRule } from "@shared/schema";
import { PageHeader } from "@/components/page-header";

export default function WorkRules() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkRule | null>(null);

  const [name, setName] = useState("");
  const [workStartTime, setWorkStartTime] = useState("08:00");
  const [workEndTime, setWorkEndTime] = useState("16:00");
  const [checkoutEarliestTime, setCheckoutEarliestTime] = useState("");
  const [lateGraceMinutes, setLateGraceMinutes] = useState("0");
  const [latePenaltyPerMinute, setLatePenaltyPerMinute] = useState("0");
  const [earlyLeavePenaltyPerMinute, setEarlyLeavePenaltyPerMinute] = useState("0");
  const [absencePenalty, setAbsencePenalty] = useState("0");
  const [isDefault, setIsDefault] = useState(false);
  const [isFlexibleShift, setIsFlexibleShift] = useState(false);
  const [flexibleShiftHours, setFlexibleShiftHours] = useState("8");

  const { data: rules, isLoading } = useQuery<WorkRule[]>({ queryKey: ["/api/work-rules"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/work-rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-rules"] });
      toast({ title: "تم الإضافة بنجاح" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/work-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-rules"] });
      toast({ title: "تم التحديث بنجاح" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/work-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-rules"] });
      toast({ title: "تم الحذف بنجاح" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function resetForm() {
    setName(""); setWorkStartTime("08:00"); setWorkEndTime("16:00");
    setCheckoutEarliestTime("");
    setLateGraceMinutes("0"); setLatePenaltyPerMinute("0");
    setEarlyLeavePenaltyPerMinute("0"); setAbsencePenalty("0");
    setIsDefault(false); setEditingRule(null);
    setIsFlexibleShift(false); setFlexibleShiftHours("8");
  }

  function openEdit(rule: WorkRule) {
    setEditingRule(rule);
    setName(rule.name);
    setWorkStartTime(rule.workStartTime);
    setWorkEndTime(rule.workEndTime);
    setCheckoutEarliestTime(rule.checkoutEarliestTime ?? "");
    setLateGraceMinutes(String(rule.lateGraceMinutes));
    setLatePenaltyPerMinute(rule.latePenaltyPerMinute);
    setEarlyLeavePenaltyPerMinute(rule.earlyLeavePenaltyPerMinute);
    setAbsencePenalty(rule.absencePenalty);
    setIsDefault(rule.isDefault);
    setIsFlexibleShift(!!rule.isFlexibleShift);
    setFlexibleShiftHours(String(rule.flexibleShiftHours ?? 8));
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name,
      workStartTime: isFlexibleShift ? "08:00" : workStartTime,
      workEndTime: isFlexibleShift ? "16:00" : workEndTime,
      checkoutEarliestTime: isFlexibleShift ? null : (checkoutEarliestTime || null),
      lateGraceMinutes: isFlexibleShift ? 0 : (parseInt(lateGraceMinutes) || 0),
      latePenaltyPerMinute: isFlexibleShift ? "0" : latePenaltyPerMinute,
      earlyLeavePenaltyPerMinute: isFlexibleShift ? "0" : earlyLeavePenaltyPerMinute,
      absencePenalty,
      isDefault,
      isFlexibleShift,
      flexibleShiftHours: parseInt(flexibleShiftHours) || 8,
    };
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <div>
      <PageHeader
        title="قواعد العمل"
        subtitle="ضبط أوقات الدوام والغيابات"
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-rule">
                <Plus className="h-4 w-4 ml-2" />
                إضافة قاعدة
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRule ? "تعديل القاعدة" : "إضافة قاعدة جديدة"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>اسم القاعدة *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-rule-name" />
              </div>

              {/* سويتش الوردية المرنة */}
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <Switch
                  checked={isFlexibleShift}
                  onCheckedChange={(v) => setIsFlexibleShift(v)}
                  data-testid="switch-flexible-shift"
                />
                <div>
                  <Label className="cursor-pointer">وردية مرنة (بدون وقت محدد)</Label>
                  <p className="text-xs text-muted-foreground">الإضافي يُحسب بعد X ساعة من الدخول</p>
                </div>
              </div>

              {/* حقول الوردية المرنة */}
              {isFlexibleShift && (
                <div className="space-y-2">
                  <Label>ساعات العمل الأساسية في اليوم</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={flexibleShiftHours}
                    onChange={(e) => setFlexibleShiftHours(e.target.value)}
                    data-testid="input-flexible-hours"
                  />
                  <p className="text-xs text-muted-foreground">الساعات الزائدة عن هذا العدد تُحتسب إضافياً</p>
                </div>
              )}

              {/* حقول الوردية الثابتة — تُخفى عند الوردية المرنة */}
              {!isFlexibleShift && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>بداية الدوام</Label>
                      <Input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} data-testid="input-start-time" />
                    </div>
                    <div className="space-y-2">
                      <Label>نهاية الدوام</Label>
                      <Input type="time" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)} data-testid="input-end-time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>أقرب وقت مسموح للخروج <span className="text-muted-foreground text-xs">(اختياري — للسماح بنطاق مرن)</span></Label>
                    <Input type="time" value={checkoutEarliestTime} onChange={(e) => setCheckoutEarliestTime(e.target.value)} data-testid="input-checkout-earliest" placeholder="اتركه فارغاً إذا لم يكن لازماً" />
                  </div>
                  <div className="space-y-2">
                    <Label>فترة السماح للتأخير (دقيقة)</Label>
                    <Input type="number" value={lateGraceMinutes} onChange={(e) => setLateGraceMinutes(e.target.value)} data-testid="input-grace" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>خصم التأخير / دقيقة</Label>
                      <Input type="number" step="0.01" value={latePenaltyPerMinute} onChange={(e) => setLatePenaltyPerMinute(e.target.value)} data-testid="input-late-penalty" />
                    </div>
                    <div className="space-y-2">
                      <Label>خصم الخروج المبكر / دقيقة</Label>
                      <Input type="number" step="0.01" value={earlyLeavePenaltyPerMinute} onChange={(e) => setEarlyLeavePenaltyPerMinute(e.target.value)} data-testid="input-early-penalty" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>خصم الغياب</Label>
                <Input type="number" step="0.01" value={absencePenalty} onChange={(e) => setAbsencePenalty(e.target.value)} data-testid="input-absence-penalty" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} data-testid="switch-default" />
                <Label>القاعدة الافتراضية</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => { setOpen(false); resetForm(); }}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-rule">
                  {editingRule ? "تحديث" : "إضافة"}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6 space-y-6">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !rules || rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scale className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد قواعد عمل</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rules.map((rule) => (
            <Card key={rule.id} data-testid={`card-rule-${rule.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Scale className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{rule.name}</p>
                        {rule.isDefault && <Badge variant="default" className="text-xs">افتراضي</Badge>}
                        {rule.isFlexibleShift && (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-400">
                            مرنة · {rule.flexibleShiftHours ?? 8}س
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rule.isFlexibleShift
                          ? `وردية مرنة — إضافي بعد ${rule.flexibleShiftHours ?? 8} ساعات`
                          : (
                            <>
                              {rule.workStartTime} - {rule.workEndTime}
                              {rule.checkoutEarliestTime && <span className="text-primary"> | خروج: {rule.checkoutEarliestTime}→{rule.workEndTime}</span>}
                              {" "}| سماح: {rule.lateGraceMinutes} دقيقة | خصم تأخير: {rule.latePenaltyPerMinute}/دقيقة | خصم غياب: {rule.absencePenalty}
                            </>
                          )
                        }
                      </p>
                    </div>
                  </div>
                  <RowActions
                    testId={`button-actions-${rule.id}`}
                    actions={[
                      {
                        label: "تعديل",
                        icon: <Pencil className="h-3.5 w-3.5" />,
                        onClick: () => openEdit(rule),
                      },
                      {
                        label: "حذف",
                        icon: <Trash2 className="h-3.5 w-3.5" />,
                        onClick: () => deleteMutation.mutate(rule.id),
                        destructive: true,
                        confirmTitle: "تأكيد الحذف",
                        confirmDescription: "هل أنت متأكد من حذف هذه القاعدة؟",
                      },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
