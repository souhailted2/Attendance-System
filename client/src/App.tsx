import { Switch, Route, Redirect, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { FavoritesContext, useFavoritesProvider } from "@/hooks/use-favorites";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import Attendance from "@/pages/attendance";
import Reports from "@/pages/reports";
import WorkRules from "@/pages/work-rules";
import ImportData from "@/pages/import-data";
import CrudPage from "@/pages/crud-page";
import AgentSettings from "@/pages/agent-settings";
import Shifts from "@/pages/shifts";
import Workshops from "@/pages/workshops";
import Login from "@/pages/login";
import ActivityLog from "@/pages/activity-log";
import MonthlyArchive from "@/pages/monthly-archive";
import LeavesGrants from "@/pages/leaves-grants";
import ScheduleOverrides from "@/pages/schedule-overrides";
import EmployeeAttendance from "@/pages/employee-attendance";
import Favorites from "@/pages/favorites";
import Salaries from "@/pages/salaries";
import Debts from "@/pages/debts";
import Advances from "@/pages/advances";
import Deductions from "@/pages/deductions";
import Payroll from "@/pages/payroll";
import Administration from "@/pages/administration";
import { Building2, Briefcase, ChevronLeft } from "lucide-react";

const routeLabels: Record<string, string> = {
  "/": "لوحة التحكم",
  "/employees": "الموظفين",
  "/attendance": "سجل الحضور",
  "/reports": "التقارير",
  "/companies": "الشركات",
  "/workshops": "الورشات",
  "/positions": "المناصب",
  "/shifts": "الفترات",
  "/work-rules": "قواعد العمل",
  "/import": "استيراد البيانات",
  "/agent-settings": "إعدادات Agent",
  "/activity-log": "سجل النشاطات",
  "/monthly-archive": "الأرشيف الشهري",
  "/leaves-grants": "العطل والمنح",
  "/schedule-overrides": "جداول خاصة",
  "/favorites": "المفضلة",
  "/administration": "الإدارة",
  "/salaries": "رواتب الموظفين",
  "/debts": "إدارة الديون",
  "/advances": "التسبيقات",
  "/deductions": "الخصومات",
  "/payroll": "كشف الرواتب",
};

const roleLabels: Record<string, { label: string; color: string }> = {
  owner: { label: "مالك", color: "hsl(271 76% 45%)" },
  attendence: { label: "حضور", color: "hsl(160 70% 38%)" },
  observer: { label: "مراقب", color: "hsl(43 96% 42%)" },
  caisse: { label: "صندوق", color: "hsl(36 90% 44%)" },
  workshop: { label: "ورشة", color: "hsl(220 80% 50%)" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2)).toUpperCase();
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const timeStr = now.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("ar-DZ", { weekday: "short", day: "numeric", month: "short" });
  return (
    <div className="hidden sm:flex flex-col items-center leading-none gap-0.5">
      <span className="text-[13px] font-bold tabular-nums text-foreground/90 dark:text-white/95">
        {timeStr}
      </span>
      <span className="text-[10px] text-muted-foreground dark:text-white/45">{dateStr}</span>
    </div>
  );
}

function Breadcrumb() {
  const [location] = useLocation();
  const label = routeLabels[location] ?? "...";
  const isRoot = location === "/";
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-[12px] text-muted-foreground dark:text-white/50">نظام الحضور</span>
      {!isRoot && (
        <>
          <ChevronLeft className="h-3 w-3 text-muted-foreground/60 dark:text-white/35" />
          <span className="font-medium text-[13px] text-foreground/90 dark:text-white/92">{label}</span>
        </>
      )}
      {isRoot && (
        <span className="font-medium text-[13px] text-foreground/90 dark:text-white/92">لوحة التحكم</span>
      )}
    </div>
  );
}

function UserBadge() {
  const { user } = useAuth();
  if (!user) return null;
  const initials = getInitials(user.username);
  const role = roleLabels[user.role] ?? roleLabels[user.username] ?? { label: "مستخدم", color: "hsl(262 75% 50%)" };
  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex flex-col items-end leading-none gap-0.5">
        <span className="text-[12px] font-medium text-foreground/90 dark:text-white/90">
          {user.username === "owner" ? "المدير العام" : user.username}
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            background: role.color + "22",
            color: role.color,
            border: `1px solid ${role.color}38`,
          }}
        >
          {role.label}
        </span>
      </div>
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: "linear-gradient(135deg, hsl(262 75% 52%), hsl(280 70% 60%))",
          color: "white",
          boxShadow: "0 2px 8px hsl(262 75% 52% / 0.35)",
        }}
        data-testid="text-username"
      >
        {initials}
      </div>
    </div>
  );
}

