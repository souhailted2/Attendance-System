import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  count?: number;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumb, count, action }: PageHeaderProps) {
  return (
    <div className="page-header-glass px-6 py-4 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-10">
      <div className="min-w-0">
        {breadcrumb && (
          <div className="text-[11px] text-muted-foreground mb-0.5 flex items-center gap-1">{breadcrumb}</div>
        )}
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-semibold text-foreground leading-tight truncate" data-testid="text-page-title">
            {title}
          </h1>
          {count !== undefined && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums bg-primary/10 text-primary">
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
