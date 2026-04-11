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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Scale } from "lucide-react";
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
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name,
      workStartTime,
      workEndTime,
      checkoutEarliestTime: checkoutEarliestTime || null,
      lateGraceMinutes: parseInt(lateGraceMinutes) || 0,
      latePenaltyPerMinute,
      earlyLeavePenaltyPerMinute,
      absencePenalty,
      isDefault,
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
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rule.workStartTime} - {rule.workEndTime}
                        {rule.checkoutEarliestTime && <span className="text-primary"> | خروج: {rule.checkoutEarliestTime}→{rule.workEndTime}</span>}
                        {" "}| سماح: {rule.lateGraceMinutes} دقيقة | خصم تأخير: {rule.latePenaltyPerMinute}/دقيقة | خصم غياب: {rule.absencePenalty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(rule)} data-testid={`button-edit-${rule.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid={`button-delete-${rule.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                          <AlertDialogDescription>هل أنت متأكد من حذف هذه القاعدة؟</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(rule.id)} data-testid="button-confirm-delete">حذف</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
