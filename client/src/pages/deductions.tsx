import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, X, Pencil, Trash2, Clock, CheckCircle2, XCircle, Loader2, UserCheck } from "lucide-react";

type DeductionRequest = {
  id: string;
  employeeId: string;
  amount: string;
  reason: string | null;
  deductionDate: string;
  deductionTime: string | null;
  status: string;
  requestedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type LegacyDeduction = {
  id: string;
  employeeId: string;
  amount: string;
  month: number;
  year: number;
  reason: string | null;
  createdAt: string;
  createdBy: string | null;
};

type Employee = {
  id: string;
  name: string;
  employeeCode?: string;
  cardNumber?: string;
};

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") {
    return (
      <span className="relative inline-flex items-center gap-1.5" data-testid="status-pending">
        <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
        <Badge variant="outline" className="border-orange-400 text-orange-500 bg-orange-50 dark:bg-orange-950/30 animate-pulse">
          <Clock className="h-3 w-3 me-1" />
          في الانتظار
        </Badge>
      </span>
    );
  }
  if (status === "approved") {
    return (
      <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-400 dark:text-purple-400" data-testid="status-approved">
        <CheckCircle2 className="h-3 w-3 me-1" />
        مقبول
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30 dark:border-red-400 dark:text-red-400" data-testid="status-rejected">
      <XCircle className="h-3 w-3 me-1" />
      مرفوض
    </Badge>
  );
}

