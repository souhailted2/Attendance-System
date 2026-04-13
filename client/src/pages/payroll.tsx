import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileSpreadsheet, TrendingDown, Search, ChevronRight, ChevronLeft } from "lucide-react";

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
  debtDeduction: number;
  advanceDeduction: number;
  netSalary: number;
};

type PayrollData = {
  year: number;
  month: number;
  rows: PayrollRow[];
};

type Workshop = { id: string; name: string };

export default function Payroll() {
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [queryKey, setQueryKey] = useState<[string, string, string] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useQuery<PayrollData>({
    queryKey: queryKey ?? ["/api/payroll/monthly", month, year],
    queryFn: () => fetch(`/api/payroll/monthly?year=${year}&month=${month}`).then(r => r.json()),
    enabled: !!queryKey,
    retry: false,
  });

  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  function handleGenerate() {
    setQueryKey(["/api/payroll/monthly", year, month]);
    setPage(0);
    setSearchQuery("");
  }

  const q = searchQuery.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!q) return data.rows;
    return data.rows.filter(r =>
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeCode.toLowerCase().includes(q)
    );
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
  const totalDeductions = data?.rows.reduce((s, r) => s + r.attendanceDeduction + r.debtDeduction + r.advanceDeduction, 0) ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
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

      {/* Controls */}
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
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
          حدث خطأ: {(error as any)?.message}
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الرواتب الأساسية</p>
              <p className="text-xl font-bold">{totalBase.toLocaleString("ar-DZ")} <span className="text-sm font-normal text-muted-foreground">دج</span></p>
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الخصومات</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                <TrendingDown className="inline h-4 w-4 ml-1" />
                {totalDeductions.toLocaleString("ar-DZ")} <span className="text-sm font-normal">دج</span>
              </p>
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الصافي</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{totalNet.toLocaleString("ar-DZ")} <span className="text-sm font-normal">دج</span></p>
            </div>
          </div>

          {/* Search */}
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
              <span className="text-sm text-muted-foreground">
                صفحة {page + 1} من {totalPages}
              </span>
            )}
          </div>

          {/* Workshop tables */}
          {groupedByWorkshop.length === 0 ? (
            <div className="rounded-xl border p-12 text-center text-muted-foreground">
              لا توجد نتائج مطابقة للبحث
            </div>
          ) : (
            <div className="space-y-6">
              {pageGroups.map(({ wsName, rows }) => {
                const wsBase = rows.reduce((s, r) => s + r.baseSalary, 0);
                const wsNet = rows.reduce((s, r) => s + r.netSalary, 0);
                const wsDeduct = rows.reduce((s, r) => s + r.attendanceDeduction + r.debtDeduction + r.advanceDeduction, 0);
                return (
                  <div key={wsName} className="rounded-xl border overflow-x-auto">
                    {/* Workshop header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b">
                      <span className="font-semibold text-sm">{wsName}</span>
                      <div className="flex items-center gap-2 text-xs flex-wrap justify-end">
                        <Badge variant="secondary">{rows.length} موظف</Badge>
                        <span className="text-muted-foreground">صافي:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{wsNet.toLocaleString("ar-DZ")} دج</span>
                      </div>
                    </div>
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="bg-muted/30 text-muted-foreground border-b">
                          <th className="px-4 py-2 text-right font-medium">الموظف</th>
                          <th className="px-4 py-2 text-right font-medium">الراتب الأساسي</th>
                          <th className="px-4 py-2 text-right font-medium">مجموع النقطة</th>
                          <th className="px-4 py-2 text-right font-medium">خصم الحضور</th>
                          <th className="px-4 py-2 text-right font-medium">قسط الدين</th>
                          <th className="px-4 py-2 text-right font-medium">التسبيقات</th>
                          <th className="px-4 py-2 text-right font-medium bg-green-50 dark:bg-green-950/20">الصافي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={row.employeeId} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                            data-testid={`row-payroll-${row.employeeId}`}>
                            <td className="px-4 py-2.5">
                              <p className="font-medium">{row.employeeName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{row.employeeCode}</p>
                            </td>
                            <td className="px-4 py-2.5 font-mono">{row.baseSalary.toLocaleString("ar-DZ")} دج</td>
                            <td className="px-4 py-2.5 font-mono text-center" data-testid={`score-payroll-${row.employeeId}`}>
                              <span className={`font-bold ${row.attendanceScore >= 28 ? "text-green-600 dark:text-green-400" : row.attendanceScore >= 24 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                                {row.attendanceScore.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground"> / 30</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono">
                              {row.attendanceDeduction > 0
                                ? <span className="text-red-600 dark:text-red-400">- {row.attendanceDeduction.toLocaleString("ar-DZ")} دج</span>
                                : <span className="text-muted-foreground">—</span>
                              }
                            </td>
                            <td className="px-4 py-2.5 font-mono">
                              {row.debtDeduction > 0
                                ? <span className="text-amber-600 dark:text-amber-400">- {row.debtDeduction.toLocaleString("ar-DZ")} دج</span>
                                : <span className="text-muted-foreground">—</span>
                              }
                            </td>
                            <td className="px-4 py-2.5 font-mono">
                              {row.advanceDeduction > 0
                                ? <span className="text-blue-600 dark:text-blue-400">- {row.advanceDeduction.toLocaleString("ar-DZ")} دج</span>
                                : <span className="text-muted-foreground">—</span>
                              }
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                              {row.netSalary.toLocaleString("ar-DZ")} دج
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/50 font-bold text-sm">
                          <td className="px-4 py-2">مجموع الورشة</td>
                          <td className="px-4 py-2 font-mono">{wsBase.toLocaleString("ar-DZ")} دج</td>
                          <td className="px-4 py-2 font-mono text-center text-muted-foreground">
                            {(rows.reduce((s, r) => s + r.attendanceScore, 0) / rows.length).toFixed(2)} متوسط
                          </td>
                          <td className="px-4 py-2 font-mono text-red-600 dark:text-red-400">
                            {rows.reduce((s, r) => s + r.attendanceDeduction, 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-4 py-2 font-mono text-amber-600 dark:text-amber-400">
                            {rows.reduce((s, r) => s + r.debtDeduction, 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">
                            {rows.reduce((s, r) => s + r.advanceDeduction, 0).toLocaleString("ar-DZ")} دج
                          </td>
                          <td className="px-4 py-2 font-mono text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20">
                            {wsNet.toLocaleString("ar-DZ")} دج
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
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
