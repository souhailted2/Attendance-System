import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Users as UsersIcon, RefreshCw, Download, Hash, CreditCard } from "lucide-react";
import type { Employee, Company, Workshop, Position, WorkRule } from "@shared/schema";

export default function Employees() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [positionId, setPositionId] = useState("");
  const [workRuleId, setWorkRuleId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [phone, setPhone] = useState("");
  const [wage, setWage] = useState("");
  const [shift, setShift] = useState("morning");
  const [contractEndDate, setContractEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: employees, isLoading } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: companies } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: positions } = useQuery<Position[]>({ queryKey: ["/api/positions"] });
  const { data: workRules } = useQuery<WorkRule[]>({ queryKey: ["/api/work-rules"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "تم إضافة الموظف بنجاح" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const zkImportMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sync/from-zk-mysql"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "اكتمل الاستيراد",
        description: `${data.employees.created} موظف جديد، ${data.attendance.created} سجل حضور`,
      });
    },
    onError: (err: Error) => toast({ title: "فشل الاستيراد", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "تم تحديث بيانات الموظف" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function resetForm() {
    setName(""); setEmployeeCode(""); setCardNumber(""); setPositionId(""); setWorkRuleId("");
    setCompanyId(""); setWorkshopId(""); setPhone(""); setWage("");
    setShift("morning"); setContractEndDate(""); setIsActive(true);
    setEditingEmployee(null);
  }

  function openEdit(emp: Employee) {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmployeeCode(emp.employeeCode);
    setCardNumber(emp.cardNumber || "");
    setPositionId(emp.positionId || "");
    setWorkRuleId(emp.workRuleId || "");
    setCompanyId(emp.companyId || "");
    setWorkshopId(emp.workshopId || "");
    setPhone(emp.phone || "");
    setWage(emp.wage || "");
    setShift(emp.shift || "morning");
    setContractEndDate(emp.contractEndDate || "");
    setIsActive(emp.isActive);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name, employeeCode,
      cardNumber: cardNumber || null,
      positionId: positionId || null,
      workRuleId: workRuleId || null,
      companyId: companyId || null,
      workshopId: workshopId || null,
      phone: phone || null,
      wage: wage || "0",
      shift,
      contractEndDate: contractEndDate || null,
      isActive,
    };
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const filtered = employees?.filter((e) =>
    e.name.includes(search) || e.employeeCode.includes(search) || (e.cardNumber || "").includes(search)
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">الموظفين</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => zkImportMutation.mutate()}
            disabled={zkImportMutation.isPending}
            data-testid="button-import-from-zk"
            title="استيراد الموظفين وسجلات الحضور من بيانات ZKTeco المحفوظة"
          >
            {zkImportMutation.isPending
              ? <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              : <Download className="h-4 w-4 ml-2" />}
            {zkImportMutation.isPending ? "جارٍ الاستيراد..." : "استيراد من ZKTeco"}
          </Button>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-employee">
              <Plus className="h-4 w-4 ml-2" />
              إضافة موظف
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "تعديل الموظف" : "إضافة موظف جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-employee-name" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الموظف *</Label>
                  <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} required data-testid="input-employee-code" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>رقم البطاقة</Label>
                  <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="رقم البطاقة من جهاز البصمة (اختياري)" data-testid="input-card-number" />
                </div>
                <div className="space-y-2">
                  <Label>الشركة</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger data-testid="select-company"><SelectValue placeholder="اختر الشركة" /></SelectTrigger>
                    <SelectContent>
                      {companies?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الورشة</Label>
                  <Select value={workshopId} onValueChange={setWorkshopId}>
                    <SelectTrigger data-testid="select-workshop"><SelectValue placeholder="اختر الورشة" /></SelectTrigger>
                    <SelectContent>
                      {workshops?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المنصب</Label>
                  <Select value={positionId} onValueChange={setPositionId}>
                    <SelectTrigger data-testid="select-position"><SelectValue placeholder="اختر المنصب" /></SelectTrigger>
                    <SelectContent>
                      {positions?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>قواعد العمل</Label>
                  <Select value={workRuleId} onValueChange={setWorkRuleId}>
                    <SelectTrigger data-testid="select-workrule"><SelectValue placeholder="اختر قاعدة العمل" /></SelectTrigger>
                    <SelectContent>
                      {workRules?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-phone" />
                </div>
                <div className="space-y-2">
                  <Label>الراتب</Label>
                  <Input value={wage} onChange={(e) => setWage(e.target.value)} type="number" data-testid="input-wage" />
                </div>
                <div className="space-y-2">
                  <Label>الوردية</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger data-testid="select-shift"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">صباحي</SelectItem>
                      <SelectItem value="evening">مسائي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ انتهاء العقد</Label>
                  <Input type="date" value={contractEndDate} onChange={(e) => setContractEndDate(e.target.value)} data-testid="input-contract-end" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-active" />
                <Label>نشط</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => { setOpen(false); resetForm(); }}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-employee">
                  {editingEmployee ? "تحديث" : "إضافة"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو رقم الموظف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
          data-testid="input-search-employee"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا يوجد موظفون</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((emp) => {
            const company = companies?.find((c) => c.id === emp.companyId);
            const workshop = workshops?.find((w) => w.id === emp.workshopId);
            const position = positions?.find((p) => p.id === emp.positionId);
            return (
              <Card key={emp.id} data-testid={`card-employee-${emp.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{emp.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`text-name-${emp.id}`}>{emp.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-code-${emp.id}`}>
                            <Hash className="h-3 w-3" />
                            {emp.employeeCode}
                          </span>
                          {emp.cardNumber && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-card-${emp.id}`}>
                              <CreditCard className="h-3 w-3" />
                              {emp.cardNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {company && <Badge variant="secondary" className="text-xs">{company.name}</Badge>}
                          {workshop && <Badge variant="secondary" className="text-xs">{workshop.name}</Badge>}
                          {position && <Badge variant="secondary" className="text-xs">{position.name}</Badge>}
                          <Badge variant={emp.shift === "morning" ? "default" : "secondary"} className="text-xs">
                            {emp.shift === "morning" ? "صباحي" : "مسائي"}
                          </Badge>
                          {!emp.isActive && <Badge variant="destructive" className="text-xs">غير نشط</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-left">
                        <p className="text-sm font-semibold">{emp.wage || "0"} ر.س</p>
                        {emp.contractEndDate && (
                          <p className="text-xs text-muted-foreground">{emp.contractEndDate}</p>
                        )}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(emp)} data-testid={`button-edit-${emp.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
