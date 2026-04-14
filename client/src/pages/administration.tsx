import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard } from "lucide-react";
import Salaries from "./salaries";
import Debts from "./debts";
import Advances from "./advances";
import Payroll from "./payroll";

export default function Administration() {
  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,hsl(271 76% 45%),hsl(260 70% 55%))",
            boxShadow: "0 3px 12px hsl(271 76% 45%/0.35)",
          }}
        >
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">الإدارة</h1>
          <p className="text-sm text-muted-foreground">إدارة الرواتب، الديون، والتسبيقات</p>
        </div>
      </div>

      <Tabs defaultValue="salaries" dir="rtl">
        <TabsList className="mb-6 w-full justify-start gap-1 h-auto flex-wrap">
          <TabsTrigger value="salaries" data-testid="tab-salaries" className="px-5 py-2">
            رواتب الموظفين
          </TabsTrigger>
          <TabsTrigger value="debts" data-testid="tab-debts" className="px-5 py-2">
            الديون
          </TabsTrigger>
          <TabsTrigger value="advances" data-testid="tab-advances" className="px-5 py-2">
            التسبيقات
          </TabsTrigger>
          <TabsTrigger value="payroll" data-testid="tab-payroll" className="px-5 py-2">
            كشف الرواتب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salaries" className="mt-0 p-0">
          <div className="[&>div]:p-0 [&>div]:max-w-none">
            <Salaries />
          </div>
        </TabsContent>

        <TabsContent value="debts" className="mt-0 p-0">
          <div className="[&>div]:p-0 [&>div]:max-w-none">
            <Debts />
          </div>
        </TabsContent>

        <TabsContent value="advances" className="mt-0 p-0">
          <div className="[&>div]:p-0 [&>div]:max-w-none">
            <Advances />
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="mt-0 p-0">
          <div className="[&>div]:p-0 [&>div]:max-w-none">
            <Payroll />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
