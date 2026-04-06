import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Search, Users, Clock, AlertTriangle, Calendar } from "lucide-react";
import type { Workshop } from "@shared/schema";

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
  const [search, setSearch] = useState("");
  const [filterWorkshop, setFilterWorkshop] = useState("all");

  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: report, isLoading } = useQuery<any[]>({
    queryKey: ["/api/reports/monthly", `?month=${month}&year=${year}`],
  });

  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
    years.push(String(y));
  }

  const filtered = (report || []).filter((r: any) => {
    const matchSearch = !search || r.employeeName?.includes(search) || r.employeeCode?.includes(search);
    const matchWorkshop = filterWorkshop === "all" || r.workshopId === filterWorkshop;
    return matchSearch && matchWorkshop;
  });

  const totals = filtered.reduce(
    (acc, r) => ({
      totalDays: acc.totalDays + r.totalDays,
      presentDays: acc.presentDays + r.presentDays,
      lateDays: acc.lateDays + r.lateDays,
      absentDays: acc.absentDays + r.absentDays,
      leaveDays: acc.leaveDays + r.leaveDays,
      totalHours: acc.totalHours + r.totalHours,
      totalLateMinutes: acc.totalLateMinutes + r.totalLateMinutes,
    }),
    { totalDays: 0, presentDays: 0, lateDays: 0, absentDays: 0, leaveDays: 0, totalHours: 0, totalLateMinutes: 0 }
  );

  const monthLabel = months.find((m) => m.value === month)?.label || month;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">التقارير الشهرية</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{monthLabel} {year}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Summary cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الموظفون</p>
                <p className="text-xl font-bold">{filtered.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-chart-2/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">أيام الحضور</p>
                <p className="text-xl font-bold">{totals.presentDays}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-chart-5/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">أيام التأخير</p>
                <p className="text-xl font-bold">{totals.lateDays}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">أيام الغياب</p>
                <p className="text-xl font-bold">{totals.absentDays}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الموظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
            data-testid="input-search-report"
          />
        </div>
        <Select value={filterWorkshop} onValueChange={setFilterWorkshop}>
          <SelectTrigger className="w-44" data-testid="select-filter-workshop">
            <SelectValue placeholder="كل الورش" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الورش</SelectItem>
            {workshops?.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !report || report.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد بيانات للفترة المحددة</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right sticky right-0 bg-background">الموظف</TableHead>
                    <TableHead className="text-right">الرقم</TableHead>
                    <TableHead className="text-right">الشركة</TableHead>
                    <TableHead className="text-right">الورشة</TableHead>
                    <TableHead className="text-right">الوردية</TableHead>
                    <TableHead className="text-right">أيام العمل</TableHead>
                    <TableHead className="text-right">حضور</TableHead>
                    <TableHead className="text-right">تأخير</TableHead>
                    <TableHead className="text-right">غياب</TableHead>
                    <TableHead className="text-right">إجازات</TableHead>
                    <TableHead className="text-right">الساعات</TableHead>
                    <TableHead className="text-right">دق. التأخير</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.employeeId} data-testid={`row-report-${r.employeeId}`}>
                      <TableCell className="font-medium sticky right-0 bg-background">{r.employeeName}</TableCell>
                      <TableCell className="text-muted-foreground">{r.employeeCode}</TableCell>
                      <TableCell>{r.companyName || "-"}</TableCell>
                      <TableCell>{r.workshopName || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={r.shift === "morning" ? "default" : "secondary"} className="text-xs">
                          {r.shift === "morning" ? "صباحي" : r.shift === "evening" ? "مسائي" : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.totalDays}</TableCell>
                      <TableCell>
                        <span className="text-chart-2 font-medium">{r.presentDays}</span>
                      </TableCell>
                      <TableCell>
                        <span className={r.lateDays > 0 ? "text-chart-5 font-medium" : ""}>{r.lateDays || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <span className={r.absentDays > 0 ? "text-destructive font-medium" : ""}>{r.absentDays || "-"}</span>
                      </TableCell>
                      <TableCell>{r.leaveDays || "-"}</TableCell>
                      <TableCell>{Math.round(r.totalHours * 10) / 10}</TableCell>
                      <TableCell>{r.totalLateMinutes || "-"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell className="sticky right-0 bg-muted/50">المجموع</TableCell>
                    <TableCell colSpan={4} />
                    <TableCell>{totals.totalDays}</TableCell>
                    <TableCell className="text-chart-2">{totals.presentDays}</TableCell>
                    <TableCell className="text-chart-5">{totals.lateDays}</TableCell>
                    <TableCell className="text-destructive">{totals.absentDays}</TableCell>
                    <TableCell>{totals.leaveDays}</TableCell>
                    <TableCell>{Math.round(totals.totalHours * 10) / 10}</TableCell>
                    <TableCell>{totals.totalLateMinutes}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
