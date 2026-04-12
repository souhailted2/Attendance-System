import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface RowAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  disabled?: boolean;
}

interface RowActionsProps {
  actions: RowAction[];
  testId?: string;
}

export function RowActions({ actions, testId }: RowActionsProps) {
  const [confirmAction, setConfirmAction] = useState<RowAction | null>(null);

  function handleClick(action: RowAction) {
    if (action.destructive) {
      setConfirmAction(action);
    } else {
      action.onClick();
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            data-testid={testId}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" dir="rtl">
          {actions.map((action, i) => (
            <span key={action.label}>
              {i > 0 && action.destructive && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleClick(action); }}
                className={action.destructive ? "text-destructive focus:text-destructive focus:bg-destructive/10" : ""}
                disabled={action.disabled}
                data-testid={`menu-${action.label}`}
              >
                {action.icon && <span className="ml-2 flex-shrink-0">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            </span>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.confirmTitle ?? "تأكيد"}</AlertDialogTitle>
            {confirmAction?.confirmDescription && (
              <AlertDialogDescription>{confirmAction.confirmDescription}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              data-testid="button-confirm-action"
              onClick={() => { confirmAction?.onClick(); setConfirmAction(null); }}
            >
              {confirmAction?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
