import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ClipboardCheck,
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
    <div
      className="min-h-screen flex overflow-hidden relative"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, hsl(222 42% 7%) 0%, hsl(220 38% 9%) 60%, hsl(230 40% 8%) 100%)",
      }}
    >
      {/* Background orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%", right: "-10%",
          width: "600px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(262 80% 55% / 0.18) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-15%", left: "-10%",
          width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(220 80% 60% / 0.14) 0%, transparent 65%)",
          filter: "blur(50px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "40%",
          width: "300px", height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(262 90% 70% / 0.08) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
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
          {/* Logo + title (mobile only, hidden on lg) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(262 80% 55%), hsl(280 75% 65%))",
                boxShadow: "0 4px 16px hsl(262 80% 55% / 0.40)",
              }}
            >
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">نظام إدارة الحضور</h1>
              <p className="text-xs text-white/40">v2.0</p>
            </div>
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl p-7 space-y-6"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">مرحباً بك</h2>
              <p className="text-sm text-white/50">سجّل دخولك للمتابعة</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-white/70 text-sm font-medium">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                  <Input
                    id="username"
                    data-testid="input-username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    className="pr-9 h-10 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.90)",
                    }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/70 text-sm font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    placeholder="••••••••"
                    className="pr-9 h-10 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.90)",
                    }}
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
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}
                  data-testid="text-login-error"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold rounded-lg border-0"
                disabled={loading}
                data-testid="button-login-submit"
                style={{
                  background: loading
                    ? "rgba(139, 92, 246, 0.30)"
                    : "linear-gradient(135deg, hsl(262 80% 55%), hsl(280 75% 60%))",
                  color: "white",
                  boxShadow: loading ? "none" : "0 4px 16px hsl(262 80% 55% / 0.40)",
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

          <p className="text-xs text-center text-white/25">
            نظام إدارة الحضور والانصراف — جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      {/* ===== LEFT PANEL: Branding (hidden on mobile) ===== */}
      <div className="hidden lg:flex flex-col justify-center w-[55%] p-16 relative">
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(-20px)",
            transition: "opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-4 mb-10">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(262 80% 55%), hsl(280 75% 65%))",
                boxShadow: "0 8px 32px hsl(262 80% 55% / 0.45)",
              }}
            >
              <ClipboardCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">نظام إدارة الحضور</h1>
              <p className="text-sm text-white/45 mt-0.5">Attendance Management System v2.0</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10 space-y-3">
            <h2 className="text-4xl font-bold text-white leading-tight">
              إدارة الحضور
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, hsl(262 85% 70%), hsl(220 85% 70%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                بكل احترافية
              </span>
            </h2>
            <p className="text-base text-white/45 leading-relaxed max-w-md">
              منصة متكاملة لإدارة حضور الموظفين مع تكامل أجهزة ZKTeco البيومترية وتقارير ذكية فورية.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3 max-w-md">
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
                    background: "rgba(139, 92, 246, 0.18)",
                    border: "1px solid rgba(139, 92, 246, 0.25)",
                  }}
                >
                  <f.icon className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-sm text-white/65">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div
            className="mt-12 flex items-center gap-8 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
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
                    background: "linear-gradient(135deg, hsl(262 85% 70%), hsl(220 85% 70%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {s.value}
                </p>
                <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
