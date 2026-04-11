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
import Devices from "@/pages/devices";
import ImportData from "@/pages/import-data";
import CrudPage from "@/pages/crud-page";
import AgentSettings from "@/pages/agent-settings";
import Shifts from "@/pages/shifts";
import Workshops from "@/pages/workshops";
import Login from "@/pages/login";
import ActivityLog from "@/pages/activity-log";
import MonthlyArchive from "@/pages/monthly-archive";
import LeavesGrants from "@/pages/leaves-grants";
import EmployeeAttendance from "@/pages/employee-attendance";
import Favorites from "@/pages/favorites";
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
  "/devices": "الأجهزة",
  "/import": "استيراد البيانات",
  "/agent-settings": "إعدادات Agent",
  "/activity-log": "سجل النشاطات",
  "/monthly-archive": "الأرشيف الشهري",
  "/leaves-grants": "العطل والمنح",
  "/favorites": "المفضلة",
};

const roleLabels: Record<string, { label: string; color: string }> = {
  owner: { label: "مالك", color: "hsl(271 76% 45%)" },
  attendence: { label: "حضور", color: "hsl(160 70% 38%)" },
  observer: { label: "مراقب", color: "hsl(43 96% 42%)" },
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
      <span className="text-[13px] font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.95)" }}>
        {timeStr}
      </span>
      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>{dateStr}</span>
    </div>
  );
}

function Breadcrumb() {
  const [location] = useLocation();
  const label = routeLabels[location] ?? "...";
  const isRoot = location === "/";
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span style={{ color: "rgba(255,255,255,0.50)", fontSize: "12px" }}>نظام الحضور</span>
      {!isRoot && (
        <>
          <ChevronLeft className="h-3 w-3" style={{ color: "rgba(255,255,255,0.35)" }} />
          <span className="font-medium" style={{ color: "rgba(255,255,255,0.92)", fontSize: "13px" }}>{label}</span>
        </>
      )}
      {isRoot && (
        <span className="font-medium" style={{ color: "rgba(255,255,255,0.92)", fontSize: "13px" }}>لوحة التحكم</span>
      )}
    </div>
  );
}

function UserBadge() {
  const { user } = useAuth();
  if (!user) return null;
  const initials = getInitials(user.username);
  const role = roleLabels[user.username] ?? { label: "مستخدم", color: "hsl(271 50% 55%)" };
  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex flex-col items-end leading-none gap-0.5">
        <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.90)" }}>
          {user.username === "owner" ? "المدير العام" : user.username}
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            background: role.color + "25",
            color: role.color,
            border: `1px solid ${role.color}40`,
          }}
        >
          {role.label}
        </span>
      </div>
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: "linear-gradient(135deg, hsl(43 96% 52%), hsl(271 76% 55%))",
          color: "white",
          boxShadow: "0 0 0 2px rgba(218,165,32,0.3)",
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
}: {
  component: React.ComponentType;
  allowedUsers: string[];
}) {
  const { user } = useAuth();
  if (!user || !allowedUsers.includes(user.username)) {
    return <Redirect to="/" />;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/employees" component={Employees} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/reports" component={Reports} />
      <Route path="/companies">
        <CrudPage
          title="الشركات"
          apiPath="/api/companies"
          icon={Building2}
          fields={[
            { key: "name", label: "اسم الشركة", required: true },
            { key: "description", label: "الوصف" },
          ]}
        />
      </Route>
      <Route path="/workshops" component={Workshops} />
      <Route path="/positions">
        <CrudPage
          title="المناصب"
          apiPath="/api/positions"
          icon={Briefcase}
          fields={[
            { key: "name", label: "اسم المنصب", required: true },
            { key: "description", label: "الوصف" },
          ]}
        />
      </Route>
      <Route path="/shifts" component={Shifts} />
      <Route path="/work-rules" component={WorkRules} />
      <Route path="/devices" component={Devices} />
      <Route path="/import" component={ImportData} />
      <Route path="/agent-settings" component={AgentSettings} />
      <Route path="/activity-log">
        <ProtectedRoute component={ActivityLog} allowedUsers={["owner"]} />
      </Route>
      <Route path="/monthly-archive">
        <ProtectedRoute component={MonthlyArchive} allowedUsers={["owner"]} />
      </Route>
      <Route path="/leaves-grants">
        <ProtectedRoute component={LeavesGrants} allowedUsers={["owner", "observer"]} />
      </Route>
      <Route path="/favorites">
        <ProtectedRoute component={Favorites} allowedUsers={["owner"]} />
      </Route>
      <Route path="/employees/:id/attendance">
        <ProtectedRoute component={EmployeeAttendance} allowedUsers={["owner"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, hsl(271 70% 15%) 0%, hsl(260 65% 20%) 50%, hsl(280 60% 18%) 100%)" }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
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
      <div
        className="flex h-screen w-full relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(271 70% 15%) 0%, hsl(258 65% 22%) 45%, hsl(280 60% 18%) 100%)",
        }}
      >
        {/* Decorative background orbs */}
        <div className="absolute pointer-events-none" style={{ top: "-10%", right: "-8%", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(circle, rgba(218,165,32,0.18) 0%, transparent 65%)", filter: "blur(40px)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-15%", left: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)", filter: "blur(50px)" }} />
        <div className="absolute pointer-events-none" style={{ top: "40%", left: "30%", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(218,165,32,0.10) 0%, transparent 65%)", filter: "blur(35px)" }} />
        <div className="absolute pointer-events-none" style={{ top: "10%", left: "15%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 65%)", filter: "blur(30px)" }} />

        <AppSidebar />

        <div className="flex flex-col flex-1 min-w-0 relative">
          {/* Rich app-style topbar */}
          <header
            className="flex items-center justify-between gap-3 px-3 shrink-0"
            style={{
              height: "52px",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px) saturate(1.6)",
              WebkitBackdropFilter: "blur(20px) saturate(1.6)",
              borderBottom: "1px solid rgba(218,165,32,0.18)",
              boxShadow: "0 1px 0 rgba(218,165,32,0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger
                data-testid="button-sidebar-toggle"
                className="text-white/70 hover:text-white hover:bg-white/10 shrink-0"
              />
              <Breadcrumb />
            </div>
            <div className="flex items-center gap-4">
              <LiveClock />
              <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.15)" }} />
              <ThemeToggle />
              <UserBadge />
            </div>
          </header>

          {/* Main content area */}
          <main
            className="flex-1 overflow-auto"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
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
