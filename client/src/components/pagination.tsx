import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  itemLabel?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize, itemLabel }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = totalItems != null && pageSize != null ? (currentPage - 1) * pageSize + 1 : null;
  const to = totalItems != null && pageSize != null ? Math.min(currentPage * pageSize, totalItems) : null;

  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  }

  return (
    <div className="flex flex-col items-center gap-2 pt-3" dir="rtl" data-testid="pagination">
      {totalItems != null && from != null && to != null && (
        <p className="text-xs text-muted-foreground" data-testid="text-pagination-count">
          عرض {from}–{to} من أصل {totalItems}{itemLabel ? ` ${itemLabel}` : ""}
        </p>
      )}
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          data-testid="button-page-prev"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
          ) : (
            <Button
              key={p}
              size="icon"
              variant={p === currentPage ? "default" : "outline"}
              className="h-8 w-8 text-xs"
              onClick={() => onPageChange(p as number)}
              data-testid={`button-page-${p}`}
            >
              {p}
            </Button>
          )
        )}

        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          data-testid="button-page-next"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
