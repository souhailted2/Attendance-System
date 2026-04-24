import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart3,
  Building2,
  Wrench,
  Briefcase,
  Scale,
  Bot,
  CalendarClock,
  LogOut,
  History,
  Archive,
  CalendarDays,
  Star,
  Shield,
  Eye,
  CalendarRange,
  Banknote,
  CreditCard,
  Wallet,
  Minus,
  FileSpreadsheet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { TejdaniLogo } from "@/components/tedjani-logo";

const mainItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard },
  { title: "الموظفين", url: "/employees", icon: Users },
  { title: "سجل الحضور", url: "/attendance", icon: ClipboardCheck },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
];

const settingsItems = [
  { title: "الفترات", url: "/shifts", icon: CalendarClock },
  { title: "الشركات", url: "/companies", icon: Building2 },
  { title: "الورشات", url: "/workshops", icon: Wrench },
  { title: "المناصب", url: "/positions", icon: Briefcase },
  { title: "قواعد العمل", url: "/work-rules", icon: Scale },
];

const toolsItems = [
  { title: "Agent المصنع", url: "/agent-settings", icon: Bot },
];

const roleInfo: Record<string, { label: string; displayName: string; icon: typeof Shield }> = {
  owner: { label: "مالك النظام", displayName: "المدير العام", icon: Shield },
  attendence: { label: "مسؤول الحضور", displayName: "مسؤول الحضور", icon: ClipboardCheck },
  observer: { label: "مراقب", displayName: "المراقب", icon: Eye },
  caisse: { label: "موظف الصندوق", displayName: "الصندوق", icon: Banknote },
  workshop: { label: "حساب ورشة", displayName: "الورشة", icon: Wrench },
};

const caisseItems = [
  { title: "رواتب الموظفين", url: "/salaries", icon: Banknote },
  { title: "الديون", url: "/debts", icon: CreditCard },
  { title: "التسبيقات", url: "/advances", icon: Wallet },
  { title: "الخصومات", url: "/deductions", icon: Minus },
  { title: "كشف الرواتب", url: "/payroll", icon: FileSpreadsheet },
];

