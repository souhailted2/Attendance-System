import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Fingerprint, Wifi, RefreshCw, Loader2, CheckCircle, XCircle, Eraser, Clock, Wrench } from "lucide-react";
import type { DeviceSettings, Workshop } from "@shared/schema";

export default function Devices() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceSettings | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; info?: any }>>({});
  const [syncResults, setSyncResults] = useState<Record<string, { imported: number; duplicates: number; skipped: number; total: number; errors: string[]; message: string }>>({});
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);
  const [clearingDeviceId, setClearingDeviceId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("4370");
  const [isActive, setIsActive] = useState(true);
  const [workshopId, setWorkshopId] = useState<string>("");

  const { data: devices, isLoading } = useQuery<DeviceSettings[]>({ queryKey: ["/api/device-settings"] });
  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/device-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-settings"] });
      toast({ title: "تم إضافة الجهاز" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/device-settings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-settings"] });
      toast({ title: "تم التحديث" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/device-settings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-settings"] });
      toast({ title: "تم الحذف" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      setTestingDeviceId(id);
      const res = await apiRequest("POST", `/api/device-settings/${id}/test`);
      return { id, result: await res.json() };
    },
    onSuccess: ({ id, result }: { id: string; result: any }) => {
      setTestingDeviceId(null);
      setTestResults(prev => ({ ...prev, [id]: result }));
      if (result.success) {
        toast({ title: "تم الاتصال بنجاح", description: `المستخدمين: ${result.info?.userCounts || 0} | السجلات: ${result.info?.logCounts || 0}` });
      } else {
        toast({ title: "فشل الاتصال", description: result.message, variant: "destructive" });
      }
    },
    onError: (err: Error) => { setTestingDeviceId(null); toast({ title: "خطأ", description: err.message, variant: "destructive" }); },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      setSyncingDeviceId(id);
      const res = await apiRequest("POST", `/api/device-settings/${id}/sync`);
      return { id, result: await res.json() };
    },
    onSuccess: ({ id, result }: { id: string; result: any }) => {
      setSyncingDeviceId(null);
      setSyncResults(prev => ({ ...prev, [id]: result }));
      queryClient.invalidateQueries({ queryKey: ["/api/device-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: result.message });
    },
    onError: (err: Error) => { setSyncingDeviceId(null); toast({ title: "خطأ في المزامنة", description: err.message, variant: "destructive" }); },
  });

  const clearLogsMutation = useMutation({
    mutationFn: async (id: string) => {
      setClearingDeviceId(id);
      const res = await apiRequest("POST", `/api/device-settings/${id}/clear-logs`);
      return { id, result: await res.json() };
    },
    onSuccess: ({ id, result }: { id: string; result: any }) => {
      setClearingDeviceId(null);
      if (result.success) {
        toast({ title: "تم مسح السجلات", description: result.message });
      } else {
        toast({ title: "فشل مسح السجلات", description: result.message, variant: "destructive" });
      }
    },
    onError: (err: Error) => { setClearingDeviceId(null); toast({ title: "خطأ", description: err.message, variant: "destructive" }); },
  });

  function resetForm() {
    setName(""); setIpAddress(""); setPort("4370"); setIsActive(true); setWorkshopId(""); setEditingDevice(null);
  }

  function openEdit(device: DeviceSettings) {
    setEditingDevice(device);
    setName(device.name);
    setIpAddress(device.ipAddress);
    setPort(String(device.port));
    setIsActive(device.isActive);
    setWorkshopId(device.workshopId || "");
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name,
      ipAddress,
      port: parseInt(port) || 4370,
      isActive,
      workshopId: workshopId || null,
    };
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function formatSyncDate(dateStr: string | null | undefined) {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ar-SA") + " " + d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">أجهزة البصمة</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-device">
              <Plus className="h-4 w-4 ml-2" />
              إضافة جهاز
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDevice ? "تعديل الجهاز" : "إضافة جهاز جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>اسم الجهاز *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-device-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان IP *</Label>
                  <Input value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} required placeholder="192.168.1.100" data-testid="input-ip" />
                </div>
                <div className="space-y-2">
                  <Label>المنفذ</Label>
                  <Input type="number" value={port} onChange={(e) => setPort(e.target.value)} data-testid="input-port" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الورشة المرتبطة</Label>
                <Select value={workshopId || "none"} onValueChange={(v) => setWorkshopId(v === "none" ? "" : v)}>
                  <SelectTrigger data-testid="select-workshop">
                    <SelectValue placeholder="اختر الورشة (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون ورشة</SelectItem>
                    {workshops?.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-device-active" />
                <Label>نشط</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => { setOpen(false); resetForm(); }}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-device">
                  {editingDevice ? "تحديث" : "إضافة"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !devices || devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Fingerprint className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد أجهزة بصمة مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => {
            const testResult = testResults[device.id];
            const syncResult = syncResults[device.id];
            const lastSync = formatSyncDate(device.lastSyncAt);
            const workshop = workshops?.find(w => w.id === device.workshopId);

            return (
              <Card key={device.id} data-testid={`card-device-${device.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Fingerprint className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{device.name}</p>
                          <Badge variant={device.isActive ? "default" : "secondary"} className="text-xs">
                            {device.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                          {workshop && (
                            <Badge variant="outline" className="text-xs gap-1" data-testid={`badge-workshop-${device.id}`}>
                              <Wrench className="h-3 w-3" />
                              {workshop.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{device.ipAddress}:{device.port}</p>
                        {lastSync && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            آخر مزامنة: {lastSync}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => testMutation.mutate(device.id)}
                        disabled={testingDeviceId === device.id}
                        data-testid={`button-test-${device.id}`}
                      >
                        {testingDeviceId === device.id ? (
                          <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                        ) : (
                          <Wifi className="h-3 w-3 ml-1" />
                        )}
                        اختبار
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => syncMutation.mutate(device.id)}
                        disabled={syncingDeviceId === device.id}
                        data-testid={`button-sync-${device.id}`}
                      >
                        {syncingDeviceId === device.id ? (
                          <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 ml-1" />
                        )}
                        مزامنة
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={clearingDeviceId === device.id}
                            data-testid={`button-clear-logs-${device.id}`}
                          >
                            {clearingDeviceId === device.id ? (
                              <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                            ) : (
                              <Eraser className="h-3 w-3 ml-1" />
                            )}
                            مسح السجلات
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد مسح السجلات</AlertDialogTitle>
                            <AlertDialogDescription>سيتم مسح جميع سجلات الحضور من الجهاز. هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => clearLogsMutation.mutate(device.id)}>مسح</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(device)} data-testid={`button-edit-device-${device.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" data-testid={`button-delete-device-${device.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>هل أنت متأكد من حذف هذا الجهاز؟</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(device.id)}>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {testResult && (
                    <div className={`rounded-md p-3 text-sm ${testResult.success ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"}`} data-testid={`test-result-${device.id}`}>
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <span className={testResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                          {testResult.message}
                        </span>
                      </div>
                      {testResult.success && testResult.info && (
                        <div className="mt-2 flex gap-4 text-xs text-green-600 dark:text-green-400 mr-6">
                          <span>المستخدمين: {testResult.info.userCounts}</span>
                          <span>السجلات: {testResult.info.logCounts}</span>
                          {testResult.info.firmwareVersion && <span>الإصدار: {testResult.info.firmwareVersion}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {syncResult && (
                    <div className="rounded-md p-3 text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" data-testid={`sync-result-${device.id}`}>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">{syncResult.message}</p>
                      <div className="mt-2 flex gap-4 text-xs text-blue-600 dark:text-blue-400">
                        <span>إجمالي: {syncResult.total}</span>
                        <span>مستورد: {syncResult.imported}</span>
                        <span>مكرر: {syncResult.duplicates}</span>
                        <span>متخطى: {syncResult.skipped}</span>
                      </div>
                      {syncResult.errors && syncResult.errors.length > 0 && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400 space-y-0.5">
                          {syncResult.errors.slice(0, 5).map((err, i) => (
                            <p key={i}>{err}</p>
                          ))}
                          {syncResult.errors.length > 5 && (
                            <p>... و {syncResult.errors.length - 5} أخطاء أخرى</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
