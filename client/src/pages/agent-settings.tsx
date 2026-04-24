import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Key, RefreshCw, Copy, Check, Bot, Info, Download, ExternalLink, Fingerprint, Package, Database, Wifi, Phone, Mail, MapPin, Clock } from "lucide-react";
import brandLogoImg from "@assets/ChatGPT_Image_Apr_24,_2026,_06_21_21_PM_1777051422873.png";
import type { DeviceSettings } from "@shared/schema";

export default function AgentSettings() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [downloadingMdb, setDownloadingMdb] = useState(false);

  const { data, isLoading: keyLoading } = useQuery<{ key: string | null }>({
    queryKey: ["/api/settings/agent-key"],
  });

  const { data: devices, isLoading: devicesLoading } = useQuery<DeviceSettings[]>({
    queryKey: ["/api/device-settings"],
  });

  useEffect(() => {
    if (devices && devices.length > 0 && selectedDeviceIds.size === 0) {
      setSelectedDeviceIds(new Set(devices.map(d => d.id)));
    }
  }, [devices]);

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/settings/agent-key/generate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/agent-key"] });
      toast({ title: "تم إنشاء مفتاح API جديد" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function copyKey() {
    if (!data?.key) return;
    navigator.clipboard.writeText(data.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "تم نسخ المفتاح" });
  }

  function toggleDevice(id: string) {
    setSelectedDeviceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!devices) return;
    if (selectedDeviceIds.size === devices.length) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(devices.map(d => d.id)));
    }
  }

  async function downloadPackage() {
    if (!data?.key) {
      toast({ title: "أنشئ مفتاح API أولاً", variant: "destructive" });
      return;
    }
    if (!devices || devices.length === 0) {
      toast({ title: "لا توجد أجهزة مضافة", description: "أضف جهازاً من صفحة أجهزة البصمة أولاً", variant: "destructive" });
      return;
    }
    setDownloading(true);
    try {
      const ids = selectedDeviceIds.size > 0
        ? Array.from(selectedDeviceIds)
        : devices.map(d => d.id);
      const res = await fetch(`/api/agent/download-package?deviceIds=${encodeURIComponent(ids.join(","))}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطأ غير معروف" }));
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "zk-agent.zip";
      link.click();
      URL.revokeObjectURL(link.href);
      toast({ title: "تم تحميل الحزمة بنجاح" });
    } catch (err: unknown) {
      toast({ title: "فشل التحميل", description: err instanceof Error ? err.message : "خطأ في التحميل", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  async function downloadMdbPackage() {
    if (!data?.key) {
      toast({ title: "أنشئ مفتاح API أولاً", variant: "destructive" });
      return;
    }
    setDownloadingMdb(true);
    try {
      const res = await fetch(`/api/agent/download-mdb-package`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطأ غير معروف" }));
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "mdb-agent.zip";
      link.click();
      URL.revokeObjectURL(link.href);
      toast({ title: "تم تحميل حزمة MDB بنجاح" });
    } catch (err: unknown) {
      toast({ title: "فشل التحميل", description: err instanceof Error ? err.message : "خطأ في التحميل", variant: "destructive" });
    } finally {
      setDownloadingMdb(false);
    }
  }

  const apiKey = data?.key;
  const allSelected = devices && devices.length > 0 && selectedDeviceIds.size === devices.length;
  const selectedCount = selectedDeviceIds.size > 0 ? selectedDeviceIds.size : (devices?.length ?? 0);

  return (
    <div className="p-6 space-y-6 max-w-2xl">

      {/* ===== بطاقة هوية الشركة / Company Identity Card ===== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0D1321 0%, #1B2434 100%)",
          border: "1px solid rgba(212,175,55,0.30)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.30), 0 0 0 1px rgba(212,175,55,0.08)",
        }}
        data-testid="card-company-identity"
      >
        {/* Brand image strip */}
        <div className="relative h-28 overflow-hidden">
          <img
            src={brandLogoImg}
            alt="TEDJANI ATTENDIX"
            className="w-full object-cover object-top opacity-60"
            style={{ filter: "brightness(0.7) saturate(0.9)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, #0D1321 100%)" }} />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 -mt-2">
          {/* Logo + Name */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #B8860B)",
                boxShadow: "0 4px 16px rgba(212,175,55,0.45)",
              }}
            >
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Tajawal', sans-serif", letterSpacing: "0.06em" }}
              >
                TEDJANI ATTENDIX
              </h2>
              <p className="text-sm" style={{ color: "rgba(212,175,55,0.80)", fontFamily: "'Cairo', sans-serif" }}>
                Smart Attendance & Workforce Management
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4" style={{ borderBottom: "1px solid rgba(212,175,55,0.15)" }} />

          {/* Contact info */}
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { icon: Phone, value: "+213 555 123 456", label: "الهاتف" },
              { icon: Mail, value: "contact@tedjani-attendix.dz", label: "البريد الإلكتروني" },
              { icon: MapPin, value: "Algeria", label: "الموقع" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                  style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.22)" }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</p>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Agent المصنع</h1>
          <p className="text-sm text-muted-foreground">برنامج مزامنة أجهزة البصمة مع الموقع</p>
        </div>
      </div>

      {/* الخطوة 1: تثبيت Node.js */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">١</span>
            تثبيت Node.js على الكمبيوتر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">برنامج Node.js مطلوب مرة واحدة فقط على كمبيوتر المصنع.</p>
          <a
            href="https://nodejs.org/ar/download"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-nodejs-download"
          >
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              تحميل Node.js (مجاني)
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* الخطوة 2: مفتاح API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">٢</span>
            مفتاح API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">مطلوب لكلا نوعَي الـ Agent أدناه.</p>
          {keyLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : apiKey ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted border font-mono text-xs break-all" data-testid="text-api-key">
                <span className="flex-1 select-all">{apiKey}</span>
                <Button size="icon" variant="ghost" className="flex-shrink-0 h-8 w-8" onClick={copyKey} data-testid="button-copy-key">
                  {copied ? <Check className="h-4 w-4 text-green-600 dark:text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} data-testid="button-regenerate-key">
                {generateMutation.isPending ? <RefreshCw className="h-3 w-3 ml-1.5 animate-spin" /> : <Key className="h-3 w-3 ml-1.5" />}
                تجديد المفتاح
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">أنشئ مفتاح API أولاً لتفعيل التحميل.</p>
              <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} data-testid="button-generate-key">
                {generateMutation.isPending ? <RefreshCw className="h-4 w-4 ml-2 animate-spin" /> : <Key className="h-4 w-4 ml-2" />}
                إنشاء مفتاح
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الخطوة 3: اختيار نوع الـ Agent */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-3 px-1">الخطوة ٣ — اختر نوع الـ Agent المناسب لك:</p>
        <div className="grid gap-4">

          {/* النوع أ: قراءة من قاعدة البيانات (MDB) */}
          <Card className="border-2 border-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p>النوع أ — قراءة من برنامج ZKTeco</p>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">إذا كان برنامج ZKTeco مثبّتاً على نفس الكمبيوتر</p>
                </div>
                <Badge className="mr-auto text-xs">موصى به</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  يقرأ مباشرة من ملف:
                  <code className="mx-1 bg-background border rounded px-1 font-mono" dir="ltr">C:\Program Files (x86)\ZKTeco\ZKTeco\att2000.mdb</code>
                  <br />
                  يُنشئ الموظفين تلقائياً ويرسل الحضور دون الحاجة لاتصال شبكي بالجهاز.
                </p>
              </div>
              <Button
                onClick={downloadMdbPackage}
                disabled={downloadingMdb || !apiKey}
                className="w-full gap-2"
                data-testid="button-download-mdb-package"
              >
                {downloadingMdb ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloadingMdb ? "جارٍ إنشاء الحزمة..." : "تحميل حزمة MDB Agent"}
              </Button>
              {!apiKey && !keyLoading && (
                <p className="text-xs text-muted-foreground text-center">أنشئ مفتاح API أولاً (الخطوة ٢)</p>
              )}
            </CardContent>
          </Card>

          {/* النوع ب: اتصال مباشر بالجهاز عبر الشبكة */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p>النوع ب — اتصال مباشر بالجهاز</p>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">إذا كان جهاز البصمة متصلاً بالشبكة مباشرة</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الأجهزة المُضمَّنة في الحزمة</p>
                {devicesLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !devices || devices.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted border text-sm text-muted-foreground">
                    <Fingerprint className="h-4 w-4 flex-shrink-0" />
                    <span>لا توجد أجهزة. أضف جهازاً من صفحة <strong>أجهزة البصمة</strong> أولاً.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <Checkbox
                        id="select-all"
                        checked={allSelected ?? false}
                        onCheckedChange={toggleAll}
                        data-testid="checkbox-select-all-devices"
                      />
                      <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        {allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                      </label>
                    </div>
                    {devices.map(device => (
                      <div
                        key={device.id}
                        className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleDevice(device.id)}
                        data-testid={`device-option-${device.id}`}
                      >
                        <Checkbox
                          id={`device-${device.id}`}
                          checked={selectedDeviceIds.has(device.id)}
                          onCheckedChange={() => toggleDevice(device.id)}
                          onClick={e => e.stopPropagation()}
                          data-testid={`checkbox-device-${device.id}`}
                        />
                        <Fingerprint className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{device.name}</p>
                          <p className="text-xs text-muted-foreground">{device.ipAddress}:{device.port}</p>
                        </div>
                        <Badge variant={device.isActive ? "default" : "secondary"} className="text-xs">
                          {device.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={downloadPackage}
                disabled={downloading || !apiKey || !devices || devices.length === 0}
                className="w-full gap-2"
                variant="outline"
                data-testid="button-download-package"
              >
                {downloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading
                  ? "جارٍ إنشاء الحزمة..."
                  : `تحميل حزمة الاتصال المباشر (${selectedCount} ${selectedCount === 1 ? "جهاز" : "أجهزة"})`}
              </Button>

              {!apiKey && !keyLoading && (
                <p className="text-xs text-muted-foreground text-center">أنشئ مفتاح API أولاً (الخطوة ٢)</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* الخطوة 4: تشغيل البرنامج */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">٤</span>
            تشغيل البرنامج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3 p-3 rounded-md bg-muted items-start">
            <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium">بعد تحميل الحزمة واستخراجها:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  للمزامنة مرة واحدة: انقر مرتين على
                  <code className="mx-1 bg-background border rounded px-1.5 py-0.5 font-mono text-xs">run.bat</code>
                </p>
                <p>
                  للمزامنة التلقائية كل 30 دقيقة: انقر مرتين على
                  <code className="mx-1 bg-background border rounded px-1.5 py-0.5 font-mono text-xs">watch.bat</code>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs">
              عند أول تشغيل لـ MDB Agent، سيُنشئ الموظفين تلقائياً من جهاز البصمة ويرسل سجلات الـ 30 يوم الماضية.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
