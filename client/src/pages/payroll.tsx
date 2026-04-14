import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileSpreadsheet, TrendingDown, Search, ChevronRight, ChevronLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  debtDeduction: number;
  advanceDeduction: number;
  netSalary: number;
  amountPaid: number;
  remainingBalance: number;
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

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  function handleGenerate() {
    setQueryKey(["/api/payroll/monthly", year, month]);
    setPage(0);
    setSearchQuery("");
    setPendingPayments({});
  }

  const getEffectiveAmountPaid = useCallback((row: PayrollRow) => {
    const pending = pendingPayments[row.employeeId];
    return pending !== undefined ? parseFloat(pending) || 0 : row.amountPaid;
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
      toast({ title: "تم الحفظ", description: `تم حفظ مبلغ ${amountPaid.toLocaleString("ar-DZ")} دج لـ ${row.employeeName}` });
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
  const totalDeductions = data?.rows.reduce((s, r) => s + r.attendanceDeduction + r.debtDeduction + r.advanceDeduction, 0) ?? 0;

  function exportToExcel() {
    const url = `/api/payroll/export?year=${year}&month=${month}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${year}-${String(month).padStart(2, "0")}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
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
          <Button variant="outline" onClick={exportToExcel} data-testid="button-export-payroll-excel" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            تصدير Excel
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
              <p className="text-lg font-bold">{totalBase.toLocaleString("ar-DZ")} <span className="text-xs font-normal text-muted-foreground">دج</span></p>
            </div>
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الخصومات</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                <TrendingDown className="inline h-3 w-3 ml-1" />
                {totalDeductions.toLocaleString("ar-DZ")} <span className="text-xs font-normal">دج</span>
              </p>
            </div>
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الساعات الإضافية</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalOvertime.toLocaleString("ar-DZ")} <span className="text-xs font-normal">دج</span></p>
            </div>
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي المنح</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalGrants.toLocaleString("ar-DZ")} <span className="text-xs font-normal">دج</span></p>
            </div>
            <div className="rounded-xl border p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الصافي</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{totalNet.toLocaleString("ar-DZ")} <span className="text-xs font-normal">دج</span></p>
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
                        <span className="font-bold text-green-600 dark:text-green-400">{wsNet.toLocaleString("ar-DZ")} دج</span>
                      </div>
                    </div>
                    <table className="w-full text-sm min-w-[1100px]">
                      <thead>
                        <tr className="bg-muted/30 text-muted-foreground border-b text-xs">
                          <th className="px-3 py-2 text-right font-medium">الموظف</th>
                          <th className="px-3 py-2 text-right font-medium">الأساسي</th>
                          <th className="px-3 py-2 text-center font-medium">النقطة</th>
                          <th className="px-3 py-2 text-right font-medium">خصم الحضور</th>
                          <th className="px-3 py-2 text-right font-medium text-purple-600 dark:text-purple-400">أجر الساعات الإضافية</th>
                          <th className="px-3 py-2 text-right font-medium text-blue-600 dark:text-blue-400">المنحة</th>
                          <th className="px-3 py-2 text-right font-medium">قسط الدين</th>
                          <th className="px-3 py-2 text-right font-medium">التسبيقات</th>
                          <th className="px-3 py-2 text-right font-medium bg-green-50 dark:bg-green-950/20">الصافي</th>
                          <th className="px-3 py-2 text-right font-medium bg-amber-50 dark:bg-amber-950/20">المبلغ المدفوع</th>
                          <th className="px-3 py-2 text-right font-medium bg-orange-50 dark:bg-orange-950/20">باقي الصرف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const effectivePaid = getEffectiveAmountPaid(row);
                          const effectiveRemaining = getEffectiveRemaining(row);
                          const isDirty = pendingPayments[row.employeeId] !== undefined;
                          const isSaving = savingIds.has(row.employeeId);
                          return (
                            <tr key={row.employeeId} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                              data-testid={`row-payroll-${row.employeeId}`}>
                              <td className="px-3 py-2">
                                <p className="font-medium text-xs">{row.employeeName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{row.employeeCode}</p>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">{row.baseSalary.toLocaleString("ar-DZ")} دج</td>
                              <td className="px-3 py-2 font-mono text-center text-xs" data-testid={`score-payroll-${row.employeeId}`}>
                                <span className={`font-bold ${row.attendanceScore >= 28 ? "text-green-600 dark:text-green-400" : row.attendanceScore >= 24 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                                  {row.attendanceScore.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground"> /30</span>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {row.attendanceDeduction > 0
                                  ? <span className="text-red-600 dark:text-red-400">- {row.attendanceDeduction.toLocaleString("ar-DZ")} دج</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {row.overtimePay > 0 ? (
                                  <span className="text-purple-600 dark:text-purple-400">
                                    + {row.overtimePay.toLocaleString("ar-DZ")} دج
                                    <span className="text-muted-foreground text-xs mr-1">({row.overtimeHours}س)</span>
                                  </span>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {row.grantAmount > 0
                                  ? <span className="text-blue-600 dark:text-blue-400">+ {row.grantAmount.toLocaleString("ar-DZ")} دج</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {row.debtDeduction > 0
                                  ? <span className="text-amber-600 dark:text-amber-400">- {row.debtDeduction.toLocaleString("ar-DZ")} دج</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {row.advanceDeduction > 0
                                  ? <span className="text-blue-600 dark:text-blue-400">- {row.advanceDeduction.toLocaleString("ar-DZ")} دج</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                                {row.netSalary.toLocaleString("ar-DZ")} دج
                              </td>
                              <td className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20">
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    className="h-7 w-28 text-xs font-mono px-2"
                                    value={pendingPayments[row.employeeId] ?? String(row.amountPaid)}
                                    onChange={e => setPendingPayments(p => ({ ...p, [row.employeeId]: e.target.value }))}
                                    data-testid={`input-amount-paid-${row.employeeId}`}
                                  />
                                  {(isDirty || row.amountPaid > 0) && (
                                    <Button
                                      size="sm"
                                      variant={isDirty ? "default" : "ghost"}
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleSavePayment(row)}
                                      disabled={isSaving}
                                      data-testid={`button-save-payment-${row.employeeId}`}
                                    >
                                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-xs bg-orange-50 dark:bg-orange-950/20">
                                <span className={effectiveRemaining > 0 ? "text-orange-600 dark:text-orange-400" : effectiveRemaining < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                                  {effectiveRemaining !== 0 ? (
                                    <>{effectiveRemaining > 0 ? "+" : ""}{effectiveRemaining.toLocaleString("ar-DZ")} دج</>
                                  ) : "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/50 font-bold text-xs">
                          <td className="px-3 py-2">مجموع الورشة</td>
                          <td className="px-3 py-2 font-mono">{wsBase.toLocaleString("ar-DZ")} دج</td>
                          <td className="px-3 py-2 font-mono text-center text-muted-foreground">
                            {(rows.reduce((s, r) => s + r.attendanceScore, 0) / rows.length).toFixed(2)} متوسط
                          </td>
                          <td className="px-3 py-2 font-mono text-red-600 dark:text-red-400">
                            {rows.reduce((s, r) => s + r.attendanceDeduction, 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-3 py-2 font-mono text-purple-600 dark:text-purple-400">
                            {rows.reduce((s, r) => s + r.overtimePay, 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-3 py-2 font-mono text-blue-600 dark:text-blue-400">
                            {rows.reduce((s, r) => s + r.grantAmount, 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-3 py-2 font-mono text-amber-600 dark:text-amber-400">
                            {rows.reduce((s, r) => s + r.debtDeduction, 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-3 py-2 font-mono text-blue-600 dark:text-blue-400">
                            {rows.reduce((s, r) => s + r.advanceDeduction, 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-3 py-2 font-mono text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20">
                            {wsNet.toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-3 py-2 font-mono bg-amber-50 dark:bg-amber-950/20">
                            {rows.reduce((s, r) => s + getEffectiveAmountPaid(r), 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-3 py-2 font-mono bg-orange-50 dark:bg-orange-950/20">
                            {rows.reduce((s, r) => s + getEffectiveRemaining(r), 0).toLocaleString("ar-DZ")} دج
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
