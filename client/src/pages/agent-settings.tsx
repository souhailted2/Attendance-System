import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Key, RefreshCw, Copy, Check, Bot, Info, Download, ExternalLink, Fingerprint, Package } from "lucide-react";
import type { DeviceSettings } from "@shared/schema";

export default function AgentSettings() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery<{ key: string | null }>({
    queryKey: ["/api/settings/agent-key"],
  });

  const { data: devices, isLoading: devicesLoading } = useQuery<DeviceSettings[]>({
    queryKey: ["/api/device-settings"],
  });

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
      toast({ title: "يجب إنشاء مفتاح API أولاً", variant: "destructive" });
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
      const url = `/api/agent/download-package?deviceIds=${ids.join(",")}`;
      const res = await fetch(url);
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
      const msg = err instanceof Error ? err.message : "خطأ في التحميل";
      toast({ title: "فشل التحميل", description: msg, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  const apiKey = data?.key;
  const allSelected = devices && devices.length > 0 && selectedDeviceIds.size === devices.length;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Agent المصنع</h1>
          <p className="text-sm text-muted-foreground">برنامج مزامنة أجهزة البصمة مع الموقع</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">١</span>
            تثبيت Node.js على الكمبيوتر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">برنامج Node.js مطلوب لتشغيل الـ Agent. حمّله مرة واحدة فقط.</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">٢</span>
            مفتاح API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : apiKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                  مفعّل
                </Badge>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted border font-mono text-xs break-all" data-testid="text-api-key">
                <span className="flex-1 select-all">{apiKey}</span>
                <Button size="icon" variant="ghost" className="flex-shrink-0 h-8 w-8" onClick={copyKey} data-testid="button-copy-key">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا يوجد مفتاح API حالياً. أنشئ مفتاحاً جديداً أدناه.</p>
          )}

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            variant={apiKey ? "outline" : "default"}
            data-testid="button-generate-key"
          >
            {generateMutation.isPending ? (
              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 ml-2" />
            )}
            {apiKey ? "تجديد المفتاح" : "إنشاء مفتاح جديد"}
          </Button>

          {apiKey && (
            <div className="flex gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>تجديد المفتاح سيبطل المفتاح القديم وستحتاج لإعادة تحميل الحزمة.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">٣</span>
            تحميل حزمة الـ Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            اختر الأجهزة التي تريد مزامنتها ثم حمّل الحزمة. ستجد بداخلها كل الملفات جاهزة.
          </p>

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

          <Button
            onClick={downloadPackage}
            disabled={downloading || !apiKey || !devices || devices.length === 0}
            className="w-full gap-2"
            data-testid="button-download-package"
          >
            {downloading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? "جارٍ إنشاء الحزمة..." : `تحميل حزمة الـ Agent${selectedDeviceIds.size > 0 ? ` (${selectedDeviceIds.size} ${selectedDeviceIds.size === 1 ? "جهاز" : "أجهزة"})` : " (جميع الأجهزة)"}`}
          </Button>

          {!apiKey && (
            <p className="text-xs text-muted-foreground text-center">
              أنشئ مفتاح API في الخطوة الثانية أولاً لتفعيل التحميل
            </p>
          )}
        </CardContent>
      </Card>

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
            <div className="space-y-1">
              <p className="font-medium">بعد تحميل الحزمة واستخراجها:</p>
              <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside">
                <li>افتح المجلد المستخرج</li>
                <li>انقر مرتين على <code className="bg-background border rounded px-1 font-mono text-xs">run-once.bat</code> لمزامنة فورية</li>
                <li>أو انقر مرتين على <code className="bg-background border rounded px-1 font-mono text-xs">run-auto.bat</code> للمزامنة كل 30 دقيقة تلقائياً</li>
              </ol>
            </div>
          </div>
          <div className="flex gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs">الكمبيوتر يجب أن يكون على نفس الشبكة المحلية لأجهزة البصمة وله اتصال إنترنت للوصول للموقع.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
