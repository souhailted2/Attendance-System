import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Users, Search, ArrowLeftRight, UserMinus, UserPlus, Wrench, X, Plus, Pencil, Trash2, Key, Shield, UserCog } from "lucide-react";
import type { Workshop, Employee } from "@shared/schema";
import { PageHeader } from "@/components/page-header";

interface Account {
  id: string;
  username: string;
  role: string;
  allowedShifts: string | null;
  allowedWorkshopIds: string | null;
}

const SHIFT_OPTIONS = [
  { value: "morning", label: "صباحي" },
  { value: "evening", label: "مسائي" },
];

function parseIds(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

function getShiftLabel(shifts: string | null): string {
  if (!shifts) return "كل الفترات";
  try {
    const arr: string[] = JSON.parse(shifts);
    if (arr.length === 0) return "كل الفترات";
    return arr.map(s => s === "morning" ? "صباحي" : s === "evening" ? "مسائي" : s).join(" + ");
  } catch { return shifts; }
}

function getWorkshopNames(ids: string | null, workshops: Workshop[]): string {
  if (!ids) return "كل الورشات";
  try {
    const arr: string[] = JSON.parse(ids);
    if (arr.length === 0) return "كل الورشات";
    return arr.map(id => workshops.find(w => w.id === id)?.name ?? id).join(", ");
  } catch { return ids; }
}

export default function Workshops() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isOwner = user?.username === "owner";

  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [searchInWorkshop, setSearchInWorkshop] = useState("");
  const [searchImport, setSearchImport] = useState("");
  const [transferTarget, setTransferTarget] = useState<string>("");
  const [transferEmpId, setTransferEmpId] = useState<string | null>(null);

  // Edit workshop modal
  const [editWorkshop, setEditWorkshop] = useState<Workshop | null>(null);
  const [editWsName, setEditWsName] = useState("");
  const [addAccOpen, setAddAccOpen] = useState(false);
  const [newAccUsername, setNewAccUsername] = useState("");
  const [newAccPassword, setNewAccPassword] = useState("");
  const [newAccShifts, setNewAccShifts] = useState<string[]>([]);
  const [newAccAllShifts, setNewAccAllShifts] = useState(true);

  // Multi-account modal
  const [multiAccOpen, setMultiAccOpen] = useState(false);
  const [multiUsername, setMultiUsername] = useState("");
  const [multiPassword, setMultiPassword] = useState("");
  const [multiShifts, setMultiShifts] = useState<string[]>([]);
  const [multiAllShifts, setMultiAllShifts] = useState(true);
  const [multiWorkshops, setMultiWorkshops] = useState<string[]>([]);
  const [multiAllWorkshops, setMultiAllWorkshops] = useState(true);

  // Accounts manager modal
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [changePwdId, setChangePwdId] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState("");

  const { data: workshops = [], isLoading: workshopsLoading } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: employees = [], isLoading: empsLoading } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    enabled: isOwner,
  });

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

  const createWorkshopMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiRequest("POST", "/api/workshops", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "تم إضافة الورشة بنجاح" });
      setNewName(""); setNewDescription(""); setAddOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateWorkshopMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiRequest("PATCH", `/api/workshops/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "تم تحديث اسم الورشة" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteWorkshopMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workshops/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "تم حذف الورشة" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateEmpMutation = useMutation({
    mutationFn: ({ id, workshopId }: { id: string; workshopId: string | null }) =>
      apiRequest("PATCH", `/api/employees/${id}`, { workshopId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/employees"] }),
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: { username: string; password: string; allowedShifts: string | null; allowedWorkshopIds: string | null }) =>
      apiRequest("POST", "/api/accounts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "تم إنشاء الحساب بنجاح" });
      setNewAccUsername(""); setNewAccPassword(""); setNewAccShifts([]); setNewAccAllShifts(true); setAddAccOpen(false);
      setMultiUsername(""); setMultiPassword(""); setMultiShifts([]); setMultiAllShifts(true);
      setMultiWorkshops([]); setMultiAllWorkshops(true); setMultiAccOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const changePwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiRequest("PATCH", `/api/accounts/${id}/password`, { password }),
    onSuccess: () => {
      toast({ title: "تم تغيير كلمة المرور" });
      setChangePwdId(null); setNewPwd("");
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "تم حذف الحساب" });
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
          setTransferEmpId(null); setTransferTarget("");
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

  // Accounts for edit workshop modal (filtered by workshopId)
  const wsAccounts = useMemo(() => {
    if (!editWorkshop) return [];
    return accounts.filter(a => {
      if (a.role !== "workshop") return false;
      const ids = parseIds(a.allowedWorkshopIds);
      return ids.includes(editWorkshop.id);
    });
  }, [accounts, editWorkshop]);

  function openEditWorkshop(w: Workshop) {
    setEditWorkshop(w);
    setEditWsName(w.name);
    setAddAccOpen(false);
    setNewAccUsername(""); setNewAccPassword(""); setNewAccShifts([]); setNewAccAllShifts(true);
  }

  function handleSaveWsName() {
    if (!editWorkshop || !editWsName.trim()) return;
    updateWorkshopMutation.mutate({ id: editWorkshop.id, name: editWsName.trim() });
  }

  function handleCreateWsAccount() {
    if (!editWorkshop || !newAccUsername.trim() || !newAccPassword.trim()) return;
    const shiftsJson = newAccAllShifts ? null : JSON.stringify(newAccShifts);
    createAccountMutation.mutate({
      username: newAccUsername.trim(),
      password: newAccPassword.trim(),
      allowedShifts: shiftsJson,
      allowedWorkshopIds: JSON.stringify([editWorkshop.id]),
    });
  }

  function handleCreateMultiAccount() {
    if (!multiUsername.trim() || !multiPassword.trim()) return;
    const shiftsJson = multiAllShifts ? null : JSON.stringify(multiShifts);
    const wsJson = multiAllWorkshops ? null : JSON.stringify(multiWorkshops);
    createAccountMutation.mutate({
      username: multiUsername.trim(),
      password: multiPassword.trim(),
      allowedShifts: shiftsJson,
      allowedWorkshopIds: wsJson,
    });
  }

  const PROTECTED = ["owner", "attendence", "observer", "caisse"];

  return (
    <div dir="rtl">
      <PageHeader
        title="الورشات"
        subtitle="إدارة الورشات وموظفيها"
        count={workshops.length}
        action={
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                {/* زر الحسابات */}
                <Dialog open={accountsOpen} onOpenChange={setAccountsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-accounts-manager">
                      <Shield className="h-4 w-4 ml-2" />
                      الحسابات
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        إدارة حسابات النظام
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                      {accountsLoading ? (
                        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">اسم المستخدم</TableHead>
                              <TableHead className="text-right">النوع</TableHead>
                              <TableHead className="text-right">الفترات</TableHead>
                              <TableHead className="text-right">الورشات</TableHead>
                              <TableHead className="text-center">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accounts.map(acc => (
                              <TableRow key={acc.id}>
                                <TableCell className="font-medium font-mono text-sm">{acc.username}</TableCell>
                                <TableCell>
                                  <Badge variant={acc.role === "workshop" ? "secondary" : "outline"}>
                                    {acc.role === "owner" ? "مالك" : acc.role === "attendence" ? "حضور" : acc.role === "observer" ? "مراقب" : acc.role === "caisse" ? "صندوق" : acc.role === "workshop" ? "ورشة" : acc.role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{getShiftLabel(acc.allowedShifts)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{getWorkshopNames(acc.allowedWorkshopIds, workshops)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-1">
                                    {/* Change Password */}
                                    {changePwdId === acc.id ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="password"
                                          className="h-7 w-32 text-xs"
                                          placeholder="كلمة مرور جديدة"
                                          value={newPwd}
                                          onChange={e => setNewPwd(e.target.value)}
                                          data-testid={`input-new-pwd-${acc.id}`}
                                        />
                                        <Button size="sm" className="h-7 px-2 text-xs" disabled={!newPwd || changePwdMutation.isPending}
                                          onClick={() => changePwdMutation.mutate({ id: acc.id, password: newPwd })}
                                          data-testid={`button-save-pwd-${acc.id}`}>
                                          حفظ
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setChangePwdId(null); setNewPwd(""); }}>
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
                                        onClick={() => { setChangePwdId(acc.id); setNewPwd(""); }}
                                        data-testid={`button-change-pwd-${acc.id}`}>
                                        <Key className="h-3 w-3" />
                                        كلمة المرور
                                      </Button>
                                    )}
                                    {/* Delete (workshop only) */}
                                    {!PROTECTED.includes(acc.username) && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" data-testid={`button-delete-acc-${acc.id}`}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent dir="rtl">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>حذف الحساب؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              سيتم حذف حساب <strong>{acc.username}</strong> نهائياً.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                                              onClick={() => deleteAccountMutation.mutate(acc.id)}>
                                              حذف
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* زر إضافة حساب متعدد */}
                <Dialog open={multiAccOpen} onOpenChange={v => { setMultiAccOpen(v); if (!v) { setMultiUsername(""); setMultiPassword(""); setMultiShifts([]); setMultiAllShifts(true); setMultiWorkshops([]); setMultiAllWorkshops(true); } }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-multi-account">
                      <UserCog className="h-4 w-4 ml-2" />
                      إضافة حساب متعدد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-primary" />
                        إضافة حساب متعدد الورشات
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>اسم المستخدم *</Label>
                        <Input value={multiUsername} onChange={e => setMultiUsername(e.target.value)} placeholder="مثال: ws_morning" data-testid="input-multi-username" />
                      </div>
                      <div className="space-y-2">
                        <Label>كلمة المرور *</Label>
                        <Input type="password" value={multiPassword} onChange={e => setMultiPassword(e.target.value)} placeholder="كلمة مرور قوية" data-testid="input-multi-password" />
                      </div>
                      <div className="space-y-2">
                        <Label>الفترات</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox id="multi-all-shifts" checked={multiAllShifts} onCheckedChange={v => setMultiAllShifts(!!v)} data-testid="check-multi-all-shifts" />
                          <label htmlFor="multi-all-shifts" className="text-sm">كل الفترات</label>
                        </div>
                        {!multiAllShifts && (
                          <div className="flex gap-3 mr-6">
                            {SHIFT_OPTIONS.map(s => (
                              <div key={s.value} className="flex items-center gap-1.5">
                                <Checkbox id={`multi-shift-${s.value}`} checked={multiShifts.includes(s.value)}
                                  onCheckedChange={v => setMultiShifts(prev => v ? [...prev, s.value] : prev.filter(x => x !== s.value))}
                                  data-testid={`check-multi-shift-${s.value}`} />
                                <label htmlFor={`multi-shift-${s.value}`} className="text-sm">{s.label}</label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>الورشات</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox id="multi-all-ws" checked={multiAllWorkshops} onCheckedChange={v => setMultiAllWorkshops(!!v)} data-testid="check-multi-all-workshops" />
                          <label htmlFor="multi-all-ws" className="text-sm">كل الورشات</label>
                        </div>
                        {!multiAllWorkshops && (
                          <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1 mr-6">
                            {workshops.map(w => (
                              <div key={w.id} className="flex items-center gap-1.5">
                                <Checkbox id={`multi-ws-${w.id}`} checked={multiWorkshops.includes(w.id)}
                                  onCheckedChange={v => setMultiWorkshops(prev => v ? [...prev, w.id] : prev.filter(x => x !== w.id))}
                                  data-testid={`check-multi-ws-${w.id}`} />
                                <label htmlFor={`multi-ws-${w.id}`} className="text-sm">{w.name}</label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setMultiAccOpen(false)}>إلغاء</Button>
                        <Button
                          disabled={!multiUsername.trim() || !multiPassword.trim() || createAccountMutation.isPending}
                          onClick={handleCreateMultiAccount}
                          data-testid="button-submit-multi-account">
                          إنشاء الحساب
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* إضافة ورشة جديدة */}
            <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setNewName(""); setNewDescription(""); } }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-workshop">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة ورشة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة ورشة جديدة</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newName.trim()) return;
                    createWorkshopMutation.mutate({ name: newName.trim(), description: newDescription.trim() || undefined });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>اسم الورشة *</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: ورشة الكهرباء" required data-testid="input-workshop-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
                    <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="وصف مختصر للورشة" data-testid="input-workshop-description" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => { setAddOpen(false); setNewName(""); setNewDescription(""); }}>إلغاء</Button>
                    <Button type="submit" disabled={createWorkshopMutation.isPending} data-testid="button-submit-workshop">إضافة</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="p-6 space-y-6">
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
                      <span className="flex-1 truncate">{w.name}</span>
                      {isOwner && (
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-primary/10"
                            onClick={() => openEditWorkshop(w)}
                            data-testid={`button-edit-workshop-${w.id}`}
                            title="تعديل الورشة">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive"
                                data-testid={`button-delete-workshop-${w.id}`}
                                title="حذف الورشة">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الورشة؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف ورشة <strong>{w.name}</strong> وجميع الحسابات المرتبطة بها. لن يتم حذف الموظفين.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteWorkshopMutation.mutate(w.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
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

        {/* ====== ديالوج تعديل الورشة (owner) ====== */}
        <Dialog open={!!editWorkshop} onOpenChange={v => { if (!v) { setEditWorkshop(null); setAddAccOpen(false); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                تعديل الورشة
              </DialogTitle>
            </DialogHeader>

            {/* اسم الورشة */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label>اسم الورشة</Label>
                <Input value={editWsName} onChange={e => setEditWsName(e.target.value)} data-testid="input-edit-ws-name" />
              </div>
              <Button onClick={handleSaveWsName} disabled={!editWsName.trim() || updateWorkshopMutation.isPending} data-testid="button-save-ws-name">
                حفظ الاسم
              </Button>
            </div>

            {/* حسابات الورشة */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">حسابات هذه الورشة</p>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setAddAccOpen(v => !v)} data-testid="button-add-ws-account">
                  <Plus className="h-3 w-3" />
                  إضافة حساب
                </Button>
              </div>

              {addAccOpen && (
                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground">حساب جديد لهذه الورشة</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">اسم المستخدم</Label>
                      <Input className="h-8 text-xs" value={newAccUsername} onChange={e => setNewAccUsername(e.target.value)} placeholder="مثال: workshop1" data-testid="input-new-acc-username" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">كلمة المرور</Label>
                      <Input className="h-8 text-xs" type="password" value={newAccPassword} onChange={e => setNewAccPassword(e.target.value)} placeholder="كلمة مرور قوية" data-testid="input-new-acc-password" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الفترة</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Checkbox id="acc-all-shifts" checked={newAccAllShifts} onCheckedChange={v => setNewAccAllShifts(!!v)} />
                        <label htmlFor="acc-all-shifts" className="text-xs">كل الفترات</label>
                      </div>
                      {!newAccAllShifts && SHIFT_OPTIONS.map(s => (
                        <div key={s.value} className="flex items-center gap-1.5">
                          <Checkbox id={`acc-shift-${s.value}`} checked={newAccShifts.includes(s.value)}
                            onCheckedChange={v => setNewAccShifts(prev => v ? [...prev, s.value] : prev.filter(x => x !== s.value))} />
                          <label htmlFor={`acc-shift-${s.value}`} className="text-xs">{s.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setAddAccOpen(false)}>إلغاء</Button>
                    <Button size="sm" disabled={!newAccUsername.trim() || !newAccPassword.trim() || createAccountMutation.isPending}
                      onClick={handleCreateWsAccount} data-testid="button-submit-ws-account">
                      إنشاء
                    </Button>
                  </div>
                </div>
              )}

              {/* جدول الحسابات */}
              <div className="border rounded-md overflow-hidden">
                {wsAccounts.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">لا توجد حسابات مرتبطة بهذه الورشة</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right text-xs">اسم المستخدم</TableHead>
                        <TableHead className="text-right text-xs">الفترة</TableHead>
                        <TableHead className="text-center text-xs">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wsAccounts.map(acc => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-mono text-xs py-2">{acc.username}</TableCell>
                          <TableCell className="text-xs py-2 text-muted-foreground">{getShiftLabel(acc.allowedShifts)}</TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center justify-center gap-1">
                              {changePwdId === acc.id ? (
                                <div className="flex items-center gap-1">
                                  <Input type="password" className="h-6 w-28 text-xs" placeholder="كلمة مرور جديدة" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                                  <Button size="sm" className="h-6 px-2 text-xs" disabled={!newPwd || changePwdMutation.isPending}
                                    onClick={() => changePwdMutation.mutate({ id: acc.id, password: newPwd })}>حفظ</Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setChangePwdId(null); setNewPwd(""); }}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" className="h-6 gap-1 text-xs" onClick={() => { setChangePwdId(acc.id); setNewPwd(""); }}>
                                  <Key className="h-3 w-3" />
                                  تغيير كلمة المرور
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>حذف الحساب؟</AlertDialogTitle>
                                    <AlertDialogDescription>سيتم حذف حساب <strong>{acc.username}</strong> نهائياً.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                                      onClick={() => deleteAccountMutation.mutate(acc.id)}>حذف</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
              <Button size="sm" className="gap-1 shrink-0" onClick={() => { setImportOpen(true); setSearchImport(""); }} data-testid="button-import-employees">
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
                  <div key={emp.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors" data-testid={`row-workshop-emp-${emp.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground w-10 shrink-0">{emp.employeeCode}</span>
                      <span className="text-sm font-medium truncate">{emp.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
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
                          <Button size="sm" className="h-7 text-xs px-2" disabled={!transferTarget || updateEmpMutation.isPending}
                            onClick={() => transferEmployee(emp, transferTarget)} data-testid={`button-confirm-transfer-${emp.id}`}>نقل</Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setTransferEmpId(null); setTransferTarget(""); }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                            onClick={() => { setTransferEmpId(emp.id); setTransferTarget(""); }} data-testid={`button-transfer-${emp.id}`}>
                            <ArrowLeftRight className="h-3 w-3" />
                            نقل
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" data-testid={`button-remove-${emp.id}`}>
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
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => removeFromWorkshop(emp)}>إزالة</AlertDialogAction>
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
              <Input placeholder="بحث باسم أو رقم الموظف أو الورشة..." className="pr-9" value={searchImport} onChange={(e) => setSearchImport(e.target.value)} data-testid="input-search-import" />
            </div>
            <div className="flex-1 overflow-y-auto border rounded-md divide-y">
              {filteredImport.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Users className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">لا يوجد موظفون خارج هذه الورشة</p>
                </div>
              ) : (
                filteredImport.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors" data-testid={`row-import-emp-${emp.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground w-10 shrink-0">{emp.employeeCode}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{getEmployeeWorkshopName(emp)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0" disabled={updateEmpMutation.isPending} onClick={() => importEmployee(emp)} data-testid={`button-import-emp-${emp.id}`}>
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
    </div>
  );
}
