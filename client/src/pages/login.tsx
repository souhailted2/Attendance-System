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
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
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
      className="min-h-screen flex overflow-hidden"
      dir="rtl"
      style={{
        fontFamily: "Tajawal, Cairo, sans-serif",
        background: "linear-gradient(135deg, #020817 0%, #0D1321 35%, #102A43 70%, #1B2434 100%)",
      }}
    >

      {/* ===== RIGHT PANEL: Form ===== */}
      <div
        className="relative z-10 flex items-center justify-center w-full lg:w-[45%] p-5 lg:p-10 lg:bg-[#F8F9FC]"
      >
        {/* Mobile background overlay — luxury particles */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          {/* Gold glow top */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: "300px", height: "200px",
            background: "radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 70%)",
            filter: "blur(20px)",
          }} />
          {/* Gold dots */}
          {[
            { l: "10%", t: "15%", s: 2 }, { l: "88%", t: "8%", s: 2.5 },
            { l: "5%", t: "70%", s: 1.5 }, { l: "92%", t: "65%", s: 2 },
            { l: "50%", t: "92%", s: 1.5 }, { l: "75%", t: "30%", s: 1.5 },
          ].map((d, i) => (
            <div key={i} style={{
              position: "absolute", left: d.l, top: d.t,
              width: `${d.s}px`, height: `${d.s}px`,
              background: "#D4AF37", borderRadius: "50%", opacity: 0.45,
            }} />
          ))}
        </div>

        <div
          className="w-full max-w-[380px] relative"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Mobile only: logo + title */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <img
              src="/logo-matrix.png?v=1"
              alt="TEDJANI ATTENDIX"
              style={{
                maxWidth: "240px", width: "100%", height: "auto",
                mixBlendMode: "screen",
                filter: "drop-shadow(0 4px 20px rgba(212,175,55,0.35))",
                marginBottom: "12px",
              }}
              draggable={false}
            />
            <p style={{
              fontSize: "13px", color: "rgba(255,255,255,0.45)",
              fontFamily: "Tajawal, Cairo, sans-serif",
              textAlign: "center", letterSpacing: "0.02em",
            }}>
              نظام الحضور والانصراف الذكي
            </p>
            {/* gold divider */}
            <div style={{
              width: "48px", height: "1.5px", marginTop: "12px",
              background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              borderRadius: "2px",
            }} />
          </div>

          {/* Form card — glassmorphism on mobile, white on desktop */}
          <div className="login-form-card-adaptive">
            {/* Header */}
            <div className="mb-7 text-right">
              <h2 className="text-2xl font-bold mb-1 login-title-adaptive">
                أهلاً بك
              </h2>
              <p className="text-sm login-subtitle-adaptive">
                سجّل دخولك للمتابعة
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium block text-right login-label-adaptive"
                >
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 login-icon-adaptive" />
                  <Input
                    id="username"
                    data-testid="input-username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    className="pr-9 h-11 text-sm rounded-xl text-right login-input-adaptive"
                    style={{ boxShadow: "none" }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium block text-right login-label-adaptive"
                >
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 login-icon-adaptive" />
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    placeholder="••••••••"
                    className="pr-9 h-11 text-sm rounded-xl text-right login-input-adaptive"
                    style={{ boxShadow: "none" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.20)",
                  }}
                  data-testid="text-login-error"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 text-sm font-bold border-0 mt-2"
                disabled={loading}
                data-testid="button-login-submit"
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  background: loading
                    ? "rgba(212,175,55,0.30)"
                    : "linear-gradient(90deg, #D4AF37, #B8860B)",
                  borderRadius: "14px",
                  color: "white",
                  fontWeight: "bold",
                  transform: btnHover && !loading ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: btnHover && !loading
                    ? "0 8px 20px rgba(212,175,55,0.35)"
                    : loading ? "none" : "0 4px 12px rgba(212,175,55,0.25)",
                  transition: "all 0.22s ease",
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: "rgba(255,255,255,0.25)", borderTopColor: "white" }}
                    />
                    جاري التحقق...
                  </span>
                ) : (
                  "دخول إلى النظام"
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-xs text-center mt-5 login-footer-text">
            جميع الحقوق محفوظة — TEDJANI ATTENDIX
          </p>
        </div>
      </div>

      {/* ===== LEFT PANEL: Branding (desktop only) ===== */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-[55%] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #020817 0%, #0D1321 35%, #102A43 70%, #1B2434 100%)",
          padding: "48px 56px",
        }}
      >
        {/* ── Decorative SVG: curved gold lines — top-right ── */}
        <svg
          className="absolute top-0 right-0 pointer-events-none"
          width="320" height="320" viewBox="0 0 320 320" fill="none"
          style={{ opacity: 0.55 }}
        >
          <path d="M320 0 C240 60, 180 100, 80 160" stroke="url(#goldTopRight)" strokeWidth="1.2" fill="none"/>
          <path d="M320 40 C220 100, 160 130, 40 200" stroke="url(#goldTopRight2)" strokeWidth="0.8" fill="none"/>
          <path d="M280 0 C220 70, 150 120, 60 200" stroke="url(#goldTopRight3)" strokeWidth="0.5" fill="none"/>
          <defs>
            <linearGradient id="goldTopRight" x1="320" y1="0" x2="80" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="goldTopRight2" x1="320" y1="40" x2="40" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="goldTopRight3" x1="280" y1="0" x2="60" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f0d060" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
          </defs>
        </svg>

        {/* ── Decorative SVG: curved gold lines — bottom-left ── */}
        <svg
          className="absolute bottom-0 left-0 pointer-events-none"
          width="320" height="320" viewBox="0 0 320 320" fill="none"
          style={{ opacity: 0.55 }}
        >
          <path d="M0 320 C80 260, 140 220, 240 160" stroke="url(#goldBotLeft)" strokeWidth="1.2" fill="none"/>
          <path d="M0 280 C100 220, 160 190, 280 120" stroke="url(#goldBotLeft2)" strokeWidth="0.8" fill="none"/>
          <path d="M40 320 C100 250, 170 200, 260 120" stroke="url(#goldBotLeft3)" strokeWidth="0.5" fill="none"/>
          <defs>
            <linearGradient id="goldBotLeft" x1="0" y1="320" x2="240" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="goldBotLeft2" x1="0" y1="280" x2="280" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="goldBotLeft3" x1="40" y1="320" x2="260" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f0d060" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
          </defs>
        </svg>

        {/* ── Gold dot particles — top-right corner ── */}
        {[
          { x: "82%", y: "6%", s: 3 }, { x: "88%", y: "11%", s: 2 }, { x: "76%", y: "14%", s: 2.5 },
          { x: "92%", y: "18%", s: 1.5 }, { x: "70%", y: "8%", s: 1.5 }, { x: "94%", y: "8%", s: 2 },
        ].map((d, i) => (
          <div key={`tr-${i}`} className="absolute pointer-events-none rounded-full"
            style={{ left: d.x, top: d.y, width: `${d.s}px`, height: `${d.s}px`, background: "#D4AF37", opacity: 0.55 }} />
        ))}

        {/* ── Gold dot particles — bottom-left corner ── */}
        {[
          { x: "6%", y: "82%", s: 3 }, { x: "11%", y: "88%", s: 2 }, { x: "14%", y: "76%", s: 2.5 },
          { x: "18%", y: "92%", s: 1.5 }, { x: "8%", y: "70%", s: 1.5 }, { x: "3%", y: "92%", s: 2 },
        ].map((d, i) => (
          <div key={`bl-${i}`} className="absolute pointer-events-none rounded-full"
            style={{ left: d.x, top: d.y, width: `${d.s}px`, height: `${d.s}px`, background: "#D4AF37", opacity: 0.55 }} />
        ))}

        {/* ── Golden glow behind logo ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -70%)",
            width: "420px",
            height: "300px",
            background: "radial-gradient(ellipse at center, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 45%, transparent 70%)",
            filter: "blur(24px)",
          }}
        />

        {/* ── Content (logo + text + features) ── */}
        <div
          className="relative z-10 flex flex-col items-center text-center w-full max-w-xl"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.55s ease 0.08s, transform 0.55s ease 0.08s",
          }}
        >
          {/* Logo */}
          <img
            src="/logo-matrix.png?v=1"
            alt="TEDJANI ATTENDIX"
            data-testid="img-logo"
            style={{
              width: "100%",
              maxWidth: "460px",
              height: "auto",
              objectFit: "contain",
              marginBottom: "28px",
              mixBlendMode: "screen",
              filter: "drop-shadow(0 8px 32px rgba(212,175,55,0.35))",
            }}
            draggable={false}
          />

          {/* Title */}
          <h1
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "white",
              textAlign: "center",
              lineHeight: 1.25,
              marginBottom: "16px",
              fontFamily: "Tajawal, Cairo, sans-serif",
              textShadow: "0 2px 24px rgba(0,0,0,0.4)",
            }}
          >
            نظام الحضور والانصراف الذكي
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.72)",
              textAlign: "center",
              lineHeight: 1.7,
              marginBottom: "36px",
              maxWidth: "460px",
              fontFamily: "Tajawal, Cairo, sans-serif",
            }}
          >
            تحكم كامل في حضور الموظفين وتقارير الأداء لحظة بلحظة
          </p>

          {/* Gold divider */}
          <div style={{
            width: "80px", height: "2px", marginBottom: "32px",
            background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
            borderRadius: "2px",
          }} />

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 w-full text-right">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(10px)",
                  transition: `opacity 0.4s ease ${0.2 + i * 0.06}s, transform 0.4s ease ${0.2 + i * 0.06}s`,
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0 rounded-xl"
                  style={{
                    width: "38px",
                    height: "38px",
                    background: "rgba(15,28,55,0.65)",
                    border: "1px solid rgba(212,175,55,0.40)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  }}
                >
                  <f.icon style={{ width: "16px", height: "16px", color: "#D4AF37" }} />
                </div>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.82)", fontFamily: "Tajawal, Cairo, sans-serif" }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom stats bar ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10"
          style={{
            padding: "20px 56px",
            background: "rgba(2,8,23,0.50)",
            borderTop: "1px solid rgba(212,175,55,0.15)",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease 0.4s",
          }}
        >
          <div className="flex items-center justify-center gap-16">
            {[
              { value: "99.9%", label: "وقت التشغيل" },
              { value: "+50", label: "جهاز مدعوم" },
              { value: "لحظي", label: "تحديث البيانات" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    background: "linear-gradient(135deg, #D4AF37 0%, #f0d060 50%, #B8860B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "Tajawal, Cairo, sans-serif",
                    lineHeight: 1.2,
                  }}
                >
                  {s.value}
                </p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", marginTop: "2px", fontFamily: "Tajawal, Cairo, sans-serif" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
