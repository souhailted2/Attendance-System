import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RowActions } from "@/components/row-actions";

interface CrudPageProps {
  title: string;
  apiPath: string;
  icon: LucideIcon;
  fields: { key: string; label: string; type?: string; required?: boolean }[];
}

export default function CrudPage({ title, apiPath, icon: Icon, fields }: CrudPageProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: items, isLoading } = useQuery<any[]>({ queryKey: [apiPath] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", apiPath, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      toast({ title: `تم الإضافة بنجاح` });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `${apiPath}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      toast({ title: "تم التحديث بنجاح" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `${apiPath}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      toast({ title: "تم الحذف بنجاح" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function resetForm() {
    setFormData({});
    setEditingItem(null);
  }

  function openEdit(item: any) {
    setEditingItem(item);
    const data: Record<string, string> = {};
    fields.forEach((f) => { data[f.key] = item[f.key] || ""; });
    setFormData(data);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-item">
                <Plus className="h-4 w-4 ml-2" />
                إضافة
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "تعديل" : "إضافة جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type || "text"}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    required={field.required}
                    data-testid={`input-${field.key}`}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => { setOpen(false); resetForm(); }}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingItem ? "تحديث" : "إضافة"}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6 space-y-6">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !items || items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item: any) => (
            <Card key={item.id} data-testid={`card-item-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{item[fields[0].key]}</p>
                      {fields[1] && item[fields[1].key] && (
                        <p className="text-xs text-muted-foreground truncate">{item[fields[1].key]}</p>
                      )}
                    </div>
                  </div>
                  <RowActions
                    testId={`button-actions-${item.id}`}
                    actions={[
                      {
                        label: "تعديل",
                        icon: <Pencil className="h-3.5 w-3.5" />,
                        onClick: () => openEdit(item),
                      },
                      {
                        label: "حذف",
                        icon: <Trash2 className="h-3.5 w-3.5" />,
                        onClick: () => deleteMutation.mutate(item.id),
                        destructive: true,
                        confirmTitle: "تأكيد الحذف",
                        confirmDescription: "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.",
                      },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