function ProtectedRoute({
  component: Component,
  allowedUsers,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedUsers: string[];
  allowedRoles?: string[];
}) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/" />;
  const roleAllowed = allowedRoles && user.role && allowedRoles.includes(user.role);
  const userAllowed = allowedUsers.includes(user.username);
  if (!roleAllowed && !userAllowed) {
    if (user.role === "workshop") return <Redirect to="/reports" />;
    if (user.username === "caisse") return <Redirect to="/salaries" />;
    return <Redirect to="/" />;
  }
  return <Component />;
}

const NON_CAISSE_ROLES = ["owner", "attendence", "observer"];

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute component={Dashboard} allowedUsers={[...NON_CAISSE_ROLES]} />
      </Route>
      <Route path="/employees">
        <ProtectedRoute component={Employees} allowedUsers={[...NON_CAISSE_ROLES]} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={Attendance} allowedUsers={[...NON_CAISSE_ROLES]} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} allowedUsers={[...NON_CAISSE_ROLES]} allowedRoles={["workshop"]} />
      </Route>
      <Route path="/companies">
        <ProtectedRoute
          component={() => (
            <CrudPage
              title="الشركات"
              apiPath="/api/companies"
              icon={Building2}
              fields={[
                { key: "name", label: "اسم الشركة", required: true },
                { key: "description", label: "الوصف" },
              ]}
            />
          )}
          allowedUsers={[...NON_CAISSE_ROLES]}
        />
      </Route>
      <Route path="/workshops">
        <ProtectedRoute component={Workshops} allowedUsers={[...NON_CAISSE_ROLES]} />
      </Route>
      <Route path="/positions">
        <ProtectedRoute
          component={() => (
            <CrudPage
              title="المناصب"
              apiPath="/api/positions"
              icon={Briefcase}
              fields={[
                { key: "name", label: "اسم المنصب", required: true },
                { key: "description", label: "الوصف" },
              ]}
            />
          )}
          allowedUsers={[...NON_CAISSE_ROLES]}
        />
      </Route>
      <Route path="/shifts">
        <ProtectedRoute component={Shifts} allowedUsers={[...NON_CAISSE_ROLES]} />
      </Route>
      <Route path="/work-rules">
        <ProtectedRoute component={WorkRules} allowedUsers={[...NON_CAISSE_ROLES]} />
      </Route>
      <Route path="/import">
        <ProtectedRoute component={ImportData} allowedUsers={[...NON_CAISSE_ROLES]} />
      </Route>
      <Route path="/agent-settings">
        <ProtectedRoute component={AgentSettings} allowedUsers={[...NON_CAISSE_ROLES]} />
      </Route>
      <Route path="/activity-log">
        <ProtectedRoute component={ActivityLog} allowedUsers={["owner"]} />
      </Route>
      <Route path="/monthly-archive">
        <ProtectedRoute component={MonthlyArchive} allowedUsers={["owner"]} />
      </Route>
      <Route path="/leaves-grants">
        <ProtectedRoute component={LeavesGrants} allowedUsers={["owner", "observer"]} />
      </Route>
      <Route path="/schedule-overrides">
        <ProtectedRoute component={ScheduleOverrides} allowedUsers={["owner", "attendence"]} />
      </Route>
      <Route path="/favorites">
        <ProtectedRoute component={Favorites} allowedUsers={["owner"]} />
      </Route>
      <Route path="/employees/:id/attendance">
        <ProtectedRoute component={EmployeeAttendance} allowedUsers={["owner", "attendence"]} />
      </Route>
      <Route path="/administration">
        <ProtectedRoute component={Administration} allowedUsers={["owner"]} />
      </Route>
      <Route path="/salaries">
        <ProtectedRoute component={Salaries} allowedUsers={["caisse"]} />
      </Route>
      <Route path="/debts">
        <ProtectedRoute component={Debts} allowedUsers={["caisse"]} />
      </Route>
      <Route path="/advances">
        <ProtectedRoute component={Advances} allowedUsers={["caisse"]} />
      </Route>
      <Route path="/deductions">
        <ProtectedRoute component={Deductions} allowedUsers={["caisse", "owner"]} />
      </Route>
      <Route path="/payroll">
        <ProtectedRoute component={Payroll} allowedUsers={["caisse"]} allowedRoles={["workshop"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-shell-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full relative overflow-hidden app-shell-bg">
        <AppSidebar />

        <div className="flex flex-col flex-1 min-w-0 relative">
          <header
            className="app-topbar flex items-center justify-between gap-3 px-3 shrink-0"
            style={{ height: "52px" }}
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger
                data-testid="button-sidebar-toggle"
                className="app-topbar-text-primary hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
              />
              <Breadcrumb />
            </div>
            <div className="flex items-center gap-4">
              <LiveClock />
              <div className="w-px h-5 bg-black/10 dark:bg-white/15" />
              <ThemeToggle />
              <UserBadge />
            </div>
          </header>

          <main className="app-main-content flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function FavoritesWrapper({ children }: { children: React.ReactNode }) {
  const favValue = useFavoritesProvider();
  return (
    <FavoritesContext.Provider value={favValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <FavoritesWrapper>
              <AppShell />
            </FavoritesWrapper>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
