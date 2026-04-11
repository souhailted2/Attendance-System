import { Switch, Route, Redirect } from "wouter";
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
import { Building2, Briefcase } from "lucide-react";

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
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-10%",
            right: "-8%",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(218,165,32,0.18) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-15%",
            left: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "40%",
            left: "30%",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(218,165,32,0.10) 0%, transparent 65%)",
            filter: "blur(35px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "10%",
            left: "15%",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 65%)",
            filter: "blur(30px)",
          }}
        />

        <AppSidebar />

        <div className="flex flex-col flex-1 min-w-0 relative">
          {/* Glass header bar */}
          <header
            className="flex items-center justify-between gap-2 p-2 shrink-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(16px) saturate(1.5)",
              WebkitBackdropFilter: "blur(16px) saturate(1.5)",
              borderBottom: "1px solid rgba(218,165,32,0.18)",
              boxShadow: "0 1px 0 rgba(218,165,32,0.08)",
            }}
          >
            <SidebarTrigger
              data-testid="button-sidebar-toggle"
              className="text-white/80 hover:text-white hover:bg-white/10"
            />
            <ThemeToggle />
          </header>

          {/* Main content area — transparent so purple bg shows through */}
          <main className="flex-1 overflow-auto">
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
