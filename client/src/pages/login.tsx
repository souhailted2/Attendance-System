import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  User,
  Users,
  BarChart3,
  Cpu,
  ShieldCheck,
  Fingerprint,
  Clock4,
} from "lucide-react";

const features = [
  { icon: Fingerprint, text: "تكامل أجهزة ZKTeco البيومترية" },
  { icon: Users, text: "إدارة الموظفين والورشات" },
  { icon: BarChart3, text: "تقارير ذكية وتحليلات متقدمة" },
  { icon: Clock4, text: "تتبع الحضور والانصراف لحظة بلحظة" },
  { icon: ShieldCheck, text: "صلاحيات متعددة المستويات" },
  { icon: Cpu, text: "معالجة آلية بالذكاء الاصطناعي" },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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
    <div className="login-bg min-h-screen flex overflow-hidden relative" dir="rtl">
      {/* Dark mode only: atmospheric orbs — gold tones */}
      <div
        className="login-orb absolute pointer-events-none"
        style={{ top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", filter: "blur(60px)", background: "radial-gradient(circle, hsl(43 62% 52% / 0.12) 0%, transparent 65%)" }}
      />
      <div
        className="login-orb absolute pointer-events-none"
        style={{ bottom: "-15%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", filter: "blur(50px)", background: "radial-gradient(circle, hsl(222 45% 30% / 0.18) 0%, transparent 65%)" }}
      />

      {/* ===== RIGHT PANEL: Form ===== */}
      <div className="relative z-10 flex items-center justify-center w-full lg:w-[45%] p-6 lg:p-12">
        <div
          className="w-full max-w-sm space-y-7"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(20px)",
            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Logo (mobile only) */}
          <div className="flex items-center justify-center lg:hidden">
            <img
              src="/logo-horizontal.png"
              className="h-12 w-auto object-contain"
              alt="TEDJANI ATTENDIX"
            />
          </div>

          {/* Form card */}
          <div className="login-form-card rounded-2xl p-7 space-y-6">
            <div className="space-y-1">
              <h2 className="login-title text-xl font-bold">مرحباً بك</h2>
              <p className="login-subtitle text-sm">سجّل دخولك للمتابعة</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="login-label text-sm font-medium">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <User className="login-input-icon absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                  <Input
                    id="username"
                    data-testid="input-username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    className="login-input pr-9 h-10 text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-yellow-500/40"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="login-label text-sm font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="login-input-icon absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    placeholder="••••••••"
                    className="login-input pr-9 h-10 text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-yellow-500/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{
                    background: "rgba(239,68,68,0.10)",
                    border: "1px solid rgba(239,68,68,0.22)",
                  }}
                  data-testid="text-login-error"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold rounded-lg border-0 text-white"
                disabled={loading}
                data-testid="button-login-submit"
                style={{
                  background: loading
                    ? "rgba(180, 140, 10, 0.40)"
                    : "linear-gradient(135deg, hsl(43 62% 38%), hsl(40 80% 30%))",
                  boxShadow: loading ? "none" : "0 4px 18px hsl(43 62% 42% / 0.45)",
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    جاري التحقق...
                  </span>
                ) : "دخول إلى النظام"}
              </Button>
            </form>
          </div>

          <p className="login-footer text-xs text-center">
            نظام إدارة الحضور والانصراف — جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      {/* ===== LEFT PANEL: Branding (desktop only — TEDJANI navy) ===== */}
      <div className="login-branding-panel hidden lg:flex flex-col justify-center w-[55%] p-16 relative overflow-hidden">
        {/* Subtle gold glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 65%)" }}
        />

        <div
          className="relative z-10 flex flex-col items-center text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(-20px)",
            transition: "opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s",
          }}
        >
          {/* Full logo image */}
          <img
            src="/logo-full.png"
            className="w-72 object-contain mb-10"
            alt="TEDJANI ATTENDIX"
            style={{ filter: "drop-shadow(0 8px 32px rgba(212,175,55,0.30))" }}
          />

          {/* Tagline */}
          <p className="text-base leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            منصة متكاملة لإدارة حضور الموظفين مع تكامل أجهزة ZKTeco البيومترية وتقارير ذكية فورية.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3 max-w-md mt-8 text-right w-full">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateX(0)" : "translateX(-10px)",
                  transition: `opacity 0.4s ease ${0.2 + i * 0.07}s, transform 0.4s ease ${0.2 + i * 0.07}s`,
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                  style={{
                    background: "rgba(212, 175, 55, 0.15)",
                    border: "1px solid rgba(212, 175, 55, 0.25)",
                  }}
                >
                  <f.icon className="h-4 w-4" style={{ color: "hsl(43 62% 65%)" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div
            className="mt-10 flex items-center gap-8 pt-8 w-full justify-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {[
              { value: "99.9%", label: "وقت التشغيل" },
              { value: "+50", label: "جهاز مدعوم" },
              { value: "لحظي", label: "تحديث البيانات" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p
                  className="text-2xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, hsl(43 68% 65%), hsl(40 80% 55%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
