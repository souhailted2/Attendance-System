import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ClipboardCheck, AlertTriangle, Clock, Building2, Wrench } from "lucide-react";
import type { Employee, Company, Workshop } from "@shared/schema";

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
  // الحاضرون = من لديهم سجل بحالة حاضر أو متأخر (الغائب لا يملك سجلاً)
  const presentToday = attendance?.filter((a: any) => a.status === "present" || a.status === "late").length || 0;
  const absentToday  = Math.max(0, activeEmployees.length - presentToday);

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

  const lateToday = attendance?.filter((a: any) => a.status === "late").length || 0;

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
      <h1 className="text-2xl font-bold" data-testid="text-page-title">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-3xl font-bold mt-1" data-testid="text-total-employees">
                  {activeEmployees.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">الحضور اليوم</p>
                <p className="text-3xl font-bold mt-1" data-testid="text-present-today">
                  {presentToday}
                </p>
              </div>
              <div className="h-12 w-12 rounded-md bg-chart-2/10 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">متأخرون اليوم</p>
                <p className="text-3xl font-bold mt-1" data-testid="text-late-today">
                  {lateToday}
                </p>
              </div>
              <div className="h-12 w-12 rounded-md bg-chart-5/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-chart-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">الشركات / الورش</p>
                <p className="text-3xl font-bold mt-1" data-testid="text-companies-count">
                  {companies?.length || 0} / {workshops?.length || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-md bg-chart-3/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(expiringContracts.length > 0 || expiredContracts.length > 0) && (
        <Card>
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
                  className="flex items-center justify-between gap-2 p-3 rounded-md bg-destructive/5"
                  data-testid={`alert-expired-${emp.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.employeeCode}
                      </p>
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
                    className="flex items-center justify-between gap-2 p-3 rounded-md bg-chart-5/5"
                    data-testid={`alert-expiring-${emp.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-chart-5/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-chart-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      ينتهي خلال {daysLeft} يوم
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أحدث سجلات الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            {attendance && attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.slice(0, 5).map((record: any) => {
                  const emp = employees?.find((e) => e.id === record.employeeId);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-md bg-accent/30"
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
          <CardHeader>
            <CardTitle className="text-lg">الموظفون النشطون</CardTitle>
          </CardHeader>
          <CardContent>
            {activeEmployees.length > 0 ? (
              <div className="space-y-2">
                {activeEmployees.slice(0, 5).map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-md bg-accent/30"
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
