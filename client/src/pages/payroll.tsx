import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileSpreadsheet, TrendingDown } from "lucide-react";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const now = new Date();

type PayrollRow = {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  baseSalary: number;
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

export default function Payroll() {
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [queryKey, setQueryKey] = useState<[string, string, string] | null>(null);

  const { data, isLoading, isError, error } = useQuery<PayrollData>({
    queryKey: queryKey ?? ["/api/payroll/monthly", month, year],
    queryFn: () => fetch(`/api/payroll/monthly?year=${year}&month=${month}`).then(r => r.json()),
    enabled: !!queryKey,
    retry: false,
  });

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  function handleGenerate() {
    setQueryKey(["/api/payroll/monthly", year, month]);
  }

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

          {/* Table */}
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-b">
                  <th className="px-4 py-3 text-right font-medium">الموظف</th>
                  <th className="px-4 py-3 text-right font-medium">الراتب الأساسي</th>
                  <th className="px-4 py-3 text-right font-medium">خصم الحضور</th>
                  <th className="px-4 py-3 text-right font-medium">قسط الدين</th>
                  <th className="px-4 py-3 text-right font-medium">التسبيقات</th>
                  <th className="px-4 py-3 text-right font-medium bg-green-50 dark:bg-green-950/20">الصافي</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={row.employeeId} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                    data-testid={`row-payroll-${row.employeeId}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.employeeName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{row.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 font-mono">{row.baseSalary.toLocaleString("ar-DZ")} دج</td>
                    <td className="px-4 py-3 font-mono">
                      {row.attendanceDeduction > 0
                        ? <span className="text-red-600 dark:text-red-400">- {row.attendanceDeduction.toLocaleString("ar-DZ")} دج</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.debtDeduction > 0
                        ? <span className="text-amber-600 dark:text-amber-400">- {row.debtDeduction.toLocaleString("ar-DZ")} دج</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.advanceDeduction > 0
                        ? <span className="text-blue-600 dark:text-blue-400">- {row.advanceDeduction.toLocaleString("ar-DZ")} دج</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-mono font-bold bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                      {row.netSalary.toLocaleString("ar-DZ")} دج
                    </td>
                  </tr>
                ))}
                {data.rows.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">لا يوجد موظفون نشطون</td></tr>
                )}
              </tbody>
              {data.rows.length > 0 && (
                <tfoot>
                  <tr className="border-t bg-muted/50 font-bold">
                    <td className="px-4 py-3">المجموع</td>
                    <td className="px-4 py-3 font-mono">{totalBase.toLocaleString("ar-DZ")} دج</td>
                    <td className="px-4 py-3 font-mono text-red-600 dark:text-red-400">
                      {data.rows.reduce((s, r) => s + r.attendanceDeduction, 0).toLocaleString("ar-DZ")} دج
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400">
                      {data.rows.reduce((s, r) => s + r.debtDeduction, 0).toLocaleString("ar-DZ")} دج
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
                      {data.rows.reduce((s, r) => s + r.advanceDeduction, 0).toLocaleString("ar-DZ")} دج
                    </td>
                    <td className="px-4 py-3 font-mono text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20">
                      {totalNet.toLocaleString("ar-DZ")} دج
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
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
