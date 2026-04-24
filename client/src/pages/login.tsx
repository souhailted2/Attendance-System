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
  Clock,
} from "lucide-react";
import brandLogoImg from "@assets/ChatGPT_Image_Apr_24,_2026,_06_21_21_PM_1777051422873.png";

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
      {/* Dark mode only: atmospheric orbs — gold/amber tone */}
      <div
        className="login-orb absolute pointer-events-none"
        style={{ top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", filter: "blur(60px)", background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 65%)" }}
      />
      <div
        className="login-orb absolute pointer-events-none"
        style={{ bottom: "-15%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", filter: "blur(50px)", background: "radial-gradient(circle, rgba(184,134,11,0.12) 0%, transparent 65%)" }}
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
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #B8860B)",
                boxShadow: "0 4px 16px rgba(212,175,55,0.40)",
              }}
            >
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold login-title" style={{ fontFamily: "'Tajawal', sans-serif", letterSpacing: "0.04em" }}>TEDJANI ATTENDIX</h1>
              <p className="text-[10px] login-subtitle" style={{ fontFamily: "'Cairo', sans-serif" }}>Smart Attendance & Workforce Management</p>
            </div>
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
                    className="login-input pr-9 h-10 text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-amber-400/50"
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
                    className="login-input pr-9 h-10 text-sm rounded-lg focus-visible:ring-2 focus-visible:ring-amber-400/50"
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
                className="w-full h-10 text-sm font-semibold rounded-lg border-0"
                disabled={loading}
                data-testid="button-login-submit"
                style={{
                  background: loading
                    ? "rgba(212,175,55,0.35)"
                    : "linear-gradient(135deg, #D4AF37, #B8860B)",
                  color: "#0D1321",
                  boxShadow: loading ? "none" : "0 4px 18px rgba(212,175,55,0.40)",
                  transition: "all 0.2s ease",
                  fontWeight: "700",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-[#0D1321]/30 border-t-[#0D1321] animate-spin" />
                    جاري التحقق...
                  </span>
                ) : "دخول إلى النظام"}
              </Button>
            </form>
          </div>

          <p className="login-footer text-xs text-center">
            TEDJANI ATTENDIX — Smart Attendance & Workforce Management
          </p>
        </div>
      </div>

      {/* ===== LEFT PANEL: Branding (desktop only — always dark navy) ===== */}
      <div className="login-branding-panel hidden lg:flex flex-col justify-center w-[55%] p-16 relative overflow-hidden">
        {/* Gold glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(212,175,55,0.10) 0%, transparent 65%)" }}
        />

        <div
          className="relative z-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(-20px)",
            transition: "opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s",
          }}
        >
          {/* Brand image */}
          <div className="mb-8 flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #B8860B)",
                boxShadow: "0 8px 32px rgba(212,175,55,0.45)",
              }}
            >
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "'Tajawal', sans-serif", letterSpacing: "0.06em" }}
              >
                TEDJANI ATTENDIX
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(212,175,55,0.70)", fontFamily: "'Cairo', sans-serif" }}>
                Smart Attendance & Workforce Management
              </p>
            </div>
          </div>

          {/* Brand sheet preview */}
          <div
            className="mb-8 rounded-xl overflow-hidden"
            style={{
              border: "1px solid rgba(212,175,55,0.25)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
              maxWidth: "420px",
            }}
          >
            <img
              src={brandLogoImg}
              alt="TEDJANI ATTENDIX Brand Identity"
              className="w-full object-cover"
              style={{ maxHeight: "220px", objectPosition: "top" }}
            />
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
                    background: "rgba(212,175,55,0.15)",
                    border: "1px solid rgba(212,175,55,0.30)",
                  }}
                >
                  <f.icon className="h-4 w-4" style={{ color: "#D4AF37" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div
            className="mt-10 flex items-center gap-8 pt-8"
            style={{ borderTop: "1px solid rgba(212,175,55,0.15)" }}
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
                    background: "linear-gradient(135deg, #D4AF37, #F5D060)",
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
