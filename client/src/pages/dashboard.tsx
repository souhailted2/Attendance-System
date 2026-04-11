import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ClipboardCheck, AlertTriangle, Clock, Building2 } from "lucide-react";
import type { Employee, Company, Workshop } from "@shared/schema";

const statCards = [
  {
    key: "employees",
    label: "إجمالي الموظفين",
    icon: Users,
    color: "purple",
    gradient: "linear-gradient(135deg, hsl(271 76% 45% / 0.12), hsl(271 76% 45% / 0.05))",
    iconBg: "linear-gradient(135deg, hsl(271 76% 45%), hsl(271 60% 55%))",
    iconShadow: "0 4px 14px hsl(271 76% 45% / 0.35)",
    border: "hsl(271 76% 45% / 0.18)",
  },
  {
    key: "present",
    label: "الحضور اليوم",
    icon: ClipboardCheck,
    color: "emerald",
    gradient: "linear-gradient(135deg, hsl(160 70% 40% / 0.12), hsl(160 70% 40% / 0.05))",
    iconBg: "linear-gradient(135deg, hsl(160 70% 38%), hsl(160 60% 48%))",
    iconShadow: "0 4px 14px hsl(160 70% 38% / 0.35)",
    border: "hsl(160 70% 38% / 0.18)",
  },
  {
    key: "late",
    label: "متأخرون اليوم",
    icon: Clock,
    color: "gold",
    gradient: "linear-gradient(135deg, hsl(43 96% 52% / 0.12), hsl(43 96% 52% / 0.05))",
    iconBg: "linear-gradient(135deg, hsl(43 96% 48%), hsl(36 90% 56%))",
    iconShadow: "0 4px 14px hsl(43 96% 48% / 0.40)",
    border: "hsl(43 96% 48% / 0.20)",
  },
  {
    key: "companies",
    label: "الشركات / الورش",
    icon: Building2,
    color: "violet",
    gradient: "linear-gradient(135deg, hsl(260 70% 55% / 0.12), hsl(260 70% 55% / 0.05))",
    iconBg: "linear-gradient(135deg, hsl(260 70% 50%), hsl(271 70% 60%))",
    iconShadow: "0 4px 14px hsl(260 70% 50% / 0.35)",
    border: "hsl(260 70% 50% / 0.18)",
  },
];

export default function Dashboard() {
  const { data: employees, isLoading: loadingEmp } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: workshops } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

  const today = new Date().toISOString().split("T")[0];
  const { data: attendance, isLoading: loadingAtt } = useQuery<any[]>({
    queryKey: ["/api/attendance", `?date=${today}`],
  });

  const activeEmployees = employees?.filter((e) => e.isActive) || [];
  const presentToday = attendance?.filter((a: any) => a.status === "present" || a.status === "late").length || 0;
  const absentToday  = Math.max(0, activeEmployees.length - presentToday);
  const lateToday = attendance?.filter((a: any) => a.status === "late").length || 0;

  const expiringContracts = activeEmployees.filter((emp) => {
    if (!emp.contractEndDate) return false;
    const endDate = new Date(emp.contractEndDate);
    const now = new Date();
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">لوحة التحكم</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="h-1 w-8 rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(271 76% 45%), hsl(43 96% 52%))" }}
        />
        <h1 className="text-2xl font-bold" data-testid="text-page-title">لوحة التحكم</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl p-5 transition-all duration-200 hover:shadow-md"
            style={{
              background: card.gradient,
              border: `1px solid ${card.border}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                <p
                  className="text-3xl font-bold"
                  data-testid={`text-${card.key === "employees" ? "total-employees" : card.key === "present" ? "present-today" : card.key === "late" ? "late-today" : "companies-count"}`}
                >
                  {statValues[card.key]}
                </p>
              </div>
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: card.iconBg,
                  boxShadow: card.iconShadow,
                }}
              >
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {(expiringContracts.length > 0 || expiredContracts.length > 0) && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              تنبيهات العقود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredContracts.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                  data-testid={`alert-expired-${emp.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                    </div>
                  </div>
                  <Badge variant="destructive">عقد منتهي - {emp.contractEndDate}</Badge>
                </div>
              ))}
              {expiringContracts.map((emp) => {
                const daysLeft = Math.ceil(
                  (new Date(emp.contractEndDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg"
                    style={{
                      background: "hsl(43 96% 52% / 0.06)",
                      border: "1px solid hsl(43 96% 52% / 0.15)",
                    }}
                    data-testid={`alert-expiring-${emp.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{ background: "hsl(43 96% 52% / 0.12)" }}
                      >
                        <Clock className="h-4 w-4" style={{ color: "hsl(43 96% 42%)" }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">ينتهي خلال {daysLeft} يوم</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: "hsl(160 70% 40%)" }}
              />
              أحدث سجلات الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance && attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.slice(0, 5).map((record: any) => {
                  const emp = employees?.find((e) => e.id === record.employeeId);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                      data-testid={`attendance-row-${record.id}`}
                    >
                      <div>
                        <p className="text-sm font-medium">{emp?.name || "غير معروف"}</p>
                        <p className="text-xs text-muted-foreground">
                          حضور: {record.checkIn || "-"} | انصراف: {record.checkOut || "-"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          record.status === "present"
                            ? "default"
                            : record.status === "late"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {record.status === "present"
                          ? "حاضر"
                          : record.status === "late"
                            ? "متأخر"
                            : record.status === "absent"
                              ? "غائب"
                              : "إجازة"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                لا توجد سجلات حضور لليوم
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: "hsl(271 76% 45%)" }}
              />
              الموظفون النشطون
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeEmployees.length > 0 ? (
              <div className="space-y-2">
                {activeEmployees.slice(0, 5).map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                    data-testid={`employee-row-${emp.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                    </div>
                    <Badge variant="secondary">
                      {emp.shift === "morning" ? "صباحي" : "مسائي"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                لا يوجد موظفون
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
