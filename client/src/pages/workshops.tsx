import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, ArrowLeftRight, UserMinus, UserPlus, Wrench, X } from "lucide-react";
import type { Workshop, Employee } from "@shared/schema";

export default function Workshops() {
  const { toast } = useToast();

  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [searchInWorkshop, setSearchInWorkshop] = useState("");
  const [searchImport, setSearchImport] = useState("");
  const [transferTarget, setTransferTarget] = useState<string>("");
  const [transferEmpId, setTransferEmpId] = useState<string | null>(null);

  const { data: workshops = [], isLoading: workshopsLoading } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: employees = [], isLoading: empsLoading } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  const isLoading = workshopsLoading || empsLoading;

  const activeEmployees = employees.filter((e) => e.isActive !== false);

  const employeesInWorkshop = useMemo(() => {
    if (!selectedWorkshop) return [];
    return activeEmployees.filter((e) => e.workshopId === selectedWorkshop.id);
  }, [activeEmployees, selectedWorkshop]);

  const employeesNotInWorkshop = useMemo(() => {
    if (!selectedWorkshop) return [];
    return activeEmployees.filter((e) => e.workshopId !== selectedWorkshop.id);
  }, [activeEmployees, selectedWorkshop]);

  const filteredInWorkshop = useMemo(() => {
    const q = searchInWorkshop.trim().toLowerCase();
    if (!q) return employeesInWorkshop;
    return employeesInWorkshop.filter(
      (e) => e.name.toLowerCase().includes(q) || e.employeeCode.includes(q)
    );
  }, [employeesInWorkshop, searchInWorkshop]);

  const filteredImport = useMemo(() => {
    const q = searchImport.trim().toLowerCase();
    if (!q) return employeesNotInWorkshop;
    return employeesNotInWorkshop.filter(
      (e) => e.name.toLowerCase().includes(q) || e.employeeCode.includes(q)
    );
  }, [employeesNotInWorkshop, searchImport]);

  const updateEmpMutation = useMutation({
    mutationFn: ({ id, workshopId }: { id: string; workshopId: string | null }) =>
      apiRequest("PATCH", `/api/employees/${id}`, { workshopId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function removeFromWorkshop(emp: Employee) {
    updateEmpMutation.mutate(
      { id: emp.id, workshopId: null },
      { onSuccess: () => toast({ title: `تم إزالة ${emp.name} من الورشة` }) }
    );
  }

  function transferEmployee(emp: Employee, targetWorkshopId: string) {
    const targetName = workshops.find((w) => w.id === targetWorkshopId)?.name || "";
    updateEmpMutation.mutate(
      { id: emp.id, workshopId: targetWorkshopId },
      {
        onSuccess: () => {
          toast({ title: `تم نقل ${emp.name} إلى ${targetName}` });
          setTransferEmpId(null);
          setTransferTarget("");
        },
      }
    );
  }

  function importEmployee(emp: Employee) {
    updateEmpMutation.mutate(
      { id: emp.id, workshopId: selectedWorkshop!.id },
      { onSuccess: () => toast({ title: `تم إضافة ${emp.name} للورشة` }) }
    );
  }

  function getWorkshopCount(workshopId: string) {
    return activeEmployees.filter((e) => e.workshopId === workshopId).length;
  }

  function getEmployeeWorkshopName(emp: Employee) {
    if (!emp.workshopId) return "بدون ورشة";
    return workshops.find((w) => w.id === emp.workshopId)?.name || "بدون ورشة";
  }

  const otherWorkshops = workshops.filter((w) => w.id !== selectedWorkshop?.id);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">الورشات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة الورشات وموظفيها</p>
        </div>
        <Badge variant="secondary" className="gap-1 text-sm px-3 py-1">
          <Wrench className="h-3.5 w-3.5" />
          {workshops.length} ورشة
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workshops.map((w) => {
            const count = getWorkshopCount(w.id);
            return (
              <Card
                key={w.id}
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                data-testid={`card-workshop-${w.id}`}
                onClick={() => { setSelectedWorkshop(w); setSearchInWorkshop(""); }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Wrench className="h-4 w-4 text-primary" />
                    </div>
                    {w.name}
                  </CardTitle>
                  {w.description && (
                    <p className="text-xs text-muted-foreground">{w.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span data-testid={`text-count-${w.id}`}>{count} موظف</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ====== ديالوج تفاصيل الورشة ====== */}
      <Dialog open={!!selectedWorkshop} onOpenChange={(v) => { if (!v) { setSelectedWorkshop(null); setTransferEmpId(null); setTransferTarget(""); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              {selectedWorkshop?.name}
              <Badge variant="secondary" className="mr-auto gap-1">
                <Users className="h-3 w-3" />
                {employeesInWorkshop.length} موظف
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم أو رقم الموظف..."
                className="pr-9"
                value={searchInWorkshop}
                onChange={(e) => setSearchInWorkshop(e.target.value)}
                data-testid="input-search-workshop-employees"
              />
            </div>
            <Button
              size="sm"
              className="gap-1 shrink-0"
              onClick={() => { setImportOpen(true); setSearchImport(""); }}
              data-testid="button-import-employees"
            >
              <UserPlus className="h-4 w-4" />
              إضافة موظفين
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md divide-y">
            {filteredInWorkshop.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">لا يوجد موظفون في هذه الورشة</p>
              </div>
            ) : (
              filteredInWorkshop.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
                  data-testid={`row-workshop-emp-${emp.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-10 shrink-0">{emp.employeeCode}</span>
                    <span className="text-sm font-medium truncate">{emp.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* زر النقل لورشة أخرى */}
                    {transferEmpId === emp.id ? (
                      <div className="flex items-center gap-1">
                        <Select value={transferTarget} onValueChange={setTransferTarget}>
                          <SelectTrigger className="h-7 w-36 text-xs" data-testid={`select-transfer-${emp.id}`}>
                            <SelectValue placeholder="اختر الورشة" />
                          </SelectTrigger>
                          <SelectContent>
                            {otherWorkshops.map((w) => (
                              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2"
                          disabled={!transferTarget || updateEmpMutation.isPending}
                          onClick={() => transferEmployee(emp, transferTarget)}
                          data-testid={`button-confirm-transfer-${emp.id}`}
                        >
                          نقل
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => { setTransferEmpId(null); setTransferTarget(""); }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => { setTransferEmpId(emp.id); setTransferTarget(""); }}
                          data-testid={`button-transfer-${emp.id}`}
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          نقل
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                              data-testid={`button-remove-${emp.id}`}
                            >
                              <UserMinus className="h-3 w-3" />
                              إزالة
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>إزالة من الورشة؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم إزالة <strong>{emp.name}</strong> من ورشة {selectedWorkshop?.name}. لن يتم حذف الموظف من النظام.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => removeFromWorkshop(emp)}
                              >
                                إزالة
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== ديالوج إضافة موظفين ====== */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              إضافة موظفين إلى {selectedWorkshop?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم أو رقم الموظف أو الورشة..."
              className="pr-9"
              value={searchImport}
              onChange={(e) => setSearchImport(e.target.value)}
              data-testid="input-search-import"
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md divide-y">
            {filteredImport.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">لا يوجد موظفون خارج هذه الورشة</p>
              </div>
            ) : (
              filteredImport.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
                  data-testid={`row-import-emp-${emp.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-10 shrink-0">{emp.employeeCode}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{getEmployeeWorkshopName(emp)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 shrink-0"
                    disabled={updateEmpMutation.isPending}
                    onClick={() => importEmployee(emp)}
                    data-testid={`button-import-emp-${emp.id}`}
                  >
                    <UserPlus className="h-3 w-3" />
                    إضافة
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