function getAvatarGradient(username: string): string {
  const gradients = [
    "linear-gradient(135deg, hsl(271 76% 45%), hsl(280 70% 55%))",
    "linear-gradient(135deg, hsl(43 96% 48%), hsl(36 90% 55%))",
    "linear-gradient(135deg, hsl(160 70% 38%), hsl(155 65% 48%))",
    "linear-gradient(135deg, hsl(220 80% 50%), hsl(230 75% 60%))",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

const workshopItems = [
  { title: "التقارير", url: "/reports", icon: BarChart3 },
  { title: "كشف الرواتب", url: "/payroll", icon: FileSpreadsheet },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const role = user ? (roleInfo[user.role] ?? roleInfo[user.username] ?? { label: "مستخدم", displayName: user.username, icon: Users }) : null;
  const isWorkshop = user?.role === "workshop";

  const { data: pendingCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/deduction-requests/pending-count"],
    enabled: user?.username === "owner",
    refetchInterval: 30000,
  });
  const pendingCount = pendingCountData?.count ?? 0;

  return (
    <Sidebar side="right">
      <SidebarHeader className="px-4 py-3 border-b border-white/10 flex items-center justify-center" data-testid="text-app-title">
        <TejdaniLogo variant="sidebar" />
      </SidebarHeader>

      <SidebarContent>
        {/* WORKSHOP: واجهة مخصصة للورشة */}
        {isWorkshop ? (
          <SidebarGroup>
            <SidebarGroupLabel>الورشة</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workshopItems.map((item) => {
                  const active = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} data-testid={`link-nav-${item.url.replace("/", "")}`}>
                        <Link href={item.url}>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/20" : ""}`}>
                            <item.icon className="h-3.5 w-3.5" />
                          </span>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : user?.username === "caisse" ? (
          <SidebarGroup>
            <SidebarGroupLabel>الصندوق</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {caisseItems.map((item) => {
                  const active = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        data-testid={`link-nav-${item.url.replace("/", "")}`}
                      >
                        <Link href={item.url}>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/20" : ""}`}>
                            <item.icon className="h-3.5 w-3.5" />
                          </span>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>الرئيسية</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainItems.map((item) => {
                    const active = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          data-testid={`link-nav-${item.url.replace("/", "") || "dashboard"}`}
                        >
                          <Link href={item.url}>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/20" : ""}`}>
                              <item.icon className="h-3.5 w-3.5" />
                            </span>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {user?.username === "owner" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/favorites"} data-testid="link-nav-favorites">
                        <Link href="/favorites">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${location === "/favorites" ? "bg-primary/20" : ""}`}>
                            <Star className="h-3.5 w-3.5" />
                          </span>
                          <span>المفضلة</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {(user?.username === "owner" || user?.username === "observer") && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/leaves-grants"} data-testid="link-nav-leaves-grants">
                        <Link href="/leaves-grants">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${location === "/leaves-grants" ? "bg-primary/20" : ""}`}>
                            <CalendarDays className="h-3.5 w-3.5" />
                          </span>
                          <span>العطل والمنح</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {(user?.username === "owner" || user?.username === "attendence" || user?.username === "observer") && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/schedule-overrides"} data-testid="link-nav-schedule-overrides">
                        <Link href="/schedule-overrides">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${location === "/schedule-overrides" ? "bg-primary/20" : ""}`}>
                            <CalendarRange className="h-3.5 w-3.5" />
                          </span>
                          <span>جداول خاصة</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {user?.username === "owner" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/monthly-archive"} data-testid="link-nav-monthly-archive">
                        <Link href="/monthly-archive">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${location === "/monthly-archive" ? "bg-primary/20" : ""}`}>
                            <Archive className="h-3.5 w-3.5" />
                          </span>
                          <span>حفظ الاشهر</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {/* Administration link visible to owner only */}
                  {user?.username === "owner" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/administration"} data-testid="link-nav-administration">
                        <Link href="/administration">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${location === "/administration" ? "bg-primary/20" : ""}`}>
                            <LayoutDashboard className="h-3.5 w-3.5" />
                          </span>
                          <span>الإدارة</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {/* Deductions link for owner with pending badge */}
                  {user?.username === "owner" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/deductions"} data-testid="link-nav-deductions">
                        <Link href="/deductions">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${location === "/deductions" ? "bg-primary/20" : ""}`}>
                            <Minus className="h-3.5 w-3.5" />
                          </span>
                          <span>الخصومات</span>
                          {pendingCount > 0 && (
                            <span className="mr-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse" data-testid="badge-pending-deductions">
                              {pendingCount}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {/* Deductions link for observer */}
                  {user?.username === "observer" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/deductions"} data-testid="link-nav-deductions">
                        <Link href="/deductions">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${location === "/deductions" ? "bg-primary/20" : ""}`}>
                            <Minus className="h-3.5 w-3.5" />
                          </span>
                          <span>الخصومات</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>الإعدادات</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => {
                    const active = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          data-testid={`link-nav-${item.url.replace("/", "")}`}
                        >
                          <Link href={item.url}>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/20" : ""}`}>
                              <item.icon className="h-3.5 w-3.5" />
                            </span>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>أدوات</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsItems.map((item) => {
                    const active = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          data-testid={`link-nav-${item.url.replace("/", "")}`}
                        >
                          <Link href={item.url}>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/20" : ""}`}>
                              <item.icon className="h-3.5 w-3.5" />
                            </span>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {user?.username === "owner" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/activity-log"} data-testid="link-nav-activity-log">
                        <Link href="/activity-log">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${location === "/activity-log" ? "bg-primary/20" : ""}`}>
                            <History className="h-3.5 w-3.5" />
                          </span>
                          <span>سجل النشاطات</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Rich Profile Card Footer */}
      <SidebarFooter className="p-3">
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {/* Avatar */}
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{
              background: user ? getAvatarGradient(user.username) : "hsl(271 76% 45%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
            data-testid="text-username"
          >
            {user?.username?.slice(0, 2).toUpperCase() ?? "?"}
          </div>

          {/* Name + Role */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-tight truncate">
              {role?.displayName ?? user?.username}
            </p>
            <p className="text-[10px] opacity-50 leading-tight truncate mt-0.5">
              {role?.label ?? "مستخدم"}
            </p>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 hover:bg-destructive/20 hover:text-destructive"
            style={{ color: "rgba(255,255,255,0.45)" }}
            onClick={logout}
            data-testid="button-logout"
            title="تسجيل الخروج"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
