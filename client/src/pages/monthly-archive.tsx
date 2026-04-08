import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Archive, Sun, Moon, Star, Wrench, Users, Trash2, Calendar, Search, X,
  ChevronRight, ChevronLeft, SlidersHorizontal, CheckSquare, Square,
  Lock, LockOpen, Save, RotateCcw, CheckCheck, AlertCircle, Clock,
} from "lucide-react";
import type { WorkRule, Workshop } from "@shared/schema";

interface FrozenArchiveMeta {
  id: string;
  month: string;
  workshopId: string;
  workRuleId: string;
  frozenAt: string;
  frozenBy: string;
  reportJson: string;
}

interface DailyRecord {
  attendanceId: string | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  normalizedCheckIn: string | null;
  normalizedCheckOut: string | null;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  effectiveLateMinutes: number;
  effectiveEarlyLeaveMinutes: number;
  middleAbsenceMinutes?: number;
  totalHours: string | null;
  dailyScore: number;
  pending?: boolean;
  overtimeHours: number;
  staged?: boolean;
  stagedDelete?: boolean;
}

interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  workshopId: string;
  workshopName: string;
  workRuleId: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  attendanceScore: number;
  monthBonus?: number;
  normalizedTotalDays?: number;
  dailyRecords: DailyRecord[];
}

interface EditCell {
  employeeId: string;
  employeeName: string;
  date: string;
  record: DailyRecord;
  workshopName: string;
  ruleName: string;
}

interface PendingOp {
  id: string;
  type: "editCell" | "deleteCell" | "freeze" | "unfreeze";
  description: string;
  execute: () => Promise<void>;
  revert: () => void;
}

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getArabicDay(dateStr: string): string {
  return ARABIC_DAYS[new Date(dateStr + "T00:00:00").getDay()];
}

function getCellBg(status: string): string {
  if (status === "absent") return "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50";
  if (status === "holiday") return "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50";
  if (status === "leave") return "bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50";
  if (status === "late") return "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50";
  return "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50";
}

function getCellScoreColor(status: string, score: number): string {
  if (status === "absent") return "text-red-600 dark:text-red-400";
  if (status === "holiday") return "text-blue-600 dark:text-blue-400";
  if (status === "leave") return "text-purple-600 dark:text-purple-400";
  if (score >= 0.95) return "text-green-700 dark:text-green-400";
  if (score >= 0.80) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

function scoreColor(score: number, max: number): string {
  if (max === 0) return "text-muted-foreground";
  const ratio = score / max;
  if (ratio >= 0.95) return "text-green-600 dark:text-green-400 font-bold";
  if (ratio >= 0.8) return "text-amber-600 dark:text-amber-400 font-semibold";
  return "text-red-600 dark:text-red-400 font-semibold";
}

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return {
    from: `${monthStr}-01`,
    to: `${monthStr}-${String(last).padStart(2, "0")}`,
  };
}

const MONTH_NAMES = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const PAGE_SIZE = 5;

function arabicMonthName(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function formatArabicDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    return `${Number(parts[2])}/${Number(parts[1])}/${parts[0]}`;
  } catch { return dateStr; }
}

function applyLocalCellOverrides(
  emps: EmployeeReport[],
  overrides: Map<string, DailyRecord>,
): EmployeeReport[] {
  if (overrides.size === 0) return emps;
  return emps.map(emp => {
    const empPrefix = emp.employeeId + "_";
    const empKeys = Array.from(overrides.keys()).filter(k => k.startsWith(empPrefix));
    if (empKeys.length === 0) return emp;

    const origByDate = new Map<string, DailyRecord>(emp.dailyRecords.map(r => [r.date, r]));
    const datesToProcess = new Set<string>([
      ...emp.dailyRecords.map(r => r.date),
      ...empKeys.map(k => k.substring(empPrefix.length)),
    ]);

    const newRecords: DailyRecord[] = [];
    for (const date of Array.from(datesToProcess)) {
      const key = `${emp.employeeId}_${date}`;
      if (overrides.has(key)) {
        newRecords.push(overrides.get(key)!);
      } else {
        const orig = origByDate.get(date);
        if (orig) newRecords.push(orig);
      }
    }

    return { ...emp, dailyRecords: newRecords.sort((a, b) => a.date.localeCompare(b.date)) };
  });
}

