import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileSpreadsheet, TrendingDown, Search, ChevronRight, ChevronLeft, Save, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { fmtDZD } from "@/lib/utils";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const now = new Date();
const WORKSHOPS_PER_PAGE = 2;

type PayrollRow = {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  workshopId: string | null;
  baseSalary: number;
  attendanceScore: number;
  attendanceDeduction: number;
  overtimeHours: number;
  overtimePay: number;
  grantAmount: number;
  deductionAmount: number;
  debtDeduction: number;
  debtSkipped: boolean;
  advanceDeduction: number;
  prevRemainingBalance: number;
  netSalary: number;
  amountPaid: number;
  remainingBalance: number;
  debts?: any[];
};

type PayrollData = { year: number; month: number; rows: PayrollRow[] };
type Workshop = { id: string; name: string };

export default function Payroll() {
  const { toast } = useToast();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [queryKey, setQueryKey] = useState<[string, string, string] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pendingPayments, setPendingPayments] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, error } = useQuery<PayrollData>({
    queryKey: queryKey ?? ["/api/payroll/monthly", month, year],
    queryFn: () => fetch(`/api/payroll/monthly?year=${year}&month=${month}`).then(r => r.json()),
    enabled: !!queryKey,
    retry: false,
  });

  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const saveMutation = useMutation({
    mutationFn: (payload: { employeeId: string; month: string; amountPaid: number; remainingBalance: number }) =>
      apiRequest("POST", "/api/payroll/payment", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/monthly"] });
    },
  });

  const [skippingIds, setSkippingIds] = useState<Set<string>>(new Set());

  const skipDebtMutation = useMutation({
    mutationFn: ({ employeeId, month, skip }: { employeeId: string; month: string; skip: boolean }) =>
      apiRequest(skip ? "POST" : "DELETE", "/api/debt-skips", { employeeId, month }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/monthly"] });
    },
  });

  async function handleToggleDebtSkip(row: PayrollRow) {
    setSkippingIds(s => { const n = new Set(Array.from(s)); n.add(row.employeeId); return n; });
    try {
      await skipDebtMutation.mutateAsync({ employeeId: row.employeeId, month: monthStr, skip: !row.debtSkipped });
      toast({
        title: row.debtSkipped ? "تم إلغاء التعليق" : "تم التعليق",
        description: row.debtSkipped
          ? `سيُخصم قسط الدين من راتب ${row.employeeName} الشهر القادم`
          : `تم تعليق خصم الدين لـ ${row.employeeName} هذا الشهر`,
      });
    } catch {
      toast({ title: "خطأ", description: "فشل تغيير حالة التعليق", variant: "destructive" });
    } finally {
      setSkippingIds(s => { const n = new Set(Array.from(s)); n.delete(row.employeeId); return n; });
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  function handleGenerate() {
    setQueryKey(["/api/payroll/monthly", year, month]);
    setPage(0);
    setSearchQuery("");
    setPendingPayments({});
  }

  // اقتراح المبلغ المدفوع: أقرب 500 نزولاً من الصافي
  function suggestAmount(netSalary: number): number {
    if (netSalary <= 0) return 0;
    return Math.floor(netSalary / 500) * 500;
  }

  const getEffectiveAmountPaid = useCallback((row: PayrollRow) => {
    const pending = pendingPayments[row.employeeId];
    // إذا كان هناك قيمة مكتوبة (غير فارغة) تُقدَّم أولاً
    if (pending !== undefined && pending !== "") return parseFloat(pending) || 0;
    // إذا تم حفظ مبلغ مسبقاً نعود إليه
    if (row.amountPaid > 0) return row.amountPaid;
    // اقتراح تلقائي
    return suggestAmount(row.netSalary);
  }, [pendingPayments]);

  const getEffectiveRemaining = useCallback((row: PayrollRow) => {
    const paid = getEffectiveAmountPaid(row);
    return Math.round((row.netSalary - paid) * 100) / 100;
  }, [getEffectiveAmountPaid]);

  async function handleSavePayment(row: PayrollRow) {
    const amountPaid = getEffectiveAmountPaid(row);
    const remainingBalance = getEffectiveRemaining(row);
    setSavingIds(s => { const n = new Set(Array.from(s)); n.add(row.employeeId); return n; });
    try {
      await saveMutation.mutateAsync({ employeeId: row.employeeId, month: monthStr, amountPaid, remainingBalance });
      setPendingPayments(p => { const n = { ...p }; delete n[row.employeeId]; return n; });
      toast({ title: "تم الحفظ", description: `تم حفظ مبلغ ${fmtDZD(amountPaid)} لـ ${row.employeeName}` });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ المبلغ", variant: "destructive" });
    } finally {
      setSavingIds(s => { const n = new Set(Array.from(s)); n.delete(row.employeeId); return n; });
    }
  }

  const q = searchQuery.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!q) return data.rows;
    return data.rows.filter(r => r.employeeName.toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q));
  }, [data, q]);

  const groupedByWorkshop = useMemo(() => {
    const map = new Map<string, { wsName: string; rows: PayrollRow[] }>();
    for (const row of filteredRows) {
      const wsId = row.workshopId ?? "__none__";
      const ws = workshops.find(w => w.id === wsId);
      const wsName = ws ? ws.name : (wsId === "__none__" ? "بدون ورشة" : wsId);
      if (!map.has(wsId)) map.set(wsId, { wsName, rows: [] });
      map.get(wsId)!.rows.push(row);
    }
    return Array.from(map.values()).sort((a, b) => a.wsName.localeCompare(b.wsName, "ar"));
  }, [filteredRows, workshops]);

  const totalPages = Math.ceil(groupedByWorkshop.length / WORKSHOPS_PER_PAGE);
  const pageGroups = groupedByWorkshop.slice(page * WORKSHOPS_PER_PAGE, (page + 1) * WORKSHOPS_PER_PAGE);

  const totalNet = data?.rows.reduce((s, r) => s + r.netSalary, 0) ?? 0;
  const totalBase = data?.rows.reduce((s, r) => s + r.baseSalary, 0) ?? 0;
  const totalOvertime = data?.rows.reduce((s, r) => s + r.overtimePay, 0) ?? 0;
  const totalGrants = data?.rows.reduce((s, r) => s + r.grantAmount, 0) ?? 0;
  const totalDeductions = data?.rows.reduce((s, r) => s + (r.deductionAmount ?? 0) + r.debtDeduction + r.advanceDeduction, 0) ?? 0;

  function exportToExcel() {
    const url = `/api/payroll/export?year=${year}&month=${month}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `رواتب_${year}-${String(month).padStart(2, "0")}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="p-6 max-w-full mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,hsl(160 70% 38%),hsl(155 65% 48%))", boxShadow: "0 3px 12px hsl(160 70% 38%/0.35)" }}>
          <FileSpreadsheet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">كشف الرواتب الشهري</h1>
          <p className="text-sm text-muted-foreground">عرض الرواتب الصافية لنهاية الشهر</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-36" data-testid="select-payroll-month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS_AR.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28" data-testid="select-payroll-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={isLoading} data-testid="button-generate-payroll">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          عرض الكشف
        </Button>
        {data && (
          <Button variant="outline" onClick={exportToExcel} data-testid="button-export-payroll-excel" className="gap-2 border-green-600/40 hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/20">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <span className="text-green-700 dark:text-green-500">تصدير Excel</span>
          </Button>
        )}
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
          حدث خطأ: {(error as any)?.message}
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الأساسي</p>
              <p className="text-lg font-bold">{fmtDZD(totalBase)}</p>
            </div>
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الخصومات</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                <TrendingDown className="inline h-3 w-3 ml-1" />
                {fmtDZD(totalDeductions)}
              </p>
            </div>
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الساعات الإضافية</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{fmtDZD(totalOvertime)}</p>
            </div>
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي المنح</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{fmtDZD(totalGrants)}</p>
            </div>
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الصافي</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmtDZD(totalNet)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pr-9"
                placeholder="بحث باسم الموظف أو رقمه..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                data-testid="input-search-payroll"
              />
            </div>
            <Badge variant="secondary">{filteredRows.length} موظف</Badge>
            {totalPages > 1 && (
              <span className="text-sm text-muted-foreground">صفحة {page + 1} من {totalPages}</span>
            )}
          </div>

          {groupedByWorkshop.length === 0 ? (
            <div className="rounded-xl border p-12 text-center text-muted-foreground">
              لا توجد نتائج مطابقة للبحث
            </div>
          ) : (
            <div className="space-y-6">
              {pageGroups.map(({ wsName, rows }) => {
                const wsNet = rows.reduce((s, r) => s + r.netSalary, 0);
                const wsBase = rows.reduce((s, r) => s + r.baseSalary, 0);
                return (
                  <div key={wsName} className="rounded-xl border overflow-x-auto">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b">
                      <span className="font-semibold text-sm">{wsName}</span>
                      <div className="flex items-center gap-2 text-xs flex-wrap justify-end">
                        <Badge variant="secondary">{rows.length} موظف</Badge>
                        <span className="text-muted-foreground">صافي:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{fmtDZD(wsNet)}</span>
                      </div>
                    </div>
                    <table className="w-full text-sm min-w-[1400px]">
                      <thead>
                        <tr className="bg-muted/30 text-muted-foreground border-b text-xs">
                          {/* 1 */}
                          <th className="px-2 py-2 text-right font-medium">الاسم</th>
                          {/* 2 */}
                          <th className="px-2 py-2 text-center font-medium">الرقم</th>
                          {/* 3 */}
                          <th className="px-2 py-2 text-right font-medium bg-amber-50 dark:bg-amber-950/20">المبلغ المدفوع</th>
                          {/* 4 */}
                          <th className="px-2 py-2 text-center font-medium">الامضاء</th>
                          {/* 5 */}
                          <th className="px-2 py-2 text-right font-medium">الراتب</th>
                          {/* 6 */}
                          <th className="px-2 py-2 text-center font-medium">نقاط الحضور</th>
                          {/* 7 */}
                          <th className="px-2 py-2 text-right font-medium text-purple-600 dark:text-purple-400">الساعات الإضافية</th>
                          {/* 8 */}
                          <th className="px-2 py-2 text-right font-medium text-blue-600 dark:text-blue-400">المنحة</th>
                          {/* 9 */}
                          <th className="px-2 py-2 text-right font-medium text-red-600 dark:text-red-400">الخصم</th>
                          {/* 10 */}
                          <th className="px-2 py-2 text-right font-medium">خصم الدين</th>
                          {/* 11 */}
                          <th className="px-2 py-2 text-right font-medium">التسبيقات</th>
                          {/* 12 */}
                          <th className="px-2 py-2 text-right font-medium bg-yellow-50 dark:bg-yellow-950/20 text-amber-700 dark:text-amber-400">باقي الصرف القديم</th>
                          {/* 13 */}
                          <th className="px-2 py-2 text-right font-medium bg-green-50 dark:bg-green-950/20">الصافي</th>
                          {/* 14 */}
                          <th className="px-2 py-2 text-right font-medium bg-orange-50 dark:bg-orange-950/20">باقي الصرف الجديد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const effectivePaid = getEffectiveAmountPaid(row);
                          const effectiveRemaining = getEffectiveRemaining(row);
                          const isDirty = pendingPayments[row.employeeId] !== undefined;
                          const isSaving = savingIds.has(row.employeeId);
                          const prevRem = row.prevRemainingBalance ?? 0;
                          return (
                            <tr key={row.employeeId} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                              data-testid={`row-payroll-${row.employeeId}`}>

                              {/* 1: الاسم */}
                              <td className="px-2 py-2">
                                <p className="font-medium text-xs">{row.employeeName}</p>
                              </td>

                              {/* 2: الرقم */}
                              <td className="px-2 py-2 text-center">
                                <p className="text-xs text-muted-foreground font-mono">{row.employeeCode}</p>
                              </td>

                              {/* 3: المبلغ المدفوع */}
                              {(() => {
                                const suggested = row.amountPaid === 0 ? suggestAmount(row.netSalary) : 0;
                                // هل الخانة تعرض الاقتراح حالياً (لم يكتب المستخدم شيئاً)
                                const showingSuggestion = suggested > 0 && pendingPayments[row.employeeId] === undefined;
                                // القيمة المعروضة في الخانة
                                const inputValue = pendingPayments[row.employeeId] !== undefined
                                  ? pendingPayments[row.employeeId]
                                  : (row.amountPaid > 0 ? String(row.amountPaid) : (suggested > 0 ? String(suggested) : "0"));
                                const showSaveBtn = isDirty || row.amountPaid > 0 || suggested > 0;
                                return (
                                  <td className="px-2 py-2 bg-amber-50 dark:bg-amber-950/20">
                                    <div className="flex items-center gap-1">
                                      <div className="relative">
                                        {showingSuggestion && (
                                          <span className="absolute -top-3.5 right-0 text-[10px] text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap pointer-events-none">
                                            مقترح ↓
                                          </span>
                                        )}
                                        <Input
                                          type="number"
                                          className={`h-7 w-28 text-xs font-mono px-2 ${showingSuggestion ? "text-amber-600 dark:text-amber-400 italic border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30" : ""}`}
                                          value={inputValue}
                                          onFocus={() => {
                                            // عند التركيز: إذا كان يعرض الاقتراح نُفرَّغ الخانة
                                            if (showingSuggestion) {
                                              setPendingPayments(p => ({ ...p, [row.employeeId]: "" }));
                                            }
                                          }}
                                          onBlur={e => {
                                            // عند مغادرة الخانة فارغة: نعيد الاقتراح
                                            if (e.target.value === "") {
                                              setPendingPayments(p => { const n = { ...p }; delete n[row.employeeId]; return n; });
                                            }
                                          }}
                                          onChange={e => setPendingPayments(p => ({ ...p, [row.employeeId]: e.target.value }))}
                                          data-testid={`input-amount-paid-${row.employeeId}`}
                                        />
                                      </div>
                                      {showSaveBtn && (
                                        <Button
                                          size="sm"
                                          variant={isDirty ? "default" : (showingSuggestion ? "outline" : "ghost")}
                                          className={`h-7 w-7 p-0 ${showingSuggestion ? "border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30" : ""}`}
                                          onClick={() => handleSavePayment(row)}
                                          disabled={isSaving}
                                          data-testid={`button-save-payment-${row.employeeId}`}
                                        >
                                          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                );
                              })()}

                              {/* 4: الامضاء (فارغ للطباعة) */}
                              <td className="px-2 py-2 border-l border-dashed border-muted-foreground/20" style={{ minWidth: "80px" }}>
                              </td>

                              {/* 5: الراتب الأساسي */}
                              <td className="px-2 py-2 font-mono text-xs">{fmtDZD(row.baseSalary)}</td>

                              {/* 6: نقاط الحضور */}
                              <td className="px-2 py-2 font-mono text-center text-xs" data-testid={`score-payroll-${row.employeeId}`}>
                                <span className={`font-bold ${row.attendanceScore >= 28 ? "text-green-600 dark:text-green-400" : row.attendanceScore >= 24 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                                  {row.attendanceScore.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground"> /30</span>
                              </td>

                              {/* 7: الساعات الإضافية */}
                              <td className="px-2 py-2 font-mono text-xs">
                                {row.overtimePay > 0 ? (
                                  <span className="text-purple-600 dark:text-purple-400">
                                    + {fmtDZD(row.overtimePay)}
                                    <span className="text-muted-foreground text-xs mr-1">({row.overtimeHours}س)</span>
                                  </span>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>

                              {/* 8: المنحة */}
                              <td className="px-2 py-2 font-mono text-xs">
                                {row.grantAmount > 0
                                  ? <span className="text-blue-600 dark:text-blue-400">+ {fmtDZD(row.grantAmount)}</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>

                              {/* 9: الخصم */}
                              <td className="px-2 py-2 font-mono text-xs">
                                {(row.deductionAmount ?? 0) > 0
                                  ? <span className="text-red-600 dark:text-red-400">- {fmtDZD(row.deductionAmount)}</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>

                              {/* 10: خصم الدين */}
                              <td className="px-2 py-2 font-mono text-xs">
                                {(() => {
                                  const hasActiveDebts = (row.debts?.length ?? 0) > 0;
                                  const isSkipping = skippingIds.has(row.employeeId);
                                  if (!hasActiveDebts) {
                                    return <span className="text-muted-foreground">—</span>;
                                  }
                                  if (row.debtSkipped) {
                                    return (
                                      <div className="flex items-center gap-1">
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                          معلَّق
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
                                          onClick={() => handleToggleDebtSkip(row)}
                                          disabled={isSkipping}
                                          data-testid={`button-resume-debt-${row.employeeId}`}
                                          title="إلغاء التعليق"
                                        >
                                          {isSkipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                        </Button>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="flex items-center gap-1">
                                      <span className="text-amber-600 dark:text-amber-400">
                                        - {fmtDZD(row.debtDeduction)}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-muted-foreground hover:text-amber-600"
                                        onClick={() => handleToggleDebtSkip(row)}
                                        disabled={isSkipping}
                                        data-testid={`button-skip-debt-${row.employeeId}`}
                                        title="تعليق الخصم"
                                      >
                                        {isSkipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* 10: التسبيقات */}
                              <td className="px-2 py-2 font-mono text-xs">
                                {row.advanceDeduction > 0
                                  ? <span className="text-red-600 dark:text-red-400">- {fmtDZD(row.advanceDeduction)}</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>

                              {/* 11: باقي الصرف القديم */}
                              <td className="px-2 py-2 font-mono text-xs bg-yellow-50 dark:bg-yellow-950/20">
                                {prevRem !== 0 ? (
                                  <span className={prevRem > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-red-600 dark:text-red-400 font-bold"}>
                                    {prevRem > 0 ? "+" : ""}{fmtDZD(prevRem)}
                                  </span>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>

                              {/* 12: الصافي */}
                              <td className="px-2 py-2 font-mono font-bold text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                                {fmtDZD(row.netSalary)}
                              </td>

                              {/* 13: باقي الصرف الجديد */}
                              <td className="px-2 py-2 font-mono font-bold text-xs bg-orange-50 dark:bg-orange-950/20">
                                <span className={effectiveRemaining > 0 ? "text-orange-600 dark:text-orange-400" : effectiveRemaining < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                                  {effectiveRemaining !== 0 ? (
                                    <>{effectiveRemaining > 0 ? "+" : ""}{fmtDZD(effectiveRemaining)}</>
                                  ) : "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/50 font-bold text-xs">
                          <td className="px-2 py-2">مجموع الورشة</td>
                          <td className="px-2 py-2"></td>
                          {/* المبلغ المدفوع */}
                          <td className="px-2 py-2 font-mono bg-amber-50 dark:bg-amber-950/20">
                            {fmtDZD(rows.reduce((s, r) => s + getEffectiveAmountPaid(r), 0))}
                          </td>
                          {/* الامضاء */}
                          <td className="px-2 py-2"></td>
                          {/* الراتب */}
                          <td className="px-2 py-2 font-mono">{fmtDZD(wsBase)}</td>
                          {/* نقاط الحضور */}
                          <td className="px-2 py-2 font-mono text-center text-muted-foreground">
                            {(rows.reduce((s, r) => s + r.attendanceScore, 0) / rows.length).toFixed(2)} متوسط
                          </td>
                          {/* الساعات الإضافية */}
                          <td className="px-2 py-2 font-mono text-purple-600 dark:text-purple-400">
                            {fmtDZD(rows.reduce((s, r) => s + r.overtimePay, 0))}
                          </td>
                          {/* المنحة */}
                          <td className="px-2 py-2 font-mono text-blue-600 dark:text-blue-400">
                            {fmtDZD(rows.reduce((s, r) => s + r.grantAmount, 0))}
                          </td>
                          {/* الخصم */}
                          <td className="px-2 py-2 font-mono text-red-600 dark:text-red-400">
                            {fmtDZD(rows.reduce((s, r) => s + (r.deductionAmount ?? 0), 0))}
                          </td>
                          {/* خصم الدين */}
                          <td className="px-2 py-2 font-mono text-amber-600 dark:text-amber-400">
                            {fmtDZD(rows.reduce((s, r) => s + r.debtDeduction, 0))}
                          </td>
                          {/* التسبيقات */}
                          <td className="px-2 py-2 font-mono text-red-600 dark:text-red-400">
                            {fmtDZD(rows.reduce((s, r) => s + r.advanceDeduction, 0))}
                          </td>
                          {/* باقي الصرف القديم */}
                          <td className="px-2 py-2 font-mono text-amber-700 dark:text-amber-400 bg-yellow-50 dark:bg-yellow-950/20">
                            {fmtDZD(rows.reduce((s, r) => s + (r.prevRemainingBalance ?? 0), 0))}
                          </td>
                          {/* الصافي */}
                          <td className="px-2 py-2 font-mono text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20">
                            {fmtDZD(wsNet)}
                          </td>
                          {/* باقي الصرف الجديد */}
                          <td className="px-2 py-2 font-mono bg-orange-50 dark:bg-orange-950/20">
                            {fmtDZD(rows.reduce((s, r) => s + getEffectiveRemaining(r), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                data-testid="button-payroll-prev">
                <ChevronRight className="h-4 w-4 ml-1" /> السابق
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button key={i} variant={i === page ? "default" : "ghost"} size="sm" className="w-8 h-8 p-0"
                    onClick={() => setPage(i)} data-testid={`button-payroll-page-${i}`}>
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                data-testid="button-payroll-next">
                التالي <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {!data && !isLoading && !isError && (
        <div className="text-center py-20 text-muted-foreground">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>اختر الشهر والسنة ثم اضغط "عرض الكشف"</p>
        </div>
      )}
    </div>
  );
}
