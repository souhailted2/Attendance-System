import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Pencil, CreditCard, CheckCircle, Search, User, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { fmtDZD } from "@/lib/utils";

type Employee = { id: string; name: string; employeeCode: string; isActive: boolean };
type Debt = {
  id: string; employeeId: string; description: string;
  totalAmount: string; monthlyDeduction: string; remainingAmount: string; isActive: boolean; createdAt: string;
};

const emptyForm = { employeeId: "", description: "", totalAmount: "", monthlyDeduction: "" };

export default function Debts() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [existingActiveDebt, setExistingActiveDebt] = useState<Debt | null>(null);

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: debts = [], isLoading } = useQuery<Debt[]>({ queryKey: ["/api/debts"] });

  const active = employees.filter(e => e.isActive);

  const createMut = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/debts", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/debts"] }); toast({ title: "تم إضافة الدين" }); setOpen(false); setForm(emptyForm); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Debt> }) => apiRequest("PATCH", `/api/debts/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/debts"] }); toast({ title: "تم التعديل" }); setEditDebt(null); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/debts/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/debts"] }); toast({ title: "تم الحذف" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name ?? "—";
  const getEmpCode = (id: string) => employees.find(e => e.id === id)?.employeeCode ?? "";

  const filtered = debts.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const name = getEmpName(d.employeeId).toLowerCase();
    const code = getEmpCode(d.employeeId).toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  function openAdd() { setForm(emptyForm); setEmpSearch(""); setOpen(true); }
  function openEdit(d: Debt) { setEditDebt(d); }

  function handleSubmit() {
    if (!form.employeeId || !form.description || !form.totalAmount || !form.monthlyDeduction) {
      toast({ title: "يرجى تعبئة جميع الحقول", variant: "destructive" }); return;
    }
    const activeDebt = debts.find(d => d.employeeId === form.employeeId && d.isActive);
    if (activeDebt) {
      setExistingActiveDebt(activeDebt);
      setConfirmOpen(true);
      return;
    }
    createMut.mutate(form);
  }

  function handleConfirmAdd() {
    setConfirmOpen(false);
    setExistingActiveDebt(null);
    createMut.mutate(form);
  }

  function handleMergeDebt() {
    if (!existingActiveDebt) return;
    const newTotal = parseFloat(existingActiveDebt.totalAmount) + parseFloat(form.totalAmount || "0");
    const newRemaining = parseFloat(existingActiveDebt.remainingAmount) + parseFloat(form.totalAmount || "0");
    const newMonthly = form.monthlyDeduction;
    editMut.mutate(
      { id: existingActiveDebt.id, data: { totalAmount: String(newTotal), remainingAmount: String(newRemaining), monthlyDeduction: newMonthly } },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setExistingActiveDebt(null);
          setOpen(false);
          setForm(emptyForm);
        },
      }
    );
  }

  function handleEditSave() {
    if (!editDebt) return;
    editMut.mutate({ id: editDebt.id, data: { monthlyDeduction: editDebt.monthlyDeduction, remainingAmount: editDebt.remainingAmount, isActive: editDebt.isActive } });
  }

  async function exportToExcel() {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const url = `/api/debts/export${params.toString() ? `?${params}` : ""}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,hsl(0 70% 50%),hsl(10 80% 58%))", boxShadow: isDark ? "0 3px 12px hsl(0 70% 50%/0.15)" : "0 3px 12px hsl(0 70% 50%/0.35)" }}>
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">إدارة الديون</h1>
            <p className="text-sm text-muted-foreground">تسجيل وتتبع ديون الموظفين</p>
          </div>
        </div>
        <Button onClick={openAdd} data-testid="button-add-debt">
          <Plus className="h-4 w-4 ml-1" /> إضافة دين
        </Button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pr-9"
            placeholder="بحث باسم الموظف أو رقمه..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            data-testid="input-search-debts"
          />
        </div>
        <Badge variant="secondary">{filtered.length} دين</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToExcel}
          className="text-green-700 border-green-400 hover:bg-green-50 hover:text-green-800"
          data-testid="button-export-excel"
        >
          <FileSpreadsheet className="h-4 w-4 ml-1" /> تصدير Excel
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b">
                <th className="px-4 py-3 text-right font-medium">الموظف</th>
                <th className="px-4 py-3 text-right font-medium">الوصف</th>
                <th className="px-4 py-3 text-right font-medium">المبلغ الإجمالي</th>
                <th className="px-4 py-3 text-right font-medium">القسط الشهري</th>
                <th className="px-4 py-3 text-right font-medium">المتبقي</th>
                <th className="px-4 py-3 text-right font-medium">الحالة</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((debt, i) => (
                <tr key={debt.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                  data-testid={`row-debt-${debt.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{getEmpName(debt.employeeId)}</p>
                    <p className="text-xs text-muted-foreground font-mono">{getEmpCode(debt.employeeId)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{debt.description}</td>
                  <td className="px-4 py-3 font-mono">{fmtDZD(debt.totalAmount)}</td>
                  <td className="px-4 py-3 font-mono">{fmtDZD(debt.monthlyDeduction)}</td>
                  <td className="px-4 py-3 font-mono">{fmtDZD(debt.remainingAmount)}</td>
                  <td className="px-4 py-3">
                    {debt.isActive
                      ? <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-400 dark:border-amber-600">نشط</Badge>
                      : <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-400 dark:border-green-600"><CheckCircle className="h-3 w-3 ml-1" />مسدد</Badge>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(debt)}
                        data-testid={`button-edit-debt-${debt.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive"
                        onClick={() => deleteMut.mutate(debt.id)}
                        disabled={deleteMut.isPending}
                        data-testid={`button-delete-debt-${debt.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد ديون مسجلة"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setForm(emptyForm); setEmpSearch(""); } }}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة دين جديد</DialogTitle>
          </DialogHeader>
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
                    data-testid="input-debt-employee-search"
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
                          data-testid={`button-select-debt-employee-${emp.id}`}>
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
              <Label>وصف الدين</Label>
              <Input placeholder="مثال: سلفة، قرض..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} data-testid="input-debt-description" />
            </div>
            <div>
              <Label>المبلغ الإجمالي (دج)</Label>
              <Input type="number" min="0" placeholder="50000" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} data-testid="input-debt-total" />
            </div>
            <div>
              <Label>القسط الشهري المخصوم (دج)</Label>
              <Input type="number" min="0" placeholder="5000" value={form.monthlyDeduction} onChange={e => setForm(f => ({ ...f, monthlyDeduction: e.target.value }))} data-testid="input-debt-monthly" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending} data-testid="button-submit-debt">
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Active Debt Confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={v => { if (!v) { setConfirmOpen(false); setExistingActiveDebt(null); } }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              تحذير: دين نشط موجود
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-2">
              <span className="block">
                هذا الموظف لديه دين نشط بالفعل. هل تريد إضافة دين جديد؟
              </span>
              {existingActiveDebt && (
                <span className="block mt-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm">
                  <span className="block font-medium text-foreground">{getEmpName(existingActiveDebt.employeeId)}</span>
                  <span className="block text-muted-foreground mt-1">
                    الدين الحالي: <span className="font-mono font-medium text-foreground">{fmtDZD(existingActiveDebt.remainingAmount)}</span> متبقي من أصل <span className="font-mono font-medium text-foreground">{fmtDZD(existingActiveDebt.totalAmount)}</span>
                  </span>
                  <span className="block text-muted-foreground">{existingActiveDebt.description}</span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 flex-wrap">
            <AlertDialogAction
              onClick={handleConfirmAdd}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-confirm-add-debt"
            >
              تأكيد الإضافة
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleMergeDebt}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-merge-debt"
              disabled={editMut.isPending}
            >
              {editMut.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              دمج الدينين
            </AlertDialogAction>
            <AlertDialogCancel data-testid="button-cancel-confirm-debt">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDebt} onOpenChange={v => !v && setEditDebt(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>تعديل الدين</DialogTitle></DialogHeader>
          {editDebt && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">الموظف: <span className="font-medium text-foreground">{getEmpName(editDebt.employeeId)}</span></p>
              <p className="text-sm text-muted-foreground">الوصف: <span className="font-medium text-foreground">{editDebt.description}</span></p>
              <div>
                <Label>القسط الشهري (دج)</Label>
                <Input type="number" min="0" value={editDebt.monthlyDeduction}
                  onChange={e => setEditDebt(d => d ? { ...d, monthlyDeduction: e.target.value } : d)} data-testid="input-edit-monthly" />
              </div>
              <div>
                <Label>المتبقي (دج)</Label>
                <Input type="number" min="0" value={editDebt.remainingAmount}
                  onChange={e => setEditDebt(d => d ? { ...d, remainingAmount: e.target.value } : d)} data-testid="input-edit-remaining" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={editDebt.isActive}
                  onChange={e => setEditDebt(d => d ? { ...d, isActive: e.target.checked } : d)} />
                <Label htmlFor="isActive">الدين نشط (لم يُسدد بالكامل)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDebt(null)}>إلغاء</Button>
            <Button onClick={handleEditSave} disabled={editMut.isPending} data-testid="button-submit-edit-debt">
              {editMut.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ التعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
