import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportData() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<any>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/attendance", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Import failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: data.message });
    },
    onError: (err: Error) => toast({ title: "خطأ في الاستيراد", description: err.message, variant: "destructive" }),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setResult(null);
      importMutation.mutate(file);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-page-title">استيراد البيانات</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">استيراد سجلات الحضور من ملف CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-md p-8 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              اسحب ملف CSV هنا أو انقر لاختيار ملف
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file-upload"
            />
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={importMutation.isPending}
              data-testid="button-choose-file"
            >
              <FileText className="h-4 w-4 ml-2" />
              {importMutation.isPending ? "جاري الاستيراد..." : "اختيار ملف"}
            </Button>
          </div>

          <div className="bg-accent/30 rounded-md p-4">
            <p className="text-sm font-medium mb-2">صيغة الملف المطلوبة:</p>
            <p className="text-xs text-muted-foreground">
              يجب أن يحتوي الملف على الأعمدة التالية: employee_code (أو code)، date، check_in (اختياري)، check_out (اختياري)
            </p>
            <div className="mt-2 bg-background rounded p-3 text-xs font-mono direction-ltr text-left">
              employee_code,date,check_in,check_out<br />
              EMP001,2026-03-01,07:00,15:00<br />
              EMP002,2026-03-01,07:15,15:00
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {result.errors?.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-chart-5" />
              ) : (
                <CheckCircle className="h-5 w-5 text-chart-2" />
              )}
              نتائج الاستيراد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-accent/30 rounded-md">
                <p className="text-2xl font-bold text-chart-2" data-testid="text-imported">{result.imported}</p>
                <p className="text-xs text-muted-foreground">تم استيرادها</p>
              </div>
              <div className="text-center p-3 bg-accent/30 rounded-md">
                <p className="text-2xl font-bold text-chart-5" data-testid="text-skipped">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">تم تخطيها</p>
              </div>
              {result.duplicates !== undefined && (
                <div className="text-center p-3 bg-accent/30 rounded-md">
                  <p className="text-2xl font-bold" data-testid="text-duplicates">{result.duplicates}</p>
                  <p className="text-xs text-muted-foreground">مكررة</p>
                </div>
              )}
            </div>
            {result.errors?.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">أخطاء:</p>
                {result.errors.map((err: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
