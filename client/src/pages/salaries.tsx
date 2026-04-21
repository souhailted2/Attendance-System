import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Search, Banknote } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  employeeCode: string;
  baseSalary?: string;
  isActive: boolean;
};

export default function Salaries() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const mutation = useMutation({
    mutationFn: ({ id, baseSalary }: { id: string; baseSalary: string }) =>
      apiRequest("PATCH", `/api/employees/${id}/salary`, { baseSalary }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "تم حفظ الراتب بنجاح" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const activeEmployees = employees.filter(e => e.isActive);
  const filtered = activeEmployees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeCode.includes(search)
  );

  function handleEdit(id: string, val: string) {
    setEditing(prev => ({ ...prev, [id]: val }));
  }

  function handleSave(emp: Employee) {
    const val = editing[emp.id] ?? emp.baseSalary ?? "0";
    if (!val || isNaN(parseFloat(val))) {
      toast({ title: "قيمة غير صالحة", variant: "destructive" });
      return;
    }
    mutation.mutate({ id: emp.id, baseSalary: val });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,hsl(43 96% 52%),hsl(36 90% 58%))", boxShadow: isDark ? "0 3px 12px hsl(43 96% 52%/0.15)" : "0 3px 12px hsl(43 96% 52%/0.35)" }}>
          <Banknote className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">رواتب الموظفين</h1>
          <p className="text-sm text-muted-foreground">تحديد الراتب الأساسي لكل موظف</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pr-9"
          placeholder="ابحث بالاسم أو الرمز..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-salary"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b">
                <th className="px-4 py-3 text-right font-medium">الموظف</th>
                <th className="px-4 py-3 text-right font-medium">الرمز</th>
                <th className="px-4 py-3 text-right font-medium">الراتب الأساسي (دج)</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const currentVal = editing[emp.id] ?? emp.baseSalary ?? "0";
                const isSaving = mutation.isPending && mutation.variables?.id === emp.id;
                return (
                  <tr key={emp.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                    data-testid={`row-employee-${emp.id}`}>
                    <td className="px-4 py-3 font-medium">{emp.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono">{emp.employeeCode}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        className="w-40"
                        value={currentVal}
                        onChange={e => handleEdit(emp.id, e.target.value)}
                        data-testid={`input-salary-${emp.id}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        onClick={() => handleSave(emp)}
                        disabled={isSaving}
                        data-testid={`button-save-salary-${emp.id}`}
                      >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        <span className="mr-1">حفظ</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">لا يوجد موظفون</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
