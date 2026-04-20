import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Users, ClipboardCheck, AlertTriangle, Clock, Building2,
  TrendingUp, TrendingDown, UserCheck, CalendarClock,
  BarChart3, ExternalLink, ChevronDown, ChevronUp, FileSpreadsheet, UserX,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import * as XLSX from "xlsx";
import type { Employee, Company, Workshop } from "@shared/schema";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, hsl(271 76% 45%), hsl(280 70% 55%))",
    "linear-gradient(135deg, hsl(43 96% 48%), hsl(36 90% 55%))",
    "linear-gradient(135deg, hsl(160 70% 38%), hsl(155 65% 48%))",
    "linear-gradient(135deg, hsl(220 80% 50%), hsl(230 75% 60%))",
    "linear-gradient(135deg, hsl(320 70% 48%), hsl(330 65% 58%))",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

const statCards = [
  {
    key: "employees",
    label: "إجمالي الموظفين",
    sublabel: "موظف نشط",
    icon: Users,
    gradient: "linear-gradient(145deg, hsl(262 76% 40%), hsl(275 72% 54%))",
    glow: "262 76% 45%",
    testId: "text-total-employees",
  },
  {
    key: "present",
    label: "حضور اليوم",
    sublabel: "سجل حضور",
    icon: UserCheck,
    gradient: "linear-gradient(145deg, hsl(160 70% 30%), hsl(155 65% 44%))",
    glow: "160 70% 38%",
    testId: "text-present-today",
  },
  {
    key: "late",
    label: "متأخرون",
    sublabel: "تأخر عن الدوام",
    icon: Clock,
    gradient: "linear-gradient(145deg, hsl(43 96% 36%), hsl(36 92% 50%))",
    glow: "43 96% 42%",
    testId: "text-late-today",
  },
  {
    key: "companies",
    label: "الشركات / الورش",
    sublabel: "وحدة تنظيمية",
    icon: Building2,
    gradient: "linear-gradient(145deg, hsl(220 80% 38%), hsl(230 75% 52%))",
    glow: "220 80% 50%",
    testId: "text-companies-count",
  },
];

const quickActions = [
  { label: "سجل الحضور", url: "/attendance", icon: ClipboardCheck, color: "hsl(160 70% 38%)" },
  { label: "الموظفين", url: "/employees", icon: Users, color: "hsl(271 76% 45%)" },
  { label: "التقارير", url: "/reports", icon: BarChart3, color: "hsl(43 96% 42%)" },
  { label: "الفترات", url: "/shifts", icon: CalendarClock, color: "hsl(220 80% 50%)" },
];

interface WeeklyStat {
  date: string;
  day: string;
  present: number;
  late: number;
  absent: number;
}

interface MonthlySummary {
  topLate: { employeeId: string; name: string; lateDays: number }[];
  lastWeekRate: number;
  lastWeekPresent: number;
  totalActive: number;
  workshopRates: { workshopId: string; name: string; present: number; total: number; rate: number }[];
}

