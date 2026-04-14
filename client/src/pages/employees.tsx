import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { Plus, Search, Pencil, Users as UsersIcon, Hash, CreditCard, SlidersHorizontal, Star, UserCheck, UserX, Trash2 } from "lucide-react";
import type { Employee, Company, Workshop, Position, WorkRule } from "@shared/schema";
import { PageHeader } from "@/components/page-header";
import { RowActions } from "@/components/row-actions";
import { Pagination } from "@/components/pagination";

const EMPLOYEES_PAGE_SIZE = 20;

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

export default function Employees() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isOwner = user?.username === "owner";
  const { isFavorite, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState("");
  const [filterWorkshop, setFilterWorkshop] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  useEffect(() => { setPage(1); }, [search, filterWorkshop, filterCompany, filterActive]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [name, setName] = useState("");
  const [frenchName, setFrenchName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [positionId, setPositionId] = useState("");
  const [workRuleId, setWorkRuleId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [phone, setPhone] = useState("");
  const [shift, setShift] = useState("morning");
  const [contractEndDate, setContractEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hourlyRate, setHourlyRate] = useState("0");

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

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/employees/${id}`, { isActive }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: vars.isActive ? "تم تفعيل الموظف" : "تم تعطيل الموظف" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
      toast({ title: "تم حذف الموظف بنجاح" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function resetForm() {
    setName(""); setFrenchName(""); setEmployeeCode(""); setCardNumber(""); setPositionId(""); setWorkRuleId("");
    setCompanyId(""); setWorkshopId(""); setPhone("");
    setShift("morning"); setContractEndDate(""); setIsActive(true); setHourlyRate("0");
    setEditingEmployee(null);
  }

  function openEdit(emp: Employee) {
    setEditingEmployee(emp);
    setName(emp.name);
    setFrenchName(emp.frenchName || "");
    setEmployeeCode(emp.employeeCode);
    setCardNumber(emp.cardNumber || "");
    setPositionId(emp.positionId || "");
    setWorkRuleId(emp.workRuleId || "");
    setCompanyId(emp.companyId || "");
    setWorkshopId(emp.workshopId || "");
    setPhone(emp.phone || "");
    setShift(emp.shift || "morning");
    setContractEndDate(emp.contractEndDate || "");
    setIsActive(emp.isActive);
    setHourlyRate(emp.hourlyRate || "0");
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name, frenchName: frenchName || null, employeeCode,
      cardNumber: cardNumber || null,
      positionId: positionId || null,
      workRuleId: workRuleId || null,
      companyId: companyId || null,
      workshopId: workshopId || null,
      phone: phone || null,
      shift,
      contractEndDate: contractEndDate || null,
      isActive,
      hourlyRate: hourlyRate || "0",
    };
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const filtered = (employees || [])
    .filter((e) => {
      const matchSearch = e.name.includes(search) || e.employeeCode.includes(search) || (e.cardNumber || "").includes(search) || (e.frenchName || "").toLowerCase().includes(search.toLowerCase());
      const matchWorkshop = filterWorkshop === "all" || e.workshopId === filterWorkshop;
      const matchCompany = filterCompany === "all" || e.companyId === filterCompany;
      const matchActive = filterActive === "all" || (filterActive === "active" ? e.isActive : !e.isActive);
      return matchSearch && matchWorkshop && matchCompany && matchActive;
    })
    .sort((a, b) => {
      const na = parseInt(a.employeeCode) || 0;
      const nb = parseInt(b.employeeCode) || 0;
      return na !== nb ? na - nb : a.employeeCode.localeCompare(b.employeeCode);
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / EMPLOYEES_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedEmployees = filtered.slice((safePage - 1) * EMPLOYEES_PAGE_SIZE, safePage * EMPLOYEES_PAGE_SIZE);

  const activeCount = employees?.filter((e) => e.isActive).length || 0;
  const inactiveCount = (employees?.length || 0) - activeCount;

  return (
    <div>
      <PageHeader
        title="الموظفين"
        subtitle={`${employees?.length || 0} موظف إجمالاً · ${activeCount} نشط · ${inactiveCount} غير نشط`}
        count={employees?.length}
        action={
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
                    <Label>الاسم بالعربية *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-employee-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم بالفرنسية</Label>
                    <Input value={frenchName} onChange={(e) => setFrenchName(e.target.value)} placeholder="Nom en français" dir="ltr" data-testid="input-french-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الموظف *</Label>
                    <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} required data-testid="input-employee-code" />
                  </div>
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>سعر الساعة (د.ج)</Label>
                    <Input type="number" min="0" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} data-testid="input-hourly-rate" placeholder="0.00" />
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
        }
      />

      <div className="p-6 space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الموظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
            data-testid="input-search-employee"
          />
        </div>
        <Select value={filterWorkshop} onValueChange={setFilterWorkshop}>
          <SelectTrigger className="w-44" data-testid="select-filter-workshop">
            <SlidersHorizontal className="h-4 w-4 ml-2 text-muted-foreground" />
            <SelectValue placeholder="كل الورش" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الورش</SelectItem>
            {workshops?.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-44" data-testid="select-filter-company">
            <SelectValue placeholder="كل الشركات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الشركات</SelectItem>
            {companies?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-36" data-testid="select-filter-active">
            <SelectValue placeholder="الكل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشط فقط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground" data-testid="text-employees-count">
          يُعرض {filtered.length} من أصل {employees?.length || 0} موظف
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا يوجد موظفون مطابقون للبحث</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-2">
          {paginatedEmployees.map((emp) => {
            const company = companies?.find((c) => c.id === emp.companyId);
            const workshop = workshops?.find((w) => w.id === emp.workshopId);
            const position = positions?.find((p) => p.id === emp.positionId);
            return (
              <Card key={emp.id} data-testid={`card-employee-${emp.id}`} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: getAvatarGradient(emp.name), boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
                      >
                        {getInitials(emp.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm" data-testid={`text-name-${emp.id}`}>{emp.name}</p>
                          {emp.frenchName && (
                            <span className="text-xs text-muted-foreground" dir="ltr" data-testid={`text-french-name-${emp.id}`}>{emp.frenchName}</span>
                          )}
                          {emp.isActive
                            ? <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0" data-testid={`badge-status-${emp.id}`}>نشط</Badge>
                            : <Badge variant="secondary" className="text-xs text-muted-foreground" data-testid={`badge-status-${emp.id}`}>غير نشط</Badge>
                          }
                        </div>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-code-${emp.id}`}>
                            <Hash className="h-3 w-3" />{emp.employeeCode}
                          </span>
                          {emp.cardNumber && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-card-${emp.id}`}>
                              <CreditCard className="h-3 w-3" />{emp.cardNumber}
                            </span>
                          )}
                          {workshop && <span className="text-xs text-muted-foreground">{workshop.name}</span>}
                          {company && <span className="text-xs text-muted-foreground">{company.name}</span>}
                          {position && <span className="text-xs text-muted-foreground">{position.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={emp.shift === "morning" ? "default" : "secondary"} className="text-xs hidden sm:flex">
                        {emp.shift === "morning" ? "صباحي" : "مسائي"}
                      </Badge>
                      {emp.contractEndDate && (
                        <span className="text-xs text-muted-foreground hidden md:block">{emp.contractEndDate}</span>
                      )}
                      <RowActions
                        testId={`button-actions-${emp.id}`}
                        actions={[
                          {
                            label: "تعديل",
                            icon: <Pencil className="h-3.5 w-3.5" />,
                            onClick: () => openEdit(emp),
                          },
                          {
                            label: emp.isActive ? "تعطيل" : "تفعيل",
                            icon: emp.isActive
                              ? <UserX className="h-3.5 w-3.5" />
                              : <UserCheck className="h-3.5 w-3.5" />,
                            onClick: () => toggleActiveMutation.mutate({ id: emp.id, isActive: !emp.isActive }),
                          },
                          ...(isOwner ? [{
                            label: isFavorite(emp.id) ? "إزالة من المفضلة" : "إضافة للمفضلة",
                            icon: <Star className="h-3.5 w-3.5" />,
                            onClick: () => toggleFavorite(emp.id),
                          }] : []),
                          {
                            label: "حذف",
                            icon: <Trash2 className="h-3.5 w-3.5" />,
                            onClick: () => deleteMutation.mutate(emp.id),
                            destructive: true,
                            confirmTitle: "حذف الموظف",
                            confirmDescription: `سيتم حذف "${emp.name}" وجميع سجلات حضوره نهائياً. لا يمكن التراجع عن هذا الإجراء.`,
                          },
                        ]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length > EMPLOYEES_PAGE_SIZE && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filtered.length}
          pageSize={EMPLOYEES_PAGE_SIZE}
          itemLabel="موظف"
        />
      )}
      </div>
    </div>
  );
}