function RequestForm({
  open,
  onClose,
  employees,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  initial?: DeductionRequest | null;
  mode: "create" | "edit";
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(initial ? [initial.employeeId] : []);
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [deductionDate, setDeductionDate] = useState(initial?.deductionDate ?? new Date().toISOString().slice(0, 10));
  const [deductionTime, setDeductionTime] = useState(initial?.deductionTime ?? "");

  const filteredEmployees = employees.filter(e => {
    const q = search.toLowerCase();
    return !q || e.name.toLowerCase().includes(q) || (e.employeeCode ?? "").toLowerCase().includes(q) || (e.cardNumber ?? "").toLowerCase().includes(q);
  });

  function toggleEmployee(id: string) {
    if (mode === "edit") {
      setSelectedIds([id]);
    } else {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  }

  const createMut = useMutation({
    mutationFn: async () => {
      for (const empId of selectedIds) {
        await apiRequest("POST", "/api/deduction-requests", { employeeId: empId, amount, reason, deductionDate, deductionTime });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests/pending-count"] });
      toast({ title: selectedIds.length > 1 ? `تم إرسال ${selectedIds.length} طلبات خصم` : "تم إرسال طلب الخصم", description: isOwner ? undefined : "في انتظار موافقة المالك" });
      onClose();
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/deduction-requests/${initial!.id}`, { amount, reason, deductionDate, deductionTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests"] });
      toast({ title: "تم تحديث الطلب" });
      onClose();
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const isPending = createMut.isPending || editMut.isPending;

  function submit() {
    if (selectedIds.length === 0 || !amount || !deductionDate) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة واختيار موظف واحد على الأقل", variant: "destructive" });
      return;
    }
    if (mode === "create") createMut.mutate();
    else editMut.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "طلب خصم جديد" : "تعديل طلب الخصم"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              الموظف {mode === "create" && <span className="text-muted-foreground text-xs">(يمكن تحديد أكثر من موظف)</span>}
              <span className="text-red-500"> *</span>
            </label>
            <Input
              placeholder="بحث بالاسم أو الكود أو رقم البطاقة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2"
              data-testid="input-employee-search"
            />
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedIds.map(id => {
                  const e = employees.find(x => x.id === id);
                  return e ? (
                    <span key={id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      <UserCheck className="h-3 w-3" />
                      {e.name}
                      <button type="button" onClick={() => toggleEmployee(id)} className="ms-0.5 hover:text-red-500">×</button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            <div className="max-h-36 overflow-y-auto border rounded-md divide-y">
              {filteredEmployees.slice(0, 15).map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggleEmployee(e.id)}
                  className={`w-full text-right px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center justify-between ${selectedIds.includes(e.id) ? "bg-primary/10 font-semibold" : ""}`}
                  data-testid={`option-employee-${e.id}`}
                >
                  <span>{e.name} {e.employeeCode ? `(${e.employeeCode})` : ""}</span>
                  {selectedIds.includes(e.id) && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
              {filteredEmployees.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">لا توجد نتائج</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">المبلغ (درهم) <span className="text-red-500">*</span></label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                data-testid="input-amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">التاريخ <span className="text-red-500">*</span></label>
              <Input
                type="date"
                value={deductionDate}
                onChange={e => setDeductionDate(e.target.value)}
                data-testid="input-deduction-date"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">الوقت (اختياري)</label>
            <Input
              type="time"
              value={deductionTime}
              onChange={e => setDeductionTime(e.target.value)}
              data-testid="input-deduction-time"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">السبب</label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="سبب الخصم..."
              data-testid="input-reason"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending} data-testid="button-cancel">إلغاء</Button>
          <Button onClick={submit} disabled={isPending} data-testid="button-submit-request">
            {isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {mode === "create"
              ? selectedIds.length > 1 ? `إرسال ${selectedIds.length} طلبات` : "إرسال الطلب"
              : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Deductions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const username = user?.username ?? "";

  const [mainTab, setMainTab] = useState<"requests" | "legacy">("requests");
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<DeductionRequest | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  const { data: requests = [], isLoading: reqLoading } = useQuery<DeductionRequest[]>({
    queryKey: ["/api/deduction-requests"],
  });

  const { data: legacyDeductions = [], isLoading: legLoading } = useQuery<LegacyDeduction[]>({
    queryKey: ["/api/deductions", filterMonth, filterYear],
    queryFn: async () => {
      const res = await fetch(`/api/deductions?month=${filterMonth}&year=${filterYear}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: username === "owner" || username === "caisse",
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/deduction-requests/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests/pending-count"] });
      toast({ title: "تمت الموافقة على الطلب" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/deduction-requests/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests/pending-count"] });
      toast({ title: "تم رفض الطلب" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/deduction-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deduction-requests/pending-count"] });
      toast({ title: "تم حذف الطلب" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteLegacyMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/deductions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deductions"] });
      toast({ title: "تم حذف الخصم" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  function empName(id: string) {
    return employees.find(e => e.id === id)?.name ?? id;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
  }

  const fMonth = parseInt(filterMonth);
  const fYear = parseInt(filterYear);

  const filteredRequests = requests.filter(r => {
    if (username === "owner" && statusTab !== "all" && r.status !== statusTab) return false;
    const d = new Date(r.deductionDate);
    if (!isNaN(d.getTime())) {
      if (d.getMonth() + 1 !== fMonth || d.getFullYear() !== fYear) return false;
    }
    return true;
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;

  const isOwner = username === "owner";
  const isObserver = username === "observer";
  const isCaisse = username === "caisse";

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  const FilterBar = (
    <div className="flex flex-wrap gap-2 items-center">
      <Select value={filterMonth} onValueChange={setFilterMonth}>
        <SelectTrigger className="w-32" data-testid="select-filter-month">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS_AR.map((m, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterYear} onValueChange={setFilterYear}>
        <SelectTrigger className="w-24" data-testid="select-filter-year">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">الخصومات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isOwner && "إدارة طلبات الخصم والموافقة عليها"}
            {isObserver && "تقديم وإدارة طلبات الخصم"}
            {isCaisse && "عرض الخصومات المقبولة والمسجلة"}
          </p>
        </div>
        {(isOwner || isObserver) && (
          <Button onClick={() => setShowForm(true)} data-testid="button-new-request">
            <Plus className="h-4 w-4 me-1.5" />
            طلب خصم جديد
          </Button>
        )}
      </div>

      {/* OWNER: Main Tabs (Requests vs Legacy) */}
      {isOwner && (
        <div className="flex border-b">
          <button
            onClick={() => setMainTab("requests")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mainTab === "requests" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-main-requests"
          >
            طلبات الخصم
            {pendingCount > 0 && (
              <span className="ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] text-white font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMainTab("legacy")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mainTab === "legacy" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-main-legacy"
          >
            خصومات مسجلة
          </button>
        </div>
      )}

      {/* OWNER: Requests Tab */}
      {(!isCaisse && (!isOwner || mainTab === "requests")) && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            {FilterBar}
            {isOwner && (
              <div className="flex border rounded-lg overflow-hidden ms-auto">
                {(["all", "pending", "approved", "rejected"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setStatusTab(t)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${statusTab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    data-testid={`tab-status-${t}`}
                  >
                    {{ all: "الكل", pending: "معلق", approved: "مقبول", rejected: "مرفوض" }[t]}
                    {t === "pending" && pendingCount > 0 && (
                      <span className="ms-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] text-white font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium">الموظف</th>
                    <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                    <th className="text-right px-4 py-3 font-medium">التاريخ</th>
                    <th className="text-right px-4 py-3 font-medium">السبب</th>
                    <th className="text-right px-4 py-3 font-medium">الحالة</th>
                    {!isCaisse && <th className="text-right px-4 py-3 font-medium">الإجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reqLoading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />جاري التحميل...</td></tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد طلبات خصم</td></tr>
                  ) : filteredRequests.map(r => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-deduction-${r.id}`}>
                      <td className="px-4 py-3 font-medium" data-testid={`text-emp-name-${r.id}`}>{empName(r.employeeId)}</td>
                      <td className="px-4 py-3" data-testid={`text-amount-${r.id}`}>{parseFloat(r.amount).toFixed(2)} د.م</td>
                      <td className="px-4 py-3 whitespace-nowrap" data-testid={`text-date-${r.id}`}>
                        {formatDate(r.deductionDate)}
                        {r.deductionTime && <span className="text-muted-foreground ms-1 text-xs">({r.deductionTime})</span>}
                      </td>
                      <td className="px-4 py-3 max-w-[160px] truncate" data-testid={`text-reason-${r.id}`}>{r.reason ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isOwner && r.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="border-purple-400 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 dark:border-purple-400 dark:text-purple-400 h-7 px-2" onClick={() => approveMut.mutate(r.id)} disabled={approveMut.isPending} data-testid={`button-approve-${r.id}`}><Check className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="outline" className="border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-red-400 dark:text-red-400 h-7 px-2" onClick={() => rejectMut.mutate(r.id)} disabled={rejectMut.isPending} data-testid={`button-reject-${r.id}`}><X className="h-3.5 w-3.5" /></Button>
                            </>
                          )}
                          {isOwner && r.status === "rejected" && (
                            <Button size="sm" variant="outline" className="border-purple-400 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 dark:border-purple-400 dark:text-purple-400 h-7 px-2 text-xs" onClick={() => approveMut.mutate(r.id)} disabled={approveMut.isPending} data-testid={`button-approve-rejected-${r.id}`}>قبول</Button>
                          )}
                          {isOwner && r.status === "approved" && (
                            <Button size="sm" variant="outline" className="border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-red-400 dark:text-red-400 h-7 px-2 text-xs" onClick={() => rejectMut.mutate(r.id)} disabled={rejectMut.isPending} data-testid={`button-reject-approved-${r.id}`}>إلغاء</Button>
                          )}
                          {(isOwner || (isObserver && r.status === "pending" && r.requestedBy === "observer")) && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => setEditTarget(r)} data-testid={`button-edit-${r.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                          )}
                          {(isOwner || (isObserver && r.status === "pending" && r.requestedBy === "observer")) && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => { if (confirm("هل تريد حذف هذا الطلب؟")) deleteMut.mutate(r.id); }} disabled={deleteMut.isPending} data-testid={`button-delete-${r.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredRequests.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span data-testid="text-total-records">إجمالي السجلات: {filteredRequests.length}</span>
              <span data-testid="text-total-amount">إجمالي المبالغ: <strong className="text-foreground">{filteredRequests.reduce((s, r) => s + parseFloat(r.amount ?? "0"), 0).toFixed(2)} د.م</strong></span>
            </div>
          )}
        </>
      )}

      {/* OWNER: Legacy Deductions Tab */}
      {isOwner && mainTab === "legacy" && (
        <>
          {FilterBar}
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium">الموظف</th>
                    <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                    <th className="text-right px-4 py-3 font-medium">الشهر/السنة</th>
                    <th className="text-right px-4 py-3 font-medium">السبب</th>
                    <th className="text-right px-4 py-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {legLoading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />جاري التحميل...</td></tr>
                  ) : legacyDeductions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد خصومات مسجلة</td></tr>
                  ) : legacyDeductions.map(d => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-legacy-${d.id}`}>
                      <td className="px-4 py-3 font-medium">{empName(d.employeeId)}</td>
                      <td className="px-4 py-3">{parseFloat(d.amount).toFixed(2)} د.م</td>
                      <td className="px-4 py-3">{MONTHS_AR[(d.month ?? 1) - 1]} {d.year}</td>
                      <td className="px-4 py-3 max-w-[160px] truncate">{d.reason ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => { if (confirm("هل تريد حذف هذا الخصم؟")) deleteLegacyMut.mutate(d.id); }} disabled={deleteLegacyMut.isPending} data-testid={`button-delete-legacy-${d.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CAISSE: Combined read-only view (approved requests + legacy deductions) */}
      {isCaisse && (
        <>
          {FilterBar}

          {/* Approved Requests */}
          <div>
            <h2 className="text-base font-semibold mb-2 text-purple-600 dark:text-purple-400">طلبات الخصم المقبولة</h2>
            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-right px-4 py-3 font-medium">الموظف</th>
                      <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                      <th className="text-right px-4 py-3 font-medium">التاريخ</th>
                      <th className="text-right px-4 py-3 font-medium">السبب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reqLoading ? (
                      <tr><td colSpan={4} className="text-center py-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
                    ) : requests.filter(r => {
                      const d = new Date(r.deductionDate);
                      return !isNaN(d.getTime()) && d.getMonth() + 1 === fMonth && d.getFullYear() === fYear;
                    }).length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد طلبات مقبولة</td></tr>
                    ) : requests.filter(r => {
                      const d = new Date(r.deductionDate);
                      return !isNaN(d.getTime()) && d.getMonth() + 1 === fMonth && d.getFullYear() === fYear;
                    }).map(r => (
                      <tr key={r.id} className="hover:bg-muted/30" data-testid={`row-caisse-req-${r.id}`}>
                        <td className="px-4 py-3 font-medium">{empName(r.employeeId)}</td>
                        <td className="px-4 py-3">{parseFloat(r.amount).toFixed(2)} د.م</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(r.deductionDate)}</td>
                        <td className="px-4 py-3 max-w-[160px] truncate">{r.reason ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Legacy Deductions */}
          {legacyDeductions.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-2 text-muted-foreground">خصومات مسجلة (قديمة)</h2>
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-right px-4 py-3 font-medium">الموظف</th>
                        <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                        <th className="text-right px-4 py-3 font-medium">الشهر/السنة</th>
                        <th className="text-right px-4 py-3 font-medium">السبب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {legacyDeductions.map(d => (
                        <tr key={d.id} className="hover:bg-muted/30" data-testid={`row-caisse-legacy-${d.id}`}>
                          <td className="px-4 py-3 font-medium">{empName(d.employeeId)}</td>
                          <td className="px-4 py-3">{parseFloat(d.amount).toFixed(2)} د.م</td>
                          <td className="px-4 py-3">{MONTHS_AR[(d.month ?? 1) - 1]} {d.year}</td>
                          <td className="px-4 py-3 max-w-[160px] truncate">{d.reason ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Form */}
      {showForm && (
        <RequestForm
          open={showForm}
          onClose={() => setShowForm(false)}
          employees={employees}
          mode="create"
        />
      )}

      {/* Edit Form */}
      {editTarget && (
        <RequestForm
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          employees={employees}
          initial={editTarget}
          mode="edit"
        />
      )}
    </div>
  );
}