const ABSENT_PREVIEW = 8;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-background shadow-md px-3 py-2 text-xs space-y-1 min-w-[100px]" dir="rtl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: entry.color || entry.fill }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [absentExpanded, setAbsentExpanded] = useState(false);
  const { user } = useAuth();

  const { data: employees, isLoading: loadingEmp } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: companies } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const today = new Date().toISOString().split("T")[0];
  const { data: attendance, isLoading: loadingAtt } = useQuery<any[]>({
    queryKey: ["/api/attendance", `?date=${today}`],
  });
  const { data: weeklyStats, isLoading: loadingWeekly } = useQuery<WeeklyStat[]>({
    queryKey: ["/api/stats/weekly"],
  });
  const { data: monthlySummary, isLoading: loadingMonthly } = useQuery<MonthlySummary>({
    queryKey: ["/api/stats/monthly-summary"],
  });

  const activeEmployees = employees?.filter((e) => e.isActive) || [];
  const presentToday = attendance?.filter((a: any) => a.status === "present" || a.status === "late").length || 0;
  const lateToday = attendance?.filter((a: any) => a.status === "late").length || 0;
  const absentToday = Math.max(0, activeEmployees.length - presentToday);
  const attendanceRate = activeEmployees.length > 0 ? Math.round((presentToday / activeEmployees.length) * 100) : 0;

  const lastWeekRate = monthlySummary?.lastWeekRate ?? null;
  const rateDiff = lastWeekRate !== null ? attendanceRate - lastWeekRate : null;

  const attendedIds = new Set((attendance || []).map((a: any) => a.employeeId));
  const absentEmployees = activeEmployees.filter((e) => !attendedIds.has(e.id));
  const absentVisible = absentExpanded ? absentEmployees : absentEmployees.slice(0, ABSENT_PREVIEW);

  const todayArabic = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function exportAbsentExcel() {
    const rows = absentEmployees.map((emp) => {
      const ws = workshops?.find((w) => w.id === emp.workshopId);
      return { "الاسم": emp.name, "الكود": emp.employeeCode || "", "الورشة": ws?.name || "—" };
    });
    const wb = XLSX.utils.book_new();
    const ws2 = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws2, "غائبون");
    XLSX.writeFile(wb, `غائبون_${today}.xlsx`);
  }

  const workshopRates = (
    monthlySummary?.workshopRates
      ? monthlySummary.workshopRates.map((w) => ({ id: w.workshopId, name: w.name, total: w.total, present: w.present, rate: w.rate }))
      : (workshops || []).map((ws) => {
          const wsEmployees = activeEmployees.filter((e) => e.workshopId === ws.id);
          const wsPresent = (attendance || []).filter((a: any) => {
            const emp = activeEmployees.find((e) => e.id === a.employeeId);
            return emp?.workshopId === ws.id && (a.status === "present" || a.status === "late");
          }).length;
          const rate = wsEmployees.length > 0 ? Math.round((wsPresent / wsEmployees.length) * 100) : 0;
          return { id: ws.id, name: ws.name, total: wsEmployees.length, present: wsPresent, rate };
        })
  ).filter((ws) => ws.total > 0).sort((a, b) => b.rate - a.rate);

  const expiringContracts = activeEmployees.filter((emp) => {
    if (!emp.contractEndDate) return false;
    const endDate = new Date(emp.contractEndDate);
    const diffDays = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  });

  const expiredContracts = activeEmployees.filter((emp) => {
    if (!emp.contractEndDate) return false;
    return new Date(emp.contractEndDate) < new Date();
  });

  const statValues: Record<string, string> = {
    employees: String(activeEmployees.length),
    present: String(presentToday),
    late: String(lateToday),
    companies: `${companies?.length || 0} / ${workshops?.length || 0}`,
  };

  if (loadingEmp || loadingAtt) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-36 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4" data-testid="text-page-title">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(262 76% 15%) 0%, hsl(262 76% 24%) 55%, hsl(250 72% 31%) 100%)",
          boxShadow: "0 8px 32px hsl(262 76% 20% / 0.35), 0 2px 8px hsl(262 76% 20% / 0.20)",
        }}
      >
        <div className="absolute top-0 left-0 rounded-full pointer-events-none" style={{ width: 300, height: 300, background: "hsl(280 70% 60% / 0.10)", transform: "translate(-40%, -40%)" }} />
        <div className="absolute bottom-0 right-0 rounded-full pointer-events-none" style={{ width: 200, height: 200, background: "hsl(250 80% 50% / 0.10)", transform: "translate(35%, 35%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 60% 50%, hsl(262 90% 60% / 0.08) 0%, transparent 60%)" }} />

        <div className="relative z-10 px-5 sm:px-7 py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs mb-2 flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"
                style={{ boxShadow: "0 0 6px hsl(160 70% 55%)" }}
              />
              {todayArabic}
            </p>
            <h1 className="text-white text-xl sm:text-2xl font-bold leading-tight mb-1">
              مرحباً،{" "}
              <span style={{ color: "hsl(262 80% 82%)" }}>{user?.username || "مدير النظام"}</span>
            </h1>
            <p className="text-white/40 text-xs">نظام إدارة الحضور والانصراف</p>
          </div>

          <div className="flex items-center gap-5 sm:gap-7">
            <div>
              <p className="text-white/50 text-[11px] mb-0.5">نسبة الحضور اليوم</p>
              <p
                className="text-white leading-none tabular-nums font-black"
                style={{ fontSize: "clamp(2.5rem, 6vw, 3.75rem)" }}
              >
                {attendanceRate}<span className="text-2xl text-white/55">%</span>
              </p>
              {rateDiff !== null && (
                <div
                  className="flex items-center gap-1 mt-1"
                  style={{ color: rateDiff >= 0 ? "hsl(160 70% 65%)" : "hsl(0 70% 65%)" }}
                >
                  {rateDiff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="text-xs font-medium tabular-nums" data-testid="text-rate-diff">
                    {rateDiff >= 0 ? "+" : ""}{rateDiff}% عن الأسبوع الماضي
                  </span>
                </div>
              )}
            </div>

            <div className="w-px self-stretch bg-white/15 hidden sm:block" />

            <div className="hidden sm:flex flex-col gap-2.5">
              {[
                { label: "حاضر", value: presentToday, dot: "bg-emerald-400" },
                { label: "متأخر", value: lateToday, dot: "bg-amber-400" },
                { label: "غائب", value: absentToday, dot: "bg-red-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${item.dot}`} />
                  <span className="text-white/50 w-10">{item.label}</span>
                  <span className="text-white font-bold tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.url} href={action.url}>
            <div
              className="flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 bg-card border border-border"
              style={{ boxShadow: `0 2px 10px ${action.color}12` }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: `${action.color}18` }}
              >
                <action.icon className="h-5 w-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-semibold text-foreground">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl p-4 sm:p-5 relative overflow-hidden"
            style={{
              background: card.gradient,
              boxShadow: `0 6px 20px hsl(${card.glow} / 0.28), 0 2px 6px hsl(${card.glow} / 0.14)`,
            }}
          >
            <div
              className="absolute top-0 right-0 rounded-full pointer-events-none"
              style={{ width: 88, height: 88, background: "rgba(255,255,255,0.12)", transform: "translate(30%, -30%)" }}
            />
            <div
              className="absolute bottom-0 left-0 rounded-full pointer-events-none"
              style={{ width: 60, height: 60, background: "rgba(255,255,255,0.07)", transform: "translate(-30%, 30%)" }}
            />
            <div className="relative z-10">
              <div className="mb-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/20">
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p
                className="text-3xl sm:text-4xl font-black text-white tabular-nums leading-none mb-2"
                data-testid={card.testId}
              >
                {statValues[card.key]}
              </p>
              <p className="text-xs font-semibold text-white/80 leading-tight">{card.label}</p>
              <p className="text-[10px] text-white/50 mt-0.5">{card.sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 2-column section ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">

        {/* Left column (4/7): stats + chart + table */}
        <div className="lg:col-span-4 space-y-4">

          {/* Today's Attendance Overview */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                نظرة عامة اليوم
                <span className="text-xs font-normal text-muted-foreground mr-auto tabular-nums">
                  {attendanceRate}% نسبة الحضور
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-4">
              <div
                className="h-3 w-full rounded-full overflow-hidden"
                style={{ background: "hsl(215 15% 91%)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${attendanceRate}%`,
                    background: "linear-gradient(90deg, hsl(160 70% 38%), hsl(160 65% 52%))",
                    boxShadow: "0 0 8px hsl(160 70% 38% / 0.45)",
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "حاضر", value: presentToday, color: "hsl(160 70% 38%)", bg: "hsl(160 70% 38% / 0.08)", border: "hsl(160 70% 38% / 0.18)" },
                  { label: "متأخر", value: lateToday, color: "hsl(43 96% 42%)", bg: "hsl(43 96% 52% / 0.08)", border: "hsl(43 96% 52% / 0.18)" },
                  { label: "غائب", value: absentToday, color: "hsl(0 72% 51%)", bg: "hsl(0 72% 51% / 0.08)", border: "hsl(0 72% 51% / 0.18)" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: item.bg, border: `1px solid ${item.border}` }}
                  >
                    <p className="text-3xl font-black tabular-nums leading-none" style={{ color: item.color }}>
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workshop Attendance Rates */}
          {workshopRates.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" style={{ color: "hsl(260 70% 50%)" }} />
                  معدل الحضور لكل ورشة — اليوم
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-0.5">
                {workshopRates.map((ws, idx) => (
                  <div
                    key={ws.id}
                    className="px-2 py-2.5 rounded-lg hover:bg-accent/30 transition-colors space-y-1.5"
                    data-testid={`workshop-rate-${ws.id}`}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          background: idx === 0
                            ? "hsl(160 70% 38% / 0.15)"
                            : idx === 1
                            ? "hsl(43 96% 52% / 0.15)"
                            : idx === 2
                            ? "hsl(0 72% 51% / 0.10)"
                            : "hsl(215 15% 91%)",
                          color: idx === 0
                            ? "hsl(160 70% 38%)"
                            : idx === 1
                            ? "hsl(43 96% 42%)"
                            : idx === 2
                            ? "hsl(0 72% 51%)"
                            : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-medium text-foreground truncate flex-1">{ws.name}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {ws.present}/{ws.total} —{" "}
                        <span
                          className="font-semibold"
                          style={{
                            color: ws.rate >= 80
                              ? "hsl(160 70% 38%)"
                              : ws.rate >= 50
                              ? "hsl(43 96% 42%)"
                              : "hsl(0 72% 51%)",
                          }}
                        >
                          {ws.rate}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "hsl(215 15% 91%)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${ws.rate}%`,
                          background: ws.rate >= 80
                            ? "linear-gradient(90deg, hsl(160 70% 38%), hsl(160 65% 52%))"
                            : ws.rate >= 50
                            ? "linear-gradient(90deg, hsl(43 96% 48%), hsl(36 90% 58%))"
                            : "linear-gradient(90deg, hsl(0 72% 51%), hsl(0 68% 62%))",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Weekly Attendance Chart — AreaChart */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" style={{ color: "hsl(271 76% 45%)" }} />
                الحضور خلال 7 أيام
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {loadingWeekly ? (
                <Skeleton className="h-44 w-full" />
              ) : weeklyStats && weeklyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={weeklyStats} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor="hsl(160, 70%, 38%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(160, 70%, 38%)" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor="hsl(43, 96%, 48%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(43, 96%, 48%)" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.30} />
                        <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, fill: "hsl(var(--accent))", fillOpacity: 0.3 }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="present"
                      name="حاضر"
                      stroke="hsl(160, 70%, 38%)"
                      fill="url(#gradPresent)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      name="متأخر"
                      stroke="hsl(43, 96%, 48%)"
                      fill="url(#gradLate)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      name="غائب"
                      stroke="hsl(0, 72%, 51%)"
                      fill="url(#gradAbsent)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance Table */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(160 70% 40%)" }} />
                آخر سجلات الحضور
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              {attendance && attendance.length > 0 ? (
                <table className="w-full text-xs" data-testid="table-attendance">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-right px-5 py-2 font-medium text-muted-foreground w-8"></th>
                      <th className="text-right px-2 py-2 font-medium text-muted-foreground">الاسم</th>
                      <th className="text-right px-2 py-2 font-medium text-muted-foreground">الحضور</th>
                      <th className="text-right px-2 py-2 font-medium text-muted-foreground">الانصراف</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.slice(0, 6).map((record: any) => {
                      const emp = employees?.find((e) => e.id === record.employeeId);
                      return (
                        <tr
                          key={record.id}
                          className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                          data-testid={`attendance-row-${record.id}`}
                        >
                          <td className="px-5 py-2">
                            {emp && (
                              <div
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ background: getAvatarGradient(emp.name) }}
                              >
                                {getInitials(emp.name)}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 font-medium max-w-[100px] truncate">{emp?.name || "غير معروف"}</td>
                          <td className="px-2 py-2 tabular-nums text-muted-foreground">{record.checkIn || "—"}</td>
                          <td className="px-2 py-2 tabular-nums text-muted-foreground">{record.checkOut || "—"}</td>
                          <td className="px-3 py-2">
                            <Badge
                              className="text-[10px]"
                              variant={record.status === "present" ? "default" : record.status === "late" ? "secondary" : "destructive"}
                            >
                              {record.status === "present" ? "حاضر" : record.status === "late" ? "متأخر" : record.status === "absent" ? "غائب" : "إجازة"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد سجلات اليوم</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (3/7): lists + alerts */}
        <div className="lg:col-span-3 space-y-4">

          {/* Absent Employees Today */}
          {absentEmployees.length > 0 && (
            <Card style={{ borderColor: "hsl(0 72% 51% / 0.15)" }}>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserX className="h-4 w-4" style={{ color: "hsl(0 72% 51%)" }} />
                    غائبون اليوم
                    <Badge
                      className="text-[10px] px-1.5"
                      style={{
                        background: "hsl(0 72% 51% / 0.12)",
                        color: "hsl(0 72% 45%)",
                        border: "1px solid hsl(0 72% 51% / 0.25)",
                      }}
                      data-testid="text-absent-count"
                    >
                      {absentEmployees.length}
                    </Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={exportAbsentExcel}
                    data-testid="button-export-absent"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Excel
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-3">
                <div className="divide-y divide-border/50">
                  {absentVisible.map((emp) => {
                    const ws = workshops?.find((w) => w.id === emp.workshopId);
                    return (
                      <div
                        key={emp.id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-destructive/5 transition-colors"
                        data-testid={`absent-row-${emp.id}`}
                      >
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: getAvatarGradient(emp.name) }}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.employeeCode}</p>
                        </div>
                        {ws && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {ws.name}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
                {absentEmployees.length > ABSENT_PREVIEW && (
                  <div className="px-5 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                      onClick={() => setAbsentExpanded((v) => !v)}
                      data-testid="button-toggle-absent"
                    >
                      {absentExpanded ? (
                        <><ChevronUp className="h-3.5 w-3.5" />عرض أقل</>
                      ) : (
                        <><ChevronDown className="h-3.5 w-3.5" />عرض الكل ({absentEmployees.length - ABSENT_PREVIEW} إضافي)</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Late Employees This Month */}
          {(loadingMonthly || (monthlySummary?.topLate && monthlySummary.topLate.length > 0)) && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: "hsl(43 96% 42%)" }} />
                  أكثر الموظفين تأخراً — هذا الشهر
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {loadingMonthly ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {monthlySummary!.topLate.map((emp, idx) => (
                      <Link key={emp.employeeId} href={`/employees/${emp.employeeId}/attendance`}>
                        <div
                          className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer"
                          data-testid={`top-late-${emp.employeeId}`}
                        >
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{
                              background: idx === 0 ? "hsl(0 72% 51% / 0.15)" : idx === 1 ? "hsl(43 96% 52% / 0.15)" : "hsl(271 20% 92%)",
                              color: idx === 0 ? "hsl(0 72% 51%)" : idx === 1 ? "hsl(43 96% 42%)" : "hsl(var(--muted-foreground))",
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: getAvatarGradient(emp.name) }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <p className="text-xs font-medium flex-1 truncate">{emp.name}</p>
                          <Badge
                            className="text-[10px] shrink-0"
                            style={{
                              background: "hsl(43 96% 52% / 0.12)",
                              color: "hsl(43 96% 32%)",
                              border: "1px solid hsl(43 96% 52% / 0.25)",
                            }}
                          >
                            {emp.lateDays} يوم
                          </Badge>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract Alerts */}
          {(expiringContracts.length > 0 || expiredContracts.length > 0) && (
            <Card style={{ borderColor: "hsl(0 72% 51% / 0.20)" }}>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  تنبيهات العقود
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-2">
                {expiredContracts.map((emp) => (
                  <Link key={emp.id} href={`/employees/${emp.id}/attendance`}>
                    <div
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors"
                      data-testid={`alert-expired-${emp.id}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">عقد منتهي</Badge>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
                {expiringContracts.map((emp) => {
                  const daysLeft = Math.ceil((new Date(emp.contractEndDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <Link key={emp.id} href={`/employees/${emp.id}/attendance`}>
                      <div
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg cursor-pointer transition-colors"
                        style={{ background: "hsl(43 96% 52% / 0.06)", border: "1px solid hsl(43 96% 52% / 0.15)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(43 96% 52% / 0.12)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(43 96% 52% / 0.06)")}
                        data-testid={`alert-expiring-${emp.id}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: "hsl(43 96% 52% / 0.12)" }}>
                            <Clock className="h-3.5 w-3.5" style={{ color: "hsl(43 96% 42%)" }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{daysLeft} يوم</Badge>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Active Employees */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(271 76% 45%)" }} />
                الموظفون النشطون
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {activeEmployees.length > 0 ? (
                <div className="space-y-1.5">
                  {activeEmployees.slice(0, 6).map((emp) => (
                    <Link key={emp.id} href={`/employees/${emp.id}/attendance`}>
                      <div
                        className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer"
                        data-testid={`employee-row-${emp.id}`}
                      >
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: getAvatarGradient(emp.name) }}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.employeeCode}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {emp.shift === "morning" ? "صباحي" : "مسائي"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">لا يوجد موظفون</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
