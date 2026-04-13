import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Wallet } from "lucide-react";

type Employee = { id: string; name: string; employeeCode: string; isActive: boolean };
type Advance = {
  id: string; employeeId: string; amount: string;
  advanceDate: string; month: number; year: number; notes: string | null; createdAt: string;
};

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const now = new Date();

export default function Advances() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", amount: "", advanceDate: "", notes: "" });
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: advances = [], isLoading } = useQuery<Advance[]>({
    queryKey: ["/api/advances", filterMonth, filterYear],
    queryFn: () => fetch(`/api/advances?month=${filterMonth}&year=${filterYear}`).then(r => r.json()),
  });

  const active = employees.filter(e => e.isActive);

  const createMut = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/advances", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advances"] });
      toast({ title: "تم تسجيل التسبيقة" });
      setOpen(false);
      setForm({ employeeId: "", amount: "", advanceDate: "", notes: "" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/advances/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/advances"] }); toast({ title: "تم الحذف" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name ?? "—";
  const totalAdvances = advances.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,hsl(220 80% 50%),hsl(230 75% 60%))", boxShadow: "0 3px 12px hsl(220 80% 50%/0.35)" }}>
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">التسبيقات</h1>
            <p className="text-sm text-muted-foreground">تسجيل وعرض تسبيقات الموظفين</p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-add-advance">
          <Plus className="h-4 w-4 ml-1" /> تسجيل تسبيقة
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36" data-testid="select-filter-month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS_AR.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28" data-testid="select-filter-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Badge variant="secondary">{advances.length} تسبيقة</Badge>
        {advances.length > 0 && (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
            الإجمالي: {totalAdvances.toLocaleString("ar-DZ")} دج
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b">
                <th className="px-4 py-3 text-right font-medium">الموظف</th>
                <th className="px-4 py-3 text-right font-medium">المبلغ (دج)</th>
                <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium">ملاحظات</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {advances.map((adv, i) => (
                <tr key={adv.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                  data-testid={`row-advance-${adv.id}`}>
                  <td className="px-4 py-3 font-medium">{getEmpName(adv.employeeId)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {parseFloat(adv.amount).toLocaleString("ar-DZ")} دج
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{adv.advanceDate}</td>
                  <td className="px-4 py-3 text-muted-foreground">{adv.notes || "—"}</td>
                  <td className="px-4 py-3">
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive"
                      onClick={() => deleteMut.mutate(adv.id)} disabled={deleteMut.isPending}
                      data-testid={`button-delete-advance-${adv.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {advances.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">لا توجد تسبيقات لهذا الشهر</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>تسجيل تسبيقة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>الموظف</Label>
              <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}>
                <SelectTrigger data-testid="select-advance-employee"><SelectValue placeholder="اختر موظف" /></SelectTrigger>
                <SelectContent>{active.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>المبلغ (دج)</Label>
              <Input type="number" min="0" placeholder="10000" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-advance-amount" />
            </div>
            <div>
              <Label>تاريخ التسبيقة</Label>
              <Input type="date" value={form.advanceDate}
                onChange={e => setForm(f => ({ ...f, advanceDate: e.target.value }))} data-testid="input-advance-date" />
            </div>
            <div>
              <Label>ملاحظات (اختياري)</Label>
              <Input placeholder="ملاحظات..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-advance-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending} data-testid="button-submit-advance">
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} تسجيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
