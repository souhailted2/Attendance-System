import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ActivityLog } from "@shared/schema";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_USERNAME = "bachir tedjani";

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-DZ", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

function parseVals(json: string | null | undefined): { checkIn: string | null; checkOut: string | null; status: string } | null {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

function timeLabel(t: string | null) {
  return t || "—";
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    present: "حاضر", absent: "غائب", leave: "إجازة", holiday: "عطلة",
  };
  return map[s] ?? s;
}

function buildDescription(log: ActivityLog): string {
  const who = log.username ?? "مجهول";
  const emp = log.employeeName ? `${log.employeeName} (${log.employeeCode ?? "—"})` : "—";
  const ws = log.workshopName ?? "—";
  const rule = log.workRuleName ?? "—";
  const date = log.recordDate ?? "—";

  if (log.entityType === "attendance") {
    const old = parseVals(log.oldValues);
    const nw = parseVals(log.newValues);

    if (log.method === "PATCH" && old && nw) {
      const parts: string[] = [];
      if (old.checkIn !== nw.checkIn) parts.push(`الدخول: ${timeLabel(old.checkIn)} ← ${timeLabel(nw.checkIn)}`);
      if (old.checkOut !== nw.checkOut) parts.push(`الخروج: ${timeLabel(old.checkOut)} ← ${timeLabel(nw.checkOut)}`);
      if (old.status !== nw.status) parts.push(`الحالة: ${statusLabel(old.status)} ← ${statusLabel(nw.status)}`);
      const changes = parts.length > 0 ? ` — ${parts.join(" — ")}` : " (بدون تغيير ظاهر)";
      return `قام ${who} بتعديل سجل الحضور في ${rule} — ورشة ${ws} — موظف: ${emp} — تاريخ ${date}${changes}`;
    }
    if (log.method === "POST" && nw) {
      return `قام ${who} بإنشاء سجل حضور جديد في ${rule} — ورشة ${ws} — موظف: ${emp} — تاريخ ${date} — دخول: ${timeLabel(nw.checkIn)} خروج: ${timeLabel(nw.checkOut)}`;
    }
    if (log.method === "DELETE" && old) {
      return `قام ${who} بحذف سجل الحضور في ${rule} — ورشة ${ws} — موظف: ${emp} — تاريخ ${date} — دخول: ${timeLabel(old.checkIn)} خروج: ${timeLabel(old.checkOut)}`;
    }
  }

  if (log.method === "ACTION") {
    return log.details ?? "عملية أرشيف";
  }

  // Generic description for non-attendance logs
  const clean = log.path.replace(/\/[a-f0-9\-]{36}/g, "").replace(/\/$/, "");
  const labelMap: Record<string, Record<string, string>> = {
    POST: { "/api/employees": "إضافة موظف", "/api/companies": "إضافة شركة", "/api/workshops": "إضافة ورشة", "/api/positions": "إضافة منصب", "/api/work-rules": "إضافة قاعدة عمل", "/api/attendance/import": "استيراد حضور", "/api/devices": "إضافة جهاز", "/api/agent/attendance": "رفع حضور (جهاز)", "/api/frozen-archives": "حفظ تقرير" },
    PATCH: { "/api/employees": "تعديل موظف", "/api/companies": "تعديل شركة", "/api/workshops": "تعديل ورشة", "/api/positions": "تعديل منصب", "/api/work-rules": "تعديل قاعدة عمل", "/api/devices": "تعديل جهاز" },
    DELETE: { "/api/employees": "حذف موظف", "/api/companies": "حذف شركة", "/api/workshops": "حذف ورشة", "/api/positions": "حذف منصب", "/api/work-rules": "حذف قاعدة عمل", "/api/devices": "حذف جهاز", "/api/frozen-archives": "إلغاء حفظ تقرير" },
  };
  const label = labelMap[log.method]?.[clean] ?? `${log.method} ${log.path}`;
  return `قام ${who} بـ: ${label}`;
}

function methodColor(method: string, isReverted: number | null) {
  if (isReverted) return "bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400";
  const colors: Record<string, string> = {
    POST: "bg-green-50 dark:bg-green-950/20 border-r-4 border-r-green-400",
    PATCH: "bg-blue-50 dark:bg-blue-950/20 border-r-4 border-r-blue-400",
    DELETE: "bg-red-50 dark:bg-red-950/20 border-r-4 border-r-red-400",
    ACTION: "bg-purple-50 dark:bg-purple-950/20 border-r-4 border-r-purple-400",
  };
  return colors[method] ?? "bg-background";
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    POST: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    PATCH: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    ACTION: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  const labels: Record<string, string> = { POST: "إنشاء", PATCH: "تعديل", DELETE: "حذف", ACTION: "أرشيف" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[method] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[method] ?? method}
    </span>
  );
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [revertingId, setRevertingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.username !== ADMIN_USERNAME) setLocation("/");
  }, [user, setLocation]);

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
    refetchInterval: 30_000,
  });

  const revertMutation = useMutation({
    mutationFn: (logId: string) => apiRequest("POST", `/api/activity-logs/${logId}/revert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "تم الإرجاع", description: "تم استرجاع القيم القديمة وقفل السجل" });
      setRevertingId(null);
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message ?? "تعذّر الإرجاع", variant: "destructive" });
      setRevertingId(null);
    },
  });

  function handleRevert(log: ActivityLog) {
    setRevertingId(log.id);
    revertMutation.mutate(log.id);
  }

  const canRevert = (log: ActivityLog) =>
    log.method === "PATCH" &&
    log.entityType === "attendance" &&
    log.oldValues &&
    !log.isReverted;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-activity-log-title">
          سجل النشاطات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          جميع العمليات التي أُجريت على النظام (أحدث أولاً)
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" data-testid="spinner-loading" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground" data-testid="text-no-logs">
          <p className="text-lg">لا توجد نشاطات مسجّلة بعد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2" data-testid="list-activity-logs">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-lg border border-border px-4 py-3 flex items-start gap-3 ${methodColor(log.method, log.isReverted ?? 0)}`}
              data-testid={`row-log-${log.id}`}
            >
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <MethodBadge method={log.method} />
                  {log.isReverted ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300" data-testid={`badge-reverted-${log.id}`}>
                      🔒 تم الإرجاع
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground tabular-nums" data-testid={`text-log-time-${log.id}`}>
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${log.isReverted ? "text-muted-foreground line-through" : "text-foreground"}`} data-testid={`text-log-desc-${log.id}`}>
                  {buildDescription(log)}
                </p>
                {log.isReverted && log.revertedBy && log.revertedAt ? (
                  <p className="text-xs text-muted-foreground" data-testid={`text-log-revertinfo-${log.id}`}>
                    أُرجع بواسطة {log.revertedBy} في {formatDateTime(log.revertedAt)}
                  </p>
                ) : null}
              </div>
              {canRevert(log) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs gap-1"
                  disabled={revertingId === log.id}
                  onClick={() => handleRevert(log)}
                  data-testid={`button-revert-${log.id}`}
                >
                  <RotateCcw className="h-3 w-3" />
                  رجوع
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
