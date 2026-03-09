import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

const months = [
  { value: "1", label: "يناير" }, { value: "2", label: "فبراير" },
  { value: "3", label: "مارس" }, { value: "4", label: "أبريل" },
  { value: "5", label: "مايو" }, { value: "6", label: "يونيو" },
  { value: "7", label: "يوليو" }, { value: "8", label: "أغسطس" },
  { value: "9", label: "سبتمبر" }, { value: "10", label: "أكتوبر" },
  { value: "11", label: "نوفمبر" }, { value: "12", label: "ديسمبر" },
];

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data: report, isLoading } = useQuery<any[]>({
    queryKey: ["/api/reports/monthly", `?month=${month}&year=${year}`],
  });

  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
    years.push(String(y));
  }

  const totals = report?.reduce(
    (acc, r) => ({
      totalDays: acc.totalDays + r.totalDays,
      presentDays: acc.presentDays + r.presentDays,
      lateDays: acc.lateDays + r.lateDays,
      absentDays: acc.absentDays + r.absentDays,
      leaveDays: acc.leaveDays + r.leaveDays,
      totalHours: acc.totalHours + r.totalHours,
      totalLateMinutes: acc.totalLateMinutes + r.totalLateMinutes,
      totalPenalty: acc.totalPenalty + r.totalPenalty,
    }),
    { totalDays: 0, presentDays: 0, lateDays: 0, absentDays: 0, leaveDays: 0, totalHours: 0, totalLateMinutes: 0, totalPenalty: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">التقارير الشهرية</h1>
        <div className="flex items-center gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-32" data-testid="select-month"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28" data-testid="select-year"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !report || report.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد بيانات للفترة المحددة</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">الرقم</TableHead>
                    <TableHead className="text-right">الشركة</TableHead>
                    <TableHead className="text-right">الورشة</TableHead>
                    <TableHead className="text-right">الوردية</TableHead>
                    <TableHead className="text-right">الراتب</TableHead>
                    <TableHead className="text-right">أيام العمل</TableHead>
                    <TableHead className="text-right">حضور</TableHead>
                    <TableHead className="text-right">تأخير</TableHead>
                    <TableHead className="text-right">غياب</TableHead>
                    <TableHead className="text-right">إجازات</TableHead>
                    <TableHead className="text-right">الساعات</TableHead>
                    <TableHead className="text-right">دقائق التأخير</TableHead>
                    <TableHead className="text-right">الخصومات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.map((r: any) => (
                    <TableRow key={r.employeeId} data-testid={`row-report-${r.employeeId}`}>
                      <TableCell className="font-medium">{r.employeeName}</TableCell>
                      <TableCell>{r.employeeCode}</TableCell>
                      <TableCell>{r.companyName || "-"}</TableCell>
                      <TableCell>{r.workshopName || "-"}</TableCell>
                      <TableCell>{r.shift === "morning" ? "صباحي" : r.shift === "evening" ? "مسائي" : "-"}</TableCell>
                      <TableCell>{r.wage}</TableCell>
                      <TableCell>{r.totalDays}</TableCell>
                      <TableCell>{r.presentDays}</TableCell>
                      <TableCell>{r.lateDays}</TableCell>
                      <TableCell>{r.absentDays}</TableCell>
                      <TableCell>{r.leaveDays}</TableCell>
                      <TableCell>{Math.round(r.totalHours * 100) / 100}</TableCell>
                      <TableCell>{r.totalLateMinutes}</TableCell>
                      <TableCell>{Math.round(r.totalPenalty * 100) / 100}</TableCell>
                    </TableRow>
                  ))}
                  {totals && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>المجموع</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{totals.totalDays}</TableCell>
                      <TableCell>{totals.presentDays}</TableCell>
                      <TableCell>{totals.lateDays}</TableCell>
                      <TableCell>{totals.absentDays}</TableCell>
                      <TableCell>{totals.leaveDays}</TableCell>
                      <TableCell>{Math.round(totals.totalHours * 100) / 100}</TableCell>
                      <TableCell>{totals.totalLateMinutes}</TableCell>
                      <TableCell>{Math.round(totals.totalPenalty * 100) / 100}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
