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
import { Loader2, Plus, Trash2, Wallet, Search, User } from "lucide-react";
import { fmtDZD } from "@/lib/utils";

type Employee = { id: string; name: string; employeeCode: string; isActive: boolean; workshopId?: string };
type Workshop = { id: string; name: string };
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
  const [searchQuery, setSearchQuery] = useState("");
  const [empSearch, setEmpSearch] = useState("");

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
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
      setEmpSearch("");
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/advances/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/advances"] }); toast({ title: "تم الحذف" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const getEmp = (id: string) => employees.find(e => e.id === id);
  const getEmpName = (id: string) => getEmp(id)?.name ?? "—";
  const getEmpCode = (id: string) => getEmp(id)?.employeeCode ?? "";
  const getWorkshopName = (id: string) => workshops.find(w => w.id === id)?.name ?? "بدون ورشة";

  const totalAdvances = advances.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  const q = searchQuery.trim().toLowerCase();

  const filteredAdvances = useMemo(() => {
    if (!q) return advances;
    return advances.filter(a => {
      const emp = getEmp(a.employeeId);
      if (!emp) return false;
      const wsName = getWorkshopName(emp.workshopId ?? "").toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        wsName.includes(q)
      );
    });
  }, [advances, q, employees, workshops]);

  const groupedByWorkshop = useMemo(() => {
    const map = new Map<string, { wsName: string; rows: Advance[] }>();
    for (const adv of filteredAdvances) {
      const emp = getEmp(adv.employeeId);
      const wsId = emp?.workshopId ?? "__none__";
      const wsName = wsId === "__none__" ? "بدون ورشة" : getWorkshopName(wsId);
      if (!map.has(wsId)) map.set(wsId, { wsName, rows: [] });
      map.get(wsId)!.rows.push(adv);
    }
    return Array.from(map.values()).sort((a, b) => a.wsName.localeCompare(b.wsName, "ar"));
  }, [filteredAdvances, employees, workshops]);

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
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pr-9"
            placeholder="بحث بالاسم أو الرقم أو الورشة..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            data-testid="input-search-advances"
          />
        </div>
        <Badge variant="secondary">{filteredAdvances.length} تسبيقة</Badge>
        {filteredAdvances.length > 0 && (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
            الإجمالي: {fmtDZD(filteredAdvances.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0))}
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
                {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد تسبيقات لهذا الشهر"}
              </td></tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByWorkshop.map(({ wsName, rows }) => {
            const wsTotal = rows.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
            return (
              <div key={wsName} className="rounded-xl border overflow-hidden">
                {/* Workshop header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b">
                  <span className="font-semibold text-sm">{wsName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{rows.length} تسبيقة</Badge>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-xs">
                      {fmtDZD(wsTotal)}
                    </Badge>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground border-b">
                      <th className="px-4 py-2 text-right font-medium">الموظف</th>
                      <th className="px-4 py-2 text-right font-medium">المبلغ (دج)</th>
                      <th className="px-4 py-2 text-right font-medium">التاريخ</th>
                      <th className="px-4 py-2 text-right font-medium">ملاحظات</th>
                      <th className="px-4 py-2 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((adv, i) => (
                      <tr key={adv.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                        data-testid={`row-advance-${adv.id}`}>
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{getEmpName(adv.employeeId)}</p>
                          <p className="text-xs text-muted-foreground font-mono">{getEmpCode(adv.employeeId)}</p>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {fmtDZD(adv.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{adv.advanceDate}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{adv.notes || "—"}</td>
                        <td className="px-4 py-2.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive"
                            onClick={() => deleteMut.mutate(adv.id)} disabled={deleteMut.isPending}
                            data-testid={`button-delete-advance-${adv.id}`}>
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
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setForm({ employeeId: "", amount: "", advanceDate: "", notes: "" }); setEmpSearch(""); } }}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>تسجيل تسبيقة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>الموظف</Label>
              {form.employeeId ? (
                <div className="flex items-center gap-2 p-2 rounded-md border border-primary bg-primary/5 mt-1">
                  <User className="h-4 w-4 text-primary shrink-0" />
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
                    data-testid="input-advance-employee-search"
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
                          data-testid={`button-select-advance-employee-${emp.id}`}>
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
