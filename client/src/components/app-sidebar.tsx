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
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Employee } from "@shared/schema";
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

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isOwner = user?.username === "owner";
  const { favorites } = useFavorites();
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isOwner && favorites.length > 0,
  });
  const favoriteEmployees = isOwner
    ? employees.filter((e) => favorites.includes(e.id))
    : [];

  return (
    <Sidebar side="right">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold" data-testid="text-app-title">نظام الحضور</h2>
            <p className="text-xs text-muted-foreground">إدارة الحضور والانصراف</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-nav-${item.url.replace("/", "") || "dashboard"}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {(user?.username === "owner" || user?.username === "observer") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/leaves-grants"}
                    data-testid="link-nav-leaves-grants"
                  >
                    <Link href="/leaves-grants">
                      <CalendarDays className="h-4 w-4" />
                      <span>العطل والمنح</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {user?.username === "owner" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/monthly-archive"}
                    data-testid="link-nav-monthly-archive"
                  >
                    <Link href="/monthly-archive">
                      <Archive className="h-4 w-4" />
                      <span>حفظ الاشهر</span>
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
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-nav-${item.url.replace("/", "")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>أدوات</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-nav-${item.url.replace("/", "")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {user?.username === "owner" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/activity-log"}
                    data-testid="link-nav-activity-log"
                  >
                    <Link href="/activity-log">
                      <History className="h-4 w-4" />
                      <span>سجل النشاطات</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isOwner && favoriteEmployees.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              المفضلة
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favoriteEmployees.map((emp) => (
                  <SidebarMenuItem key={emp.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/employees/${emp.id}/attendance`}
                      data-testid={`link-favorite-${emp.id}`}
                    >
                      <Link href={`/employees/${emp.id}/attendance`}>
                        <UserCheck className="h-4 w-4" />
                        <span className="truncate">{emp.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3 border-t">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium truncate block" data-testid="text-username">
                {user?.username === "owner" ? "المدير العام" : user?.username}
              </span>
              {user?.username === "owner" && (
                <span className="text-[10px] text-muted-foreground">owner</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={logout}
            data-testid="button-logout"
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
