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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Fingerprint, Wifi, RefreshCw } from "lucide-react";
import type { DeviceSettings } from "@shared/schema";

export default function Devices() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceSettings | null>(null);

  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("4370");
  const [isActive, setIsActive] = useState(true);

  const { data: devices, isLoading } = useQuery<DeviceSettings[]>({ queryKey: ["/api/device-settings"] });

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
      const res = await apiRequest("POST", `/api/device-settings/${id}/test`);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: "تم الاتصال بنجاح", description: `المستخدمين: ${data.info?.userCounts || 0} | السجلات: ${data.info?.logCounts || 0}` });
      } else {
        toast({ title: "فشل الاتصال", description: data.message, variant: "destructive" });
      }
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/device-settings/${id}/sync`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: data.message, description: `مستورد: ${data.imported} | مكرر: ${data.duplicates} | متخطى: ${data.skipped}` });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (err: Error) => toast({ title: "خطأ في المزامنة", description: err.message, variant: "destructive" }),
  });

  function resetForm() {
    setName(""); setIpAddress(""); setPort("4370"); setIsActive(true); setEditingDevice(null);
  }

  function openEdit(device: DeviceSettings) {
    setEditingDevice(device);
    setName(device.name);
    setIpAddress(device.ipAddress);
    setPort(String(device.port));
    setIsActive(device.isActive);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { name, ipAddress, port: parseInt(port) || 4370, isActive };
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data });
    } else {
      createMutation.mutate(data);
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
        <div className="grid gap-3">
          {devices.map((device) => (
            <Card key={device.id} data-testid={`card-device-${device.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Fingerprint className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{device.name}</p>
                        <Badge variant={device.isActive ? "default" : "secondary"} className="text-xs">
                          {device.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{device.ipAddress}:{device.port}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => testMutation.mutate(device.id)}
                      disabled={testMutation.isPending}
                      data-testid={`button-test-${device.id}`}
                    >
                      <Wifi className="h-3 w-3 ml-1" />
                      اختبار
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => syncMutation.mutate(device.id)}
                      disabled={syncMutation.isPending}
                      data-testid={`button-sync-${device.id}`}
                    >
                      <RefreshCw className="h-3 w-3 ml-1" />
                      مزامنة
                    </Button>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
