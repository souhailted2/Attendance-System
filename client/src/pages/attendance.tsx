import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, ClipboardCheck, UserCheck, UserX, Clock, CalendarDays } from "lucide-react";
import type { Employee, AttendanceRecord } from "@shared/schema";

export default function Attendance() {
  const { toast } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");

  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: attendance, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance", `?date=${date}`],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/attendance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "تم تسجيل الحضور بنجاح" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/attendance/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "تم تحديث السجل" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  function resetForm() {
    setEmployeeId(""); setCheckIn(""); setCheckOut(""); setStatus("present"); setNotes("");
    setEditingRecord(null);
  }

  function openEdit(record: AttendanceRecord) {
    setEditingRecord(record);
    setEmployeeId(record.employeeId);
    setCheckIn(record.checkIn || "");
    setCheckOut(record.checkOut || "");
    setStatus(record.status);
    setNotes(record.notes || "");
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: { checkIn, checkOut, status, notes } });
    } else {
      createMutation.mutate({ employeeId, date, checkIn, checkOut, status, notes });
    }
  }

  const activeEmployees = employees?.filter((e) => e.isActive) || [];

  const statusLabel = (s: string) => {
    switch (s) {
      case "present": return "حاضر";
      case "late": return "متأخر";
      case "absent": return "غائب";
      case "leave": return "إجازة";
      default: return s;
    }
  };

  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (s) {
      case "present": return "default";
      case "late": return "secondary";
      case "absent": return "destructive";
      case "leave": return "outline";
      default: return "secondary";
    }
  };

  const presentCount = attendance?.filter((r) => r.status === "present").length || 0;
  const lateCount = attendance?.filter((r) => r.status === "late").length || 0;
  const absentCount = attendance?.filter((r) => r.status === "absent").length || 0;
  const leaveCount = attendance?.filter((r) => r.status === "leave").length || 0;

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("ar-SA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">سجل الحضور</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-48"
            data-testid="input-attendance-date"
          />
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-attendance">
                <Plus className="h-4 w-4 ml-2" />
                تسجيل حضور
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRecord ? "تعديل السجل" : "تسجيل حضور جديد"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingRecord && (
                  <div className="space-y-2">
                    <Label>الموظف *</Label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger data-testid="select-employee"><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                      <SelectContent>
                        {activeEmployees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name} ({e.employeeCode})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وقت الحضور</Label>
                    <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} data-testid="input-checkin" />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت الانصراف</Label>
                    <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} data-testid="input-checkout" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">حاضر</SelectItem>
                      <SelectItem value="late">متأخر</SelectItem>
                      <SelectItem value="absent">غائب</SelectItem>
                      <SelectItem value="leave">إجازة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-notes" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setOpen(false); resetForm(); }}>إلغاء</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-attendance">
                    {editingRecord ? "تحديث" : "تسجيل"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary stats */}
      {!isLoading && attendance && attendance.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">حاضر</p>
                <p className="text-xl font-bold">{presentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-chart-5/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-chart-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">متأخر</p>
                <p className="text-xl font-bold">{lateCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <UserX className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">غائب</p>
                <p className="text-xl font-bold">{absentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-4 w-4 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجازة</p>
                <p className="text-xl font-bold">{leaveCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !attendance || attendance.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد سجلات حضور لهذا التاريخ</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">الحضور</TableHead>
                    <TableHead className="text-right">الانصراف</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التأخير</TableHead>
                    <TableHead className="text-right">الساعات</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => {
                    const emp = employees?.find((e) => e.id === record.employeeId);
                    return (
                      <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{emp?.name || "غير معروف"}</p>
                            <p className="text-xs text-muted-foreground">{emp?.employeeCode}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{record.checkIn || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{record.checkOut || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(record.status)}>
                            {statusLabel(record.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.lateMinutes > 0
                            ? <span className="text-chart-5 font-medium">{record.lateMinutes} د</span>
                            : "-"}
                        </TableCell>
                        <TableCell>{record.totalHours || "0"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{record.notes || "-"}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(record)} data-testid={`button-edit-attendance-${record.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
