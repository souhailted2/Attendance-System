import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Minus, Search, User } from "lucide-react";
import { fmtDZD } from "@/lib/utils";

type Employee = { id: string; name: string; employeeCode: string; isActive: boolean; workshopId?: string };
type Workshop = { id: string; name: string };
type Deduction = {
  id: string; employeeId: string; amount: string;
  month: number; year: number; reason: string | null; createdAt: string; createdBy: string | null;
};

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const now = new Date();

export default function Deductions() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", amount: "", month: String(now.getMonth() + 1), year: String(now.getFullYear()), reason: "" });
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [searchQuery, setSearchQuery] = useState("");
  const [empSearch, setEmpSearch] = useState("");

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: deductions = [], isLoading } = useQuery<Deduction[]>({
    queryKey: ["/api/deductions", filterMonth, filterYear],
    queryFn: () => fetch(`/api/deductions?month=${filterMonth}&year=${filterYear}`).then(r => r.json()),
  });

  const active = employees.filter(e => e.isActive);
  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  const createMut = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/deductions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deductions"] });
      toast({ title: "تم تسجيل الخصم" });
      setOpen(false);
      setForm({ employeeId: "", amount: "", month: String(now.getMonth() + 1), year: String(now.getFullYear()), reason: "" });
      setEmpSearch("");
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/deductions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/deductions"] }); toast({ title: "تم الحذف" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const getEmp = (id: string) => employees.find(e => e.id === id);
  const getEmpName = (id: string) => getEmp(id)?.name ?? "—";
  const getEmpCode = (id: string) => getEmp(id)?.employeeCode ?? "";
  const getWorkshopName = (id: string) => workshops.find(w => w.id === id)?.name ?? "بدون ورشة";

  const q = searchQuery.trim().toLowerCase();

  const filteredDeductions = useMemo(() => {
    if (!q) return deductions;
    return deductions.filter(d => {
      const emp = getEmp(d.employeeId);
      if (!emp) return false;
      const wsName = getWorkshopName(emp.workshopId ?? "").toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        wsName.includes(q) ||
        (d.reason ?? "").toLowerCase().includes(q)
      );
    });
  }, [deductions, q, employees, workshops]);

  const groupedByWorkshop = useMemo(() => {
    const map = new Map<string, { wsName: string; rows: Deduction[] }>();
    for (const d of filteredDeductions) {
      const emp = getEmp(d.employeeId);
      const wsId = emp?.workshopId ?? "__none__";
      const wsName = wsId === "__none__" ? "بدون ورشة" : getWorkshopName(wsId);
      if (!map.has(wsId)) map.set(wsId, { wsName, rows: [] });
      map.get(wsId)!.rows.push(d);
    }
    return Array.from(map.values()).sort((a, b) => a.wsName.localeCompare(b.wsName, "ar"));
  }, [filteredDeductions, employees, workshops]);

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,hsl(0 80% 50%),hsl(10 75% 60%))", boxShadow: "0 3px 12px hsl(0 80% 50%/0.35)" }}>
            <Minus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">الخصومات</h1>
            <p className="text-sm text-muted-foreground">تسجيل وعرض خصومات الموظفين</p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-add-deduction" variant="destructive">
          <Plus className="h-4 w-4 ml-1" /> تسجيل خصم
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
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pr-9"
            placeholder="بحث بالاسم أو الرقم أو الورشة..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            data-testid="input-search-deductions"
          />
        </div>
        <Badge variant="secondary">{filteredDeductions.length} خصم</Badge>
        {filteredDeductions.length > 0 && (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0">
            الإجمالي: {fmtDZD(filteredDeductions.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0))}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : groupedByWorkshop.length === 0 ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">
                {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد خصومات لهذا الشهر"}
              </td></tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByWorkshop.map(({ wsName, rows }) => {
            const wsTotal = rows.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
            return (
              <div key={wsName} className="rounded-xl border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b">
                  <span className="font-semibold text-sm">{wsName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{rows.length} خصم</Badge>
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 text-xs">
                      {fmtDZD(wsTotal)}
                    </Badge>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground border-b">
                      <th className="px-4 py-2 text-right font-medium">الموظف</th>
                      <th className="px-4 py-2 text-right font-medium">المبلغ (دج)</th>
                      <th className="px-4 py-2 text-right font-medium">الشهر</th>
                      <th className="px-4 py-2 text-right font-medium">السبب</th>
                      <th className="px-4 py-2 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((ded, i) => (
                      <tr key={ded.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                        data-testid={`row-deduction-${ded.id}`}>
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{getEmpName(ded.employeeId)}</p>
                          <p className="text-xs text-muted-foreground font-mono">{getEmpCode(ded.employeeId)}</p>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-bold text-red-600 dark:text-red-400">
                          {fmtDZD(ded.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {MONTHS_AR[ded.month - 1]} {ded.year}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{ded.reason || "—"}</td>
                        <td className="px-4 py-2.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive"
                            onClick={() => deleteMut.mutate(ded.id)} disabled={deleteMut.isPending}
                            data-testid={`button-delete-deduction-${ded.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setForm({ employeeId: "", amount: "", month: String(now.getMonth() + 1), year: String(now.getFullYear()), reason: "" }); setEmpSearch(""); } }}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>تسجيل خصم جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>الموظف</Label>
              {form.employeeId ? (
                <div className="flex items-center gap-2 p-2 rounded-md border border-destructive bg-destructive/5 mt-1">
                  <User className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm font-medium flex-1">
                    {active.find(e => e.id === form.employeeId)?.name}
                    {" — "}
                    {active.find(e => e.id === form.employeeId)?.employeeCode}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                    onClick={() => { setForm(f => ({ ...f, employeeId: "" })); setEmpSearch(""); }}>
                    تغيير
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="ابحث بالاسم أو الرقم..."
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    data-testid="input-deduction-employee-search"
                    className="mt-1"
                  />
                  {empSearch.trim() && (
                    <div className="max-h-48 overflow-y-auto rounded-md border divide-y mt-1">
                      {active.filter(e =>
                        e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                        e.employeeCode.toLowerCase().includes(empSearch.toLowerCase())
                      ).slice(0, 30).map(emp => (
                        <button key={emp.id} type="button"
                          onClick={() => { setForm(f => ({ ...f, employeeId: emp.id })); setEmpSearch(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-right transition-colors"
                          data-testid={`button-select-deduction-employee-${emp.id}`}>
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-sm">{emp.name}</span>
                          <span className="text-xs text-muted-foreground">{emp.employeeCode}</span>
                        </button>
                      ))}
                      {active.filter(e =>
                        e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                        e.employeeCode.toLowerCase().includes(empSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">لا توجد نتائج</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <Label>المبلغ (دج)</Label>
              <Input type="number" min="0" placeholder="5000" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-deduction-amount" className="mt-1" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>الشهر</Label>
                <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-deduction-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS_AR.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>السنة</Label>
                <Select value={form.year} onValueChange={v => setForm(f => ({ ...f, year: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-deduction-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>السبب (اختياري)</Label>
              <Input placeholder="سبب الخصم..." value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} data-testid="input-deduction-reason" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.employeeId || !form.amount} data-testid="button-submit-deduction">
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} تسجيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
