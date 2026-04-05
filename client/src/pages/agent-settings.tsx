import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Key, RefreshCw, Copy, Check, Bot, Info } from "lucide-react";

export default function AgentSettings() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{ key: string | null }>({
    queryKey: ["/api/settings/agent-key"],
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

  const apiKey = data?.key;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Agent المصنع</h1>
          <p className="text-sm text-muted-foreground">إدارة مفتاح API لسكريبت Agent جهاز البصمة</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            مفتاح API للـ Agent
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
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted border font-mono text-sm break-all" data-testid="text-api-key">
                <span className="flex-1 select-all">{apiKey}</span>
                <Button size="icon" variant="ghost" className="flex-shrink-0 h-8 w-8" onClick={copyKey} data-testid="button-copy-key">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا يوجد مفتاح API حالياً. أنشئ مفتاحاً جديداً للبدء.</p>
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
              <p>تجديد المفتاح سيبطل المفتاح القديم. ستحتاج لتحديث ملف <code className="font-mono">.env</code> في كمبيوتر المصنع.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تعليمات تثبيت الـ Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            ملف Agent موجود في مجلد <code className="font-mono text-foreground">agent/</code> في المشروع.
            انظر ملف <code className="font-mono text-foreground">agent/README.ar.md</code> للتعليمات الكاملة.
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-muted space-y-1">
              <p className="font-medium text-xs text-muted-foreground mb-2">خطوات التثبيت السريعة:</p>
              <ol className="space-y-1 list-decimal list-inside text-xs text-muted-foreground">
                <li>انسخ مجلد <code className="font-mono">agent/</code> إلى كمبيوتر المصنع</li>
                <li>شغّل <code className="font-mono">npm install</code> داخل المجلد</li>
                <li>أنشئ ملف <code className="font-mono">.env</code> وضع فيه المفتاح والإعدادات</li>
                <li>شغّل <code className="font-mono">node zk-agent.js</code> لمزامنة البيانات</li>
              </ol>
            </div>
            <div className="p-3 rounded-md bg-muted">
              <p className="font-medium text-xs text-muted-foreground mb-2">مثال ملف .env:</p>
              <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">{`SERVER_URL=https://your-server.com
AGENT_API_KEY=${apiKey || "YOUR_API_KEY_HERE"}
DEVICES=192.168.1.100:4370:ورشة-1,192.168.1.101:4370:ورشة-2`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
