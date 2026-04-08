import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
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
import { Building2, Wrench, Briefcase } from "lucide-react";

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
      <Route path="/activity-log" component={ActivityLog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
