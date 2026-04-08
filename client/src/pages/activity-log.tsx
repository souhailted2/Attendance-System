import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { ActivityLog } from "@shared/schema";

const ADMIN_USERNAME = "bachir tedjani";

function getActionLabel(method: string, path: string): string {
  if (method === "ACTION") return "عملية أرشيف";
  const clean = path.replace(/\/[a-f0-9\-]{36}/g, "").replace(/\/$/, "");
  const map: Record<string, Record<string, string>> = {
    POST: {
      "/api/employees": "إضافة موظف",
      "/api/companies": "إضافة شركة",
      "/api/workshops": "إضافة ورشة",
      "/api/positions": "إضافة منصب",
      "/api/work-rules": "إضافة قاعدة عمل",
      "/api/attendance": "تسجيل حضور",
      "/api/attendance/import": "استيراد حضور",
      "/api/devices": "إضافة جهاز",
      "/api/agent/attendance": "رفع حضور (وكيل)",
      "/api/frozen-archives": "حفظ تقرير",
    },
    PATCH: {
      "/api/employees": "تعديل موظف",
      "/api/companies": "تعديل شركة",
      "/api/workshops": "تعديل ورشة",
      "/api/positions": "تعديل منصب",
      "/api/work-rules": "تعديل قاعدة عمل",
      "/api/attendance": "تعديل حضور",
      "/api/devices": "تعديل جهاز",
    },
    DELETE: {
      "/api/employees": "حذف موظف",
      "/api/companies": "حذف شركة",
      "/api/workshops": "حذف ورشة",
      "/api/positions": "حذف منصب",
      "/api/work-rules": "حذف قاعدة عمل",
      "/api/attendance": "حذف حضور",
      "/api/devices": "حذف جهاز",
      "/api/frozen-archives": "إلغاء حفظ تقرير",
    },
    PUT: {
      "/api/employees": "تعديل موظف",
    },
  };
  return map[method]?.[clean] ?? `${method} ${path}`;
}

function methodBadge(method: string) {
  const colors: Record<string, string> = {
    POST: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    PATCH: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    PUT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    ACTION: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  const labels: Record<string, string> = {
    POST: "إضافة",
    PATCH: "تعديل",
    PUT: "تعديل",
    DELETE: "حذف",
    ACTION: "أرشيف",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[method] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labels[method] ?? method}
    </span>
  );
}

function statusBadge(code: number) {
  const ok = code >= 200 && code < 300;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ok ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
    >
      {code}
    </span>
  );
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-DZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.username !== ADMIN_USERNAME) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
    refetchInterval: 30_000,
  });

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
        <div className="rounded-lg border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm" data-testid="table-activity-logs">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="py-3 px-4 text-right font-medium">الوقت</th>
                <th className="py-3 px-4 text-right font-medium">المستخدم</th>
                <th className="py-3 px-4 text-right font-medium">العملية</th>
                <th className="py-3 px-4 text-right font-medium">التفاصيل</th>
                <th className="py-3 px-4 text-right font-medium">المسار</th>
                <th className="py-3 px-4 text-right font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log, idx) => (
                <tr
                  key={log.id}
                  className={`${idx % 2 === 0 ? "bg-background" : "bg-muted/30"} ${log.method === "ACTION" ? "border-r-2 border-r-purple-400 dark:border-r-purple-600" : ""}`}
                  data-testid={`row-log-${log.id}`}
                >
                  <td className="py-3 px-4 text-muted-foreground tabular-nums text-xs" data-testid={`text-log-time-${log.id}`}>
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-medium" data-testid={`text-log-user-${log.id}`}>
                    {log.username ?? "—"}
                  </td>
                  <td className="py-3 px-4" data-testid={`text-log-action-${log.id}`}>
                    <div className="flex items-center gap-2">
                      {methodBadge(log.method)}
                      <span>{getActionLabel(log.method, log.path)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs" data-testid={`text-log-details-${log.id}`}>
                    {log.details ? (
                      <span className="text-xs text-foreground leading-relaxed">{log.details}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs" data-testid={`text-log-path-${log.id}`}>
                    {log.path}
                  </td>
                  <td className="py-3 px-4" data-testid={`badge-log-status-${log.id}`}>
                    {statusBadge(log.statusCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