export default function MonthlyArchive() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && user.username !== "bachir tedjani") {
      navigate("/");
    }
  }, [user, navigate]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonthNum, setSelectedMonthNum] = useState(() => new Date().getMonth() + 1);
  const selectedMonth = `${selectedYear}-${String(selectedMonthNum).padStart(2, "0")}`;
  const { from: dateFrom, to: dateTo } = useMemo(() => monthBounds(selectedMonth), [selectedMonth]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i), [currentYear]);

  function prevMonth() {
    if (selectedMonthNum === 1) {
      if (selectedYear <= 2020) return;
      setSelectedMonthNum(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonthNum(m => m - 1);
    }
  }
  function nextMonth() {
    if (selectedMonthNum === 12) {
      if (selectedYear >= currentYear + 1) return;
      setSelectedMonthNum(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonthNum(m => m + 1);
    }
  }

  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [selectedWorkshopIds, setSelectedWorkshopIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const [editCell, setEditCell] = useState<EditCell | null>(null);
  const [editForm, setEditForm] = useState({ status: "present", checkIn: "", checkOut: "" });

  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);
  const [localCellOverrides, setLocalCellOverrides] = useState<Map<string, DailyRecord>>(new Map());
  const [localFreezeOverrides, setLocalFreezeOverrides] = useState<Map<string, FrozenArchiveMeta | null>>(new Map());
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setLocalCellOverrides(new Map());
    setLocalFreezeOverrides(new Map());
    setPendingOps([]);
  }, [selectedMonth]);

  const { data: workRules = [] } = useQuery<WorkRule[]>({ queryKey: ["/api/work-rules"] });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });

  const { data: frozenList = [] } = useQuery<FrozenArchiveMeta[]>({
    queryKey: ["/api/frozen-archives", selectedMonth],
    queryFn: async () => {
      const r = await fetch(`/api/frozen-archives?month=${selectedMonth}`, { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  function getFrozen(workshopId: string | undefined, workRuleId: string): FrozenArchiveMeta | undefined {
    return frozenList.find((f) => f.workshopId === (workshopId ?? "") && f.workRuleId === workRuleId);
  }

  const reportUrl = `/api/reports/range?from=${dateFrom}&to=${dateTo}`;
  const { data: reportData = [], isLoading } = useQuery<EmployeeReport[]>({
    queryKey: ["/api/reports/range", dateFrom, dateTo],
    queryFn: async () => {
      const res = await fetch(reportUrl);
      if (!res.ok) throw new Error("فشل تحميل التقرير");
      return res.json();
    },
    enabled: !!dateFrom && !!dateTo,
  });

  function stageEditCell(ec: EditCell, ef: { status: string; checkIn: string; checkOut: string }) {
    const key = `${ec.employeeId}_${ec.date}`;
    const hadPrev = localCellOverrides.has(key);
    const prevVal = localCellOverrides.get(key);

    const newRecord: DailyRecord = {
      ...ec.record,
      status: ef.status,
      checkIn: ef.checkIn || null,
      checkOut: ef.checkOut || null,
      staged: true,
      stagedDelete: false,
    };

    setLocalCellOverrides(prev => new Map(prev).set(key, newRecord));

    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const description = `قام ${user?.username ?? "المستخدم"} بتعديل حضور الموظف ${ec.employeeName} بتاريخ ${formatArabicDate(ec.date)} في ورشة ${ec.workshopName} (${ec.ruleName}) يوم ${todayStr}`;

    const opId = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const attendanceId = ec.record.attendanceId;
    const employeeId = ec.employeeId;
    const date = ec.date;
    const status = ef.status;
    const checkIn = ef.checkIn || null;
    const checkOut = ef.checkOut || null;

    setPendingOps(prev => [...prev, {
      id: opId,
      type: "editCell",
      description,
      execute: async () => {
        if (attendanceId) {
          await apiRequest("PATCH", `/api/attendance/${attendanceId}`, { status, checkIn, checkOut });
        } else {
          await apiRequest("POST", `/api/attendance`, { employeeId, date, status, checkIn, checkOut });
        }
      },
      revert: () => {
        setLocalCellOverrides(prev => {
          const m = new Map(prev);
          if (!hadPrev) m.delete(key);
          else m.set(key, prevVal!);
          return m;
        });
      },
    }]);
  }

  function stageDeleteCell(ec: EditCell) {
    if (!ec.record.attendanceId) return;

    const key = `${ec.employeeId}_${ec.date}`;
    const hadPrev = localCellOverrides.has(key);
    const prevVal = localCellOverrides.get(key);

    const deleteRecord: DailyRecord = { ...ec.record, staged: true, stagedDelete: true };
    setLocalCellOverrides(prev => new Map(prev).set(key, deleteRecord));

    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const description = `قام ${user?.username ?? "المستخدم"} بحذف سجل حضور الموظف ${ec.employeeName} بتاريخ ${formatArabicDate(ec.date)} في ورشة ${ec.workshopName} (${ec.ruleName}) يوم ${todayStr}`;

    const opId = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const attendanceId = ec.record.attendanceId;

    setPendingOps(prev => [...prev, {
      id: opId,
      type: "deleteCell",
      description,
      execute: async () => {
        await apiRequest("DELETE", `/api/attendance/${attendanceId}`);
      },
      revert: () => {
        setLocalCellOverrides(prev => {
          const m = new Map(prev);
          if (!hadPrev) m.delete(key);
          else m.set(key, prevVal!);
          return m;
        });
      },
    }]);
  }

  function stageFreeze(
    workshopId: string,
    workRuleId: string,
    workshopName: string,
    ruleName: string,
    snapshotEmps: EmployeeReport[],
  ) {
    const key = `${workshopId}_${workRuleId}`;
    const hadPrev = localFreezeOverrides.has(key);
    const prevVal = localFreezeOverrides.get(key);

    const pendingMeta: FrozenArchiveMeta = {
      id: "pending-" + Date.now(),
      month: selectedMonth,
      workshopId,
      workRuleId,
      frozenAt: new Date().toISOString(),
      frozenBy: user?.username ?? "المستخدم",
      reportJson: JSON.stringify(snapshotEmps),
    };

    setLocalFreezeOverrides(prev => new Map(prev).set(key, pendingMeta));

    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const description = `قام ${user?.username ?? "المستخدم"} بحفظ جدول ورشة ${workshopName} الفترة ${ruleName} بتاريخ ${todayStr}`;

    const opId = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const month = selectedMonth;
    const snapJson = JSON.stringify(snapshotEmps);

    setPendingOps(prev => [...prev, {
      id: opId,
      type: "freeze",
      description,
      execute: async () => {
        await apiRequest("POST", "/api/frozen-archives", { month, workshopId, workRuleId, reportJson: snapJson });
      },
      revert: () => {
        setLocalFreezeOverrides(prev => {
          const m = new Map(prev);
          if (!hadPrev) m.delete(key);
          else m.set(key, prevVal ?? null);
          return m;
        });
      },
    }]);
  }

  function stageUnfreeze(frozen: FrozenArchiveMeta, workshopName: string, ruleName: string) {
    const key = `${frozen.workshopId}_${frozen.workRuleId}`;
    const hadPrev = localFreezeOverrides.has(key);
    const prevVal = localFreezeOverrides.get(key);

    setLocalFreezeOverrides(prev => new Map(prev).set(key, null));

    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const description = `قام ${user?.username ?? "المستخدم"} بإلغاء حفظ جدول ورشة ${workshopName} الفترة ${ruleName} بتاريخ ${todayStr}`;

    const opId = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const frozenId = frozen.id;

    setPendingOps(prev => [...prev, {
      id: opId,
      type: "unfreeze",
      description,
      execute: async () => {
        await apiRequest("DELETE", `/api/frozen-archives/${frozenId}`);
      },
      revert: () => {
        setLocalFreezeOverrides(prev => {
          const m = new Map(prev);
          if (!hadPrev) m.delete(key);
          else m.set(key, prevVal ?? null);
          return m;
        });
      },
    }]);
  }

  function handleUndo() {
    if (pendingOps.length === 0) return;
    const lastOp = pendingOps[pendingOps.length - 1];
    lastOp.revert();
    setPendingOps(prev => prev.slice(0, -1));
  }

  async function handleConfirm() {
    if (pendingOps.length === 0 || isConfirming) return;
    setIsConfirming(true);

    const opsCopy = [...pendingOps];
    let failed = false;
    let processedCount = 0;

    for (const op of opsCopy) {
      try {
        await op.execute();
        // Remove this op from queue immediately so a retry won't re-run it
        setPendingOps(prev => prev.slice(1));
        processedCount++;
        // Log the action (non-critical — fire and forget, don't block or fail on log error)
        apiRequest("POST", "/api/archive-action", { description: op.description }).catch(() => {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "خطأ غير معروف";
        toast({ title: "خطأ في التنفيذ", description: msg, variant: "destructive" });
        failed = true;
        break;
      }
    }

    if (!failed) {
      toast({ title: "تم تطبيق التغييرات", description: `تم تنفيذ ${processedCount} عملية بنجاح` });
      setLocalCellOverrides(new Map());
      setLocalFreezeOverrides(new Map());
    } else if (processedCount > 0) {
      toast({
        title: "تطبيق جزئي",
        description: `تم تنفيذ ${processedCount} من ${opsCopy.length} عملية. التغييرات المتبقية لا تزال في القائمة.`,
        variant: "destructive",
      });
    }

    queryClient.invalidateQueries({ queryKey: ["/api/reports/range"] });
    queryClient.invalidateQueries({ queryKey: ["/api/frozen-archives", selectedMonth] });
    queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
    setIsConfirming(false);
  }

  function openEditCell(emp: EmployeeReport, date: string, rec: DailyRecord, workshopName: string, ruleName: string) {
    if (rec.staged) return;
    setEditCell({ employeeId: emp.employeeId, employeeName: emp.employeeName, date, record: rec, workshopName, ruleName });
    setEditForm({
      status: rec.status === "holiday" ? "present" : rec.status,
      checkIn: rec.checkIn ?? "",
      checkOut: rec.checkOut ?? "",
    });
  }

  function handleSave() {
    if (!editCell) return;
    stageEditCell(editCell, editForm);
    setEditCell(null);
    toast({ title: "تمت إضافة التعديل", description: "اضغط «تأكيد التغييرات» لحفظه في قاعدة البيانات" });
  }

  function handleDelete() {
    if (!editCell?.record.attendanceId) return;
    stageDeleteCell(editCell);
    setEditCell(null);
    toast({ title: "تمت إضافة الحذف", description: "اضغط «تأكيد التغييرات» لتطبيقه" });
  }

  const allDates = useMemo(() => {
    const s = new Set<string>();
    for (const emp of reportData) for (const r of emp.dailyRecords) s.add(r.date);
    return Array.from(s).sort();
  }, [reportData]);

  const grouped = useMemo(() => {
    const byRule = new Map<string, { rule: WorkRule; workshops: { workshop: Workshop | undefined; emps: EmployeeReport[] }[] }>();

    for (const emp of reportData) {
      const rule = workRules.find(r => r.id === emp.workRuleId);
      if (!rule) continue;
      if (!byRule.has(emp.workRuleId)) {
        byRule.set(emp.workRuleId, { rule, workshops: [] });
      }
      const ruleGroup = byRule.get(emp.workRuleId)!;
      let wsGroup = ruleGroup.workshops.find(w => w.workshop?.id === emp.workshopId);
      if (!wsGroup) {
        wsGroup = { workshop: workshops.find(w => w.id === emp.workshopId), emps: [] };
        ruleGroup.workshops.push(wsGroup);
      }
      wsGroup.emps.push(emp);
    }
    return Array.from(byRule.values());
  }, [reportData, workRules, workshops]);

  const filteredBySelection = useMemo(() => {
    const noRuleFilter = selectedRuleIds.size === 0;
    const noWsFilter = selectedWorkshopIds.size === 0;
    if (noRuleFilter && noWsFilter) return grouped;
    return grouped
      .filter(({ rule }) => noRuleFilter || selectedRuleIds.has(rule.id))
      .map(({ rule, workshops: wsGroups }) => ({
        rule,
        workshops: wsGroups.filter((ws: { workshop: Workshop | undefined; emps: EmployeeReport[] }) =>
          noWsFilter || selectedWorkshopIds.has(ws.workshop?.id ?? "")
        ),
      }))
      .filter((g) => g.workshops.length > 0);
  }, [grouped, selectedRuleIds, selectedWorkshopIds]);

  const availableWorkshops = useMemo(() => {
    const source = selectedRuleIds.size === 0
      ? grouped
      : grouped.filter((g) => selectedRuleIds.has(g.rule.id));
    const wsMap = new Map<string, Workshop>();
    for (const g of source)
      for (const ws of g.workshops)
        if (ws.workshop) wsMap.set(ws.workshop.id, ws.workshop);
    return Array.from(wsMap.values());
  }, [grouped, selectedRuleIds]);

  const availableRules = useMemo(() => grouped.map((g) => g.rule), [grouped]);

  const activeFilterCount = (selectedRuleIds.size > 0 ? 1 : 0) + (selectedWorkshopIds.size > 0 ? 1 : 0);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return filteredBySelection;
    return filteredBySelection
      .map(({ rule, workshops: wsGroups }) => {
        const filteredWs = wsGroups
          .map((wsGroup: { workshop: Workshop | undefined; emps: EmployeeReport[] }) => {
            const wsMatch = wsGroup.workshop?.name.toLowerCase().includes(q);
            const filteredEmps = wsMatch
              ? wsGroup.emps
              : wsGroup.emps.filter(
                  (e) =>
                    e.employeeName.toLowerCase().includes(q) ||
                    e.employeeCode.toLowerCase().includes(q)
                );
            return { ...wsGroup, emps: filteredEmps };
          })
          .filter((ws) => ws.emps.length > 0);
        return { rule, workshops: filteredWs };
      })
      .filter((g) => g.workshops.length > 0);
  }, [filteredBySelection, searchTerm]);

  useEffect(() => { setPage(0); }, [searchTerm, selectedMonth, selectedRuleIds, selectedWorkshopIds]);

  const flatTables = useMemo(() =>
    filtered.flatMap(({ rule, workshops }) =>
      workshops.map((ws: { workshop: Workshop | undefined; emps: EmployeeReport[] }) => ({
        rule,
        workshop: ws.workshop,
        emps: ws.emps,
      }))
    ),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(flatTables.length / PAGE_SIZE));
  const pageSlice = flatTables.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const pageGrouped = useMemo(() => {
    const map = new Map<string, { rule: WorkRule; tables: { workshop: Workshop | undefined; emps: EmployeeReport[] }[] }>();
    for (const item of pageSlice) {
      if (!map.has(item.rule.id)) map.set(item.rule.id, { rule: item.rule, tables: [] });
      map.get(item.rule.id)!.tables.push({ workshop: item.workshop, emps: item.emps });
    }
    return Array.from(map.values());
  }, [pageSlice]);

  function renderTable(
    liveEmps: EmployeeReport[],
    ruleName: string,
    workshopName: string,
    workshopId: string | undefined,
    workRuleId: string,
  ) {
    const freezeKey = `${workshopId ?? ""}_${workRuleId}`;

    const effectiveFrozen: FrozenArchiveMeta | null = localFreezeOverrides.has(freezeKey)
      ? (localFreezeOverrides.get(freezeKey) ?? null)
      : (getFrozen(workshopId, workRuleId) ?? null);

    const isPendingFreeze = !!effectiveFrozen && effectiveFrozen.id.startsWith("pending-");
    const isPendingUnfreeze = localFreezeOverrides.has(freezeKey) && localFreezeOverrides.get(freezeKey) === null;

    const displayEmps: EmployeeReport[] = effectiveFrozen
      ? (JSON.parse(effectiveFrozen.reportJson) as EmployeeReport[])
      : applyLocalCellOverrides(liveEmps, localCellOverrides);

    const emps = displayEmps;
    const tableTotal = emps.reduce((s, r) => s + r.attendanceScore, 0);
    const tableMax = emps.reduce((s, r) => s + (r.normalizedTotalDays ?? r.totalDays), 0);
    const isOwner = user?.username === "bachir tedjani";

    const headerBg = effectiveFrozen
      ? (isPendingFreeze ? "bg-amber-50/80 dark:bg-amber-950/30" : "bg-emerald-50/80 dark:bg-emerald-950/30")
      : (isPendingUnfreeze ? "bg-amber-50/50 dark:bg-amber-950/20" : "bg-muted/30");

    function formatFrozenDate(iso: string) {
      try {
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
      } catch { return iso; }
    }

    return (
      <div className="overflow-x-auto rounded-lg border mb-6">
        <div className={`px-4 py-2 border-b flex items-center gap-2 ${headerBg}`}>
          {effectiveFrozen
            ? (isPendingFreeze
              ? <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              : <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />)
            : <Wrench className="h-4 w-4 text-primary" />}
          <span className="font-semibold text-sm">{workshopName}</span>
          <span className="text-muted-foreground text-xs">—</span>
          <span className="text-xs text-muted-foreground">{ruleName}</span>

          {effectiveFrozen ? (
            isPendingFreeze ? (
              <Badge className="mr-auto text-xs gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-700" variant="outline">
                <Clock className="h-3 w-3" />حفظ معلّق — في انتظار التأكيد
              </Badge>
            ) : (
              <Badge className="mr-auto text-xs gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700" variant="outline">
                <Lock className="h-3 w-3" />محفوظ — {formatFrozenDate(effectiveFrozen.frozenAt)} — بواسطة: {effectiveFrozen.frozenBy}
              </Badge>
            )
          ) : isPendingUnfreeze ? (
            <Badge className="mr-auto text-xs gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-700" variant="outline">
              <LockOpen className="h-3 w-3" />إلغاء حفظ معلّق — في انتظار التأكيد
            </Badge>
          ) : (
            <Badge variant="outline" className="mr-auto text-xs gap-1">
              <Users className="h-3 w-3" />{liveEmps.length} موظف
            </Badge>
          )}

          {effectiveFrozen && !isPendingFreeze && isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
              onClick={() => stageUnfreeze(effectiveFrozen, workshopName, ruleName)}
              disabled={isConfirming}
              data-testid={`button-unfreeze-${workshopId}-${workRuleId}`}
            >
              <LockOpen className="h-3.5 w-3.5" />
              إلغاء الحفظ
            </Button>
          )}
          {!effectiveFrozen && isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
              onClick={() => stageFreeze(workshopId ?? "", workRuleId, workshopName, ruleName, emps)}
              disabled={isConfirming || liveEmps.length === 0}
              data-testid={`button-freeze-${workshopId}-${workRuleId}`}
            >
              <Save className="h-3.5 w-3.5" />
              حفظ التقرير
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 bg-muted/20">
              <TableHead className="text-right sticky right-0 bg-muted/20 z-10 min-w-[130px] font-bold">الموظف</TableHead>
              <TableHead className="text-center min-w-[60px] font-bold text-xs">الرقم</TableHead>
              {allDates.map((d) => {
                const isWeekend = [5, 6].includes(new Date(d + "T00:00:00").getDay());
                return (
                  <TableHead key={d} className={`text-center min-w-[76px] px-0.5 py-1 ${isWeekend ? "bg-blue-50/80 dark:bg-blue-950/20" : ""}`}>
                    <div className="text-[10px] text-muted-foreground leading-tight">{getArabicDay(d)}</div>
                    <div className="text-xs font-mono font-medium leading-tight">{d.slice(5).replace("-", "/")}</div>
                  </TableHead>
                );
              })}
              <TableHead className="text-center min-w-[90px] font-bold bg-muted/20 sticky left-0 z-10">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emps.map((r) => {
              const byDate = new Map<string, DailyRecord>();
              for (const rec of r.dailyRecords) byDate.set(rec.date, rec);

              return (
                <TableRow key={r.employeeId} className="hover:bg-transparent" data-testid={`row-archive-${r.employeeId}`}>
                  <TableCell className="font-medium sticky right-0 bg-background z-10 border-l">{r.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground text-xs text-center">{r.employeeCode}</TableCell>
                  {allDates.map((d) => {
                    const rec = byDate.get(d);
                    if (!rec) {
                      const syntheticRec: DailyRecord = {
                        attendanceId: null, date: d, checkIn: null, checkOut: null,
                        normalizedCheckIn: null, normalizedCheckOut: null, status: "absent",
                        lateMinutes: 0, earlyLeaveMinutes: 0, effectiveLateMinutes: 0,
                        effectiveEarlyLeaveMinutes: 0, totalHours: null, dailyScore: 0,
                        pending: false, overtimeHours: 0, staged: false, stagedDelete: false,
                      };
                      return (
                        <TableCell key={d} className="p-0">
                          <button
                            className={`w-full min-h-[52px] flex items-center justify-center text-muted-foreground text-xs transition-colors ${effectiveFrozen ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/40"}`}
                            onClick={() => {
                              if (effectiveFrozen) { toast({ title: "مقفل 🔒", description: "هذا التقرير محفوظ ومقفل" }); return; }
                              openEditCell(r, d, syntheticRec, workshopName, ruleName);
                            }}
                            data-testid={`button-edit-archive-${r.employeeId}-${d}`}
                          >—</button>
                        </TableCell>
                      );
                    }

                    const bgClass = getCellBg(rec.status);
                    const scoreColorClass = getCellScoreColor(rec.status, rec.dailyScore);
                    const isStagedDelete = rec.stagedDelete === true;
                    const isStaged = rec.staged === true;
                    const cellRingClass = isStaged
                      ? isStagedDelete
                        ? "ring-2 ring-inset ring-red-400 dark:ring-red-600 opacity-60"
                        : "ring-2 ring-inset ring-amber-400 dark:ring-amber-500"
                      : "";

                    return (
                      <TableCell key={d} className="p-0" data-testid={`cell-archive-${r.employeeId}-${d}`}>
                        <button
                          className={`w-full min-h-[52px] px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${bgClass} ${cellRingClass} ${(effectiveFrozen || isStagedDelete) ? "cursor-not-allowed" : isStaged ? "cursor-default" : "cursor-pointer"}`}
                          onClick={() => {
                            if (effectiveFrozen) { toast({ title: "مقفل 🔒", description: "هذا التقرير محفوظ ومقفل" }); return; }
                            if (isStagedDelete) { toast({ title: "معلّق للحذف", description: "اضغط تراجع لإلغاء هذا الحذف" }); return; }
                            if (isStaged) { toast({ title: "معلّق للتعديل", description: "اضغط تراجع لإلغاء هذا التعديل" }); return; }
                            openEditCell(r, d, rec, workshopName, ruleName);
                          }}
                          title={`${r.employeeName} — ${d}\nالحالة: ${rec.status}\nدخول: ${rec.checkIn ?? "—"} | خروج: ${rec.checkOut ?? "—"}${rec.middleAbsenceMinutes && rec.middleAbsenceMinutes > 0 ? `\nغياب وسط الفترة: ${rec.middleAbsenceMinutes} دقيقة` : ""}`}
                          data-testid={`button-edit-archive-${r.employeeId}-${d}`}
                        >
                          {isStagedDelete ? (
                            <span className="text-xs font-bold text-red-500 dark:text-red-400 line-through">حذف</span>
                          ) : isStaged ? (
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">معلّق</span>
                          ) : rec.status === "absent" ? (
                            <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                          ) : rec.status === "leave" ? (
                            <span className={`text-xs font-bold ${scoreColorClass}`}>إجازة</span>
                          ) : rec.status === "holiday" ? (
                            <>
                              <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                              {rec.checkIn && (
                                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono">{rec.checkIn}</span>
                              )}
                            </>
                          ) : rec.pending ? (
                            <>
                              <span className="text-base font-bold text-amber-500 dark:text-amber-400">؟</span>
                              <span className="text-[10px] font-mono text-muted-foreground leading-none">{rec.checkIn}</span>
                            </>
                          ) : (
                            <>
                              <span className={`text-xs font-bold ${scoreColorClass}`}>{rec.dailyScore.toFixed(2)}</span>
                              {rec.checkIn && (
                                <span className="text-[10px] font-mono text-muted-foreground leading-none">{rec.checkIn}</span>
                              )}
                              {rec.checkOut && (
                                <span className="text-[10px] font-mono text-muted-foreground leading-none">{rec.checkOut}</span>
                              )}
                              {rec.middleAbsenceMinutes && rec.middleAbsenceMinutes > 0 ? (
                                <span className="text-[9px] font-bold text-orange-500 dark:text-orange-400 leading-none">غ:{rec.middleAbsenceMinutes}د</span>
                              ) : null}
                            </>
                          )}
                        </button>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold bg-muted/10 sticky left-0 z-10 border-r">
                    {(() => {
                      const bonus = r.monthBonus ?? 0;
                      const display = r.attendanceScore + bonus;
                      const denom = r.normalizedTotalDays ?? r.totalDays;
                      return (
                        <>
                          <span className={`text-sm ${scoreColor(display, denom)}`} data-testid={`score-archive-${r.employeeId}`}>
                            {Number.isInteger(display) ? display.toFixed(0) : display.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground mr-1">/{denom}</span>
                        </>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/50 font-bold border-t-2">
              <TableCell className="sticky right-0 bg-muted/50 z-10 border-l">المجموع</TableCell>
              <TableCell />
              {allDates.map((d) => {
                const dayTotal = emps.reduce((s, emp) => {
                  const rec = emp.dailyRecords.find(r => r.date === d);
                  return s + (rec?.dailyScore ?? 0);
                }, 0);
                return (
                  <TableCell key={d} className="text-center text-xs px-1 py-2">
                    <span className={scoreColor(dayTotal, emps.length)}>{dayTotal.toFixed(2)}</span>
                  </TableCell>
                );
              })}
              <TableCell className="text-center sticky left-0 bg-muted/50 z-10 border-r">
                <span className={`text-sm ${scoreColor(tableTotal, tableMax)}`}>{tableTotal.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground mr-1">/{tableMax}</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Archive className="h-6 w-6 text-primary" />
            حفظ الاشهر
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            سجل الحضور الشهري — مرتب حسب الفترات والورشات
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-stretch gap-3">
          {/* Undo + Confirm buttons */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={pendingOps.length === 0 || isConfirming}
                className={`gap-1.5 h-full ${pendingOps.length > 0 ? "border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/30" : ""}`}
                data-testid="button-undo"
              >
                <RotateCcw className="h-4 w-4" />
                تراجع
                {pendingOps.length > 0 && (
                  <span className="mr-0.5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold h-4 w-4 shrink-0">
                    {pendingOps.length}
                  </span>
                )}
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={pendingOps.length === 0 || isConfirming}
              className={`gap-1.5 h-full ${pendingOps.length > 0 ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white" : ""}`}
              data-testid="button-confirm-changes"
            >
              {isConfirming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              {isConfirming ? "جاري التطبيق..." : "تأكيد التغييرات"}
              {pendingOps.length > 0 && !isConfirming && (
                <span className="mr-0.5 inline-flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold h-4 w-4 shrink-0">
                  {pendingOps.length}
                </span>
              )}
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={prevMonth} title="الشهر السابق"
                data-testid="button-prev-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Select
                value={String(selectedMonthNum)}
                onValueChange={(v) => setSelectedMonthNum(Number(v))}
              >
                <SelectTrigger className="h-8 w-28 text-sm" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="h-8 w-20 text-sm" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={nextMonth} title="الشهر التالي"
                data-testid="button-next-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Button
            variant={activeFilterCount > 0 ? "default" : "outline"}
            className="h-full flex items-center gap-2 relative"
            onClick={() => setFilterOpen(true)}
            data-testid="button-open-filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
            انتقاء
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <Card className="shadow-sm flex-1 min-w-[220px]">
            <CardContent className="p-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالورشة أو اسم العامل أو رقمه"
                  className="h-8 text-sm pl-6"
                  data-testid="input-search-archive"
                  dir="rtl"
                />
                {searchTerm.trim() && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-clear-search"
                    title="مسح البحث"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {searchTerm.trim() && (
                <Badge variant="outline" className="text-xs whitespace-nowrap shrink-0">
                  {filtered.reduce((s, g) => s + g.workshops.reduce((ws, w) => ws + w.emps.length, 0), 0)} نتيجة
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending ops banner */}
      {pendingOps.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 text-amber-800 dark:text-amber-200 text-sm" data-testid="banner-pending-ops">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            لديك <strong>{pendingOps.length}</strong> تغيير{pendingOps.length === 1 ? "" : " معلّق"} — اضغط <strong>«تأكيد التغييرات»</strong> لتطبيقها وتسجيلها، أو <strong>«تراجع»</strong> للتراجع خطوة واحدة
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30 gap-1"
            onClick={handleUndo}
            disabled={isConfirming}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            تراجع
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            تأكيد
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : reportData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-20 text-muted-foreground">
            <Archive className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-base">لا توجد بيانات حضور لشهر {arabicMonthName(selectedMonth)}</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 && searchTerm.trim() ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-base">لا توجد نتائج لـ «{searchTerm}»</p>
            <Button variant="ghost" className="mt-2 text-sm" onClick={() => setSearchTerm("")}>
              مسح البحث
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 && activeFilterCount > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <SlidersHorizontal className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-base">لا توجد بيانات للفترة أو الورشات المختارة</p>
            <Button
              variant="ghost"
              className="mt-2 text-sm"
              onClick={() => { setSelectedRuleIds(new Set()); setSelectedWorkshopIds(new Set()); }}
            >
              إلغاء الفلتر
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {pageGrouped.map(({ rule, tables }) => (
            <div key={rule.id} className="space-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-1.5 rounded-md ${rule.name.includes("صباح") ? "bg-amber-100 dark:bg-amber-950/50" : rule.name.includes("مساء") ? "bg-indigo-100 dark:bg-indigo-950/50" : "bg-primary/10"}`}>
                  {rule.name.includes("صباح") ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : rule.name.includes("مساء") ? (
                    <Moon className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <Star className="h-4 w-4 text-primary" />
                  )}
                </div>
                <h2 className="text-lg font-bold">{rule.name}</h2>
                <span className="text-sm text-muted-foreground font-mono">{rule.workStartTime} — {rule.workEndTime}</span>
                <div className="flex-1 h-px bg-border mr-2" />
              </div>

              {tables.map(({ workshop, emps }: { workshop: Workshop | undefined; emps: EmployeeReport[] }) => (
                <div key={workshop?.id ?? "unknown"}>
                  {renderTable(emps, rule.name, workshop?.name ?? "ورشة غير محددة", workshop?.id, rule.id)}
                </div>
              ))}
            </div>
          ))}

          {flatTables.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 py-4 border-t mt-4" data-testid="pagination-bar">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="gap-1"
                data-testid="button-prev-page"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <span className="text-sm text-muted-foreground text-center">
                <span className="font-medium text-foreground">صفحة {page + 1}</span> من {totalPages}
                <span className="text-xs block text-muted-foreground">
                  (جدول {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, flatTables.length)} من {flatTables.length})
                </span>
              </span>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="gap-1"
                data-testid="button-next-page"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              انتقاء الفترات والورشات
            </DialogTitle>
            <DialogDescription>اختر الفترة والورشة لتصفية عرض الجداول</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">الفترات</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedRuleIds(new Set())}
                  data-testid="button-filter-all-rules"
                >
                  كل الفترات
                </Button>
              </div>
              <div className="space-y-1.5 border rounded-md p-2.5 bg-muted/20">
                {availableRules.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">لا توجد فترات</p>
                )}
                {availableRules.map((rule) => {
                  const checked = selectedRuleIds.size === 0 || selectedRuleIds.has(rule.id);
                  return (
                    <button
                      key={rule.id}
                      className="w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors text-right"
                      onClick={() => {
                        setSelectedRuleIds((prev) => {
                          const next = new Set(prev.size === 0 ? availableRules.map((r) => r.id) : Array.from(prev));
                          if (next.has(rule.id)) {
                            next.delete(rule.id);
                            if (next.size === availableRules.length) return new Set();
                          } else {
                            next.add(rule.id);
                            if (next.size === availableRules.length) return new Set();
                          }
                          return next;
                        });
                        setSelectedWorkshopIds(new Set());
                      }}
                      data-testid={`button-filter-rule-${rule.id}`}
                    >
                      {checked ? (
                        <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1">{rule.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{rule.workStartTime}–{rule.workEndTime}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">الورشات</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedWorkshopIds(new Set())}
                  data-testid="button-filter-all-workshops"
                >
                  كل الورشات
                </Button>
              </div>
              <div className="space-y-1.5 border rounded-md p-2.5 bg-muted/20 max-h-48 overflow-y-auto">
                {availableWorkshops.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">لا توجد ورشات</p>
                )}
                {availableWorkshops.map((ws) => {
                  const checked = selectedWorkshopIds.size === 0 || selectedWorkshopIds.has(ws.id);
                  return (
                    <button
                      key={ws.id}
                      className="w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors text-right"
                      onClick={() => {
                        setSelectedWorkshopIds((prev) => {
                          const next = new Set(prev.size === 0 ? availableWorkshops.map((w) => w.id) : Array.from(prev));
                          if (next.has(ws.id)) {
                            next.delete(ws.id);
                            if (next.size === availableWorkshops.length) return new Set();
                          } else {
                            next.add(ws.id);
                            if (next.size === availableWorkshops.length) return new Set();
                          }
                          return next;
                        });
                      }}
                      data-testid={`button-filter-workshop-${ws.id}`}
                    >
                      {checked ? (
                        <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1">{ws.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-row-reverse">
            <Button
              variant="default"
              onClick={() => setFilterOpen(false)}
              data-testid="button-filter-apply"
            >
              تطبيق
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRuleIds(new Set());
                setSelectedWorkshopIds(new Set());
              }}
              data-testid="button-filter-reset"
            >
              إعادة ضبط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cell Dialog */}
      <Dialog open={!!editCell} onOpenChange={(open) => { if (!open) setEditCell(null); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل سجل الحضور</DialogTitle>
            <DialogDescription>
              {editCell && (
                <span>
                  <span className="font-semibold text-foreground">{editCell.employeeName}</span>
                  {" — "}
                  <span className="font-mono">{editCell.date}</span>
                  {" ("}
                  <span>{editCell.date ? getArabicDay(editCell.date) : ""}</span>
                  {")"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>الحالة</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-status-archive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="late">متأخر</SelectItem>
                  <SelectItem value="absent">غائب</SelectItem>
                  <SelectItem value="leave">إجازة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>وقت الدخول</Label>
                <Input
                  type="time"
                  value={editForm.checkIn}
                  onChange={(e) => setEditForm(f => ({ ...f, checkIn: e.target.value }))}
                  data-testid="input-checkin-archive"
                  disabled={editForm.status === "absent" || editForm.status === "leave"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>وقت الخروج</Label>
                <Input
                  type="time"
                  value={editForm.checkOut}
                  onChange={(e) => setEditForm(f => ({ ...f, checkOut: e.target.value }))}
                  data-testid="input-checkout-archive"
                  disabled={editForm.status === "absent" || editForm.status === "leave"}
                />
              </div>
            </div>

            {!editCell?.record.attendanceId && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                لا يوجد سجل في قاعدة البيانات — سيتم إنشاء سجل جديد عند التأكيد.
              </p>
            )}

            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              سيُضاف هذا التعديل لقائمة التغييرات المعلّقة. اضغط «تأكيد التغييرات» في الصفحة لتطبيقه فعلياً.
            </p>
          </div>

          <DialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
            {editCell?.record.attendanceId && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 ml-auto"
                onClick={handleDelete}
                data-testid="button-delete-archive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف السجل
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditCell(null)} data-testid="button-cancel-archive">
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              data-testid="button-save-archive"
            >
              إضافة للمراجعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
