import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, ClipboardCheck, AlertTriangle, Clock, Building2, TrendingUp, TrendingDown, Minus, UserCheck, UserX, CalendarClock, BarChart3 } from "lucide-react";
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
    accentColor: "hsl(271 76% 45%)",
    iconBg: "linear-gradient(135deg, hsl(271 76% 45%), hsl(280 65% 55%))",
    trend: "neutral",
  },
  {
    key: "present",
    label: "حضور اليوم",
    sublabel: "سجل حضور",
    icon: UserCheck,
    accentColor: "hsl(160 70% 38%)",
    iconBg: "linear-gradient(135deg, hsl(160 70% 38%), hsl(155 65% 48%))",
    trend: "up",
  },
  {
    key: "late",
    label: "متأخرون",
    sublabel: "تأخر عن الدوام",
    icon: Clock,
    accentColor: "hsl(43 96% 42%)",
    iconBg: "linear-gradient(135deg, hsl(43 96% 48%), hsl(36 90% 55%))",
    trend: "down",
  },
  {
    key: "companies",
    label: "الشركات / الورش",
    sublabel: "وحدة تنظيمية",
    icon: Building2,
    accentColor: "hsl(260 70% 50%)",
    iconBg: "linear-gradient(135deg, hsl(260 70% 50%), hsl(271 70% 60%))",
    trend: "neutral",
  },
];

const quickActions = [
  { label: "سجل الحضور", url: "/attendance", icon: ClipboardCheck, color: "hsl(160 70% 38%)" },
  { label: "الموظفين", url: "/employees", icon: Users, color: "hsl(271 76% 45%)" },
  { label: "التقارير", url: "/reports", icon: BarChart3, color: "hsl(43 96% 42%)" },
  { label: "الفترات", url: "/shifts", icon: CalendarClock, color: "hsl(220 80% 50%)" },
];

export default function Dashboard() {
  const { data: employees, isLoading: loadingEmp } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: companies } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const today = new Date().toISOString().split("T")[0];
  const { data: attendance, isLoading: loadingAtt } = useQuery<any[]>({
    queryKey: ["/api/attendance", `?date=${today}`],
  });

  const activeEmployees = employees?.filter((e) => e.isActive) || [];
  const presentToday = attendance?.filter((a: any) => a.status === "present" || a.status === "late").length || 0;
  const lateToday = attendance?.filter((a: any) => a.status === "late").length || 0;
  const absentToday = Math.max(0, activeEmployees.length - presentToday);
  const attendanceRate = activeEmployees.length > 0 ? Math.round((presentToday / activeEmployees.length) * 100) : 0;

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
      <div className="p-6 space-y-5">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5" data-testid="text-page-title">

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <Link key={action.url} href={action.url}>
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 hover:shadow-sm active:scale-95"
              style={{
                background: "white",
                border: `1px solid ${action.color}22`,
                boxShadow: `0 1px 3px ${action.color}10`,
              }}
            >
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${action.color}15` }}
              >
                <action.icon className="h-3.5 w-3.5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl p-4 bg-white relative overflow-hidden transition-all duration-200"
            style={{
              border: `1px solid ${card.accentColor}18`,
              boxShadow: `0 1px 4px ${card.accentColor}08`,
            }}
          >
            <div
              className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-5"
              style={{ background: card.accentColor, transform: "translate(20%, -20%)" }}
            />
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: card.iconBg, boxShadow: `0 2px 8px ${card.accentColor}30` }}
              >
                <card.icon className="h-4 w-4 text-white" />
              </div>
              <div className="shrink-0">
                {card.trend === "up" && <TrendingUp className="h-3.5 w-3.5" style={{ color: "hsl(160 70% 38%)" }} />}
                {card.trend === "down" && <TrendingDown className="h-3.5 w-3.5" style={{ color: "hsl(43 96% 42%)" }} />}
                {card.trend === "neutral" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </div>
            <p
              className="text-3xl font-bold tabular-nums leading-none mb-1"
              style={{ color: card.accentColor }}
              data-testid={`text-${card.key === "employees" ? "total-employees" : card.key === "present" ? "present-today" : card.key === "late" ? "late-today" : "companies-count"}`}
            >
              {statValues[card.key]}
            </p>
            <p className="text-xs font-medium text-muted-foreground leading-tight">{card.label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{card.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Today's Attendance Overview */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              نظرة عامة اليوم
            </span>
            <span className="text-xs font-normal text-muted-foreground tabular-nums">{attendanceRate}% نسبة الحضور</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4 space-y-3">
          <div
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ background: "hsl(271 20% 92%)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${attendanceRate}%`,
                background: "linear-gradient(90deg, hsl(160 70% 38%), hsl(160 65% 48%))",
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "حاضر", value: presentToday, color: "hsl(160 70% 38%)", bg: "hsl(160 70% 38% / 0.08)" },
              { label: "متأخر", value: lateToday, color: "hsl(43 96% 42%)", bg: "hsl(43 96% 52% / 0.08)" },
              { label: "غائب", value: absentToday, color: "hsl(0 72% 51%)", bg: "hsl(0 72% 51% / 0.08)" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg px-3 py-2 text-center"
                style={{ background: item.bg }}
              >
                <p className="text-xl font-bold tabular-nums leading-none" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
              <div key={emp.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10" data-testid={`alert-expired-${emp.id}`}>
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">عقد منتهي</Badge>
              </div>
            ))}
            {expiringContracts.map((emp) => {
              const daysLeft = Math.ceil((new Date(emp.contractEndDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={emp.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: "hsl(43 96% 52% / 0.06)", border: "1px solid hsl(43 96% 52% / 0.15)" }} data-testid={`alert-expiring-${emp.id}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: "hsl(43 96% 52% / 0.12)" }}>
                      <Clock className="h-3.5 w-3.5" style={{ color: "hsl(43 96% 42%)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{daysLeft} يوم</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Bottom 2-col: Recent Attendance + Active Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(160 70% 40%)" }} />
              آخر سجلات الحضور
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {attendance && attendance.length > 0 ? (
              <div className="space-y-1.5">
                {attendance.slice(0, 6).map((record: any) => {
                  const emp = employees?.find((e) => e.id === record.employeeId);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-accent/40 transition-colors"
                      data-testid={`attendance-row-${record.id}`}
                    >
                      {emp && (
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: getAvatarGradient(emp.name) }}
                        >
                          {getInitials(emp.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{emp?.name || "غير معروف"}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {record.checkIn || "--:--"} ← {record.checkOut || "--:--"}
                        </p>
                      </div>
                      <Badge
                        className="text-[10px] shrink-0"
                        variant={record.status === "present" ? "default" : record.status === "late" ? "secondary" : "destructive"}
                      >
                        {record.status === "present" ? "حاضر" : record.status === "late" ? "متأخر" : record.status === "absent" ? "غائب" : "إجازة"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد سجلات اليوم</p>
            )}
          </CardContent>
        </Card>

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
                  <div
                    key={emp.id}
                    className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-accent/40 transition-colors"
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
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">لا يوجد موظفون</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
