import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Lock, User } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, hsl(271 70% 18%) 0%, hsl(271 65% 28%) 45%, hsl(260 60% 20%) 100%)",
      }}
    >
      <div
        className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(43 96% 52%), transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(271 80% 70%), transparent 70%)" }}
      />
      <div
        className="absolute top-[40%] left-[20%] w-[250px] h-[250px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(43 96% 65%), transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(43 96% 52%), hsl(36 90% 58%))",
              boxShadow: "0 8px 32px hsl(43 96% 52% / 0.50), 0 2px 8px hsl(43 96% 52% / 0.30)",
            }}
          >
            <ClipboardCheck className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">نظام إدارة الحضور</h1>
            <p className="text-sm text-white/60 mt-1">سجّل دخولك للمتابعة</p>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "rgba(255, 255, 255, 0.07)",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          <h2 className="text-center text-base font-semibold text-white/90">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80 text-sm">اسم المستخدم</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="username"
                  data-testid="input-username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  className="pr-9 bg-white/10 border-white/15 text-white placeholder:text-white/35 focus:border-yellow-400/60 focus:ring-yellow-400/30"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  className="pr-9 bg-white/10 border-white/15 text-white placeholder:text-white/35 focus:border-yellow-400/60 focus:ring-yellow-400/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-300 bg-red-500/15 border border-red-400/20 rounded-lg px-3 py-2 text-center" data-testid="text-login-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full font-semibold h-10 text-sm"
              disabled={loading}
              data-testid="button-login-submit"
              style={{
                background: loading
                  ? "rgba(255,255,255,0.15)"
                  : "linear-gradient(135deg, hsl(43 96% 52%), hsl(36 90% 56%))",
                color: loading ? "rgba(255,255,255,0.5)" : "hsl(271 70% 15%)",
                border: "none",
                boxShadow: loading ? "none" : "0 4px 16px hsl(43 96% 52% / 0.40)",
              }}
            >
              {loading ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-white/35">
          نظام إدارة الحضور والانصراف — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
