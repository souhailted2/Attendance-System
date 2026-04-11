import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  count?: number;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, count, action }: PageHeaderProps) {
  return (
    <div
      className="px-6 py-4 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-10"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 3px rgba(109,40,217,0.04)",
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-semibold text-foreground leading-tight truncate">{title}</h1>
          {count !== undefined && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums"
              style={{
                background: "hsl(271 76% 45% / 0.10)",
                color: "hsl(271 76% 45%)",
              }}
            >
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0">{action}</div>
      )}
    </div>
  );
}
