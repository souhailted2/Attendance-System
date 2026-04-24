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
    <div className="min-h-screen flex overflow-hidden" dir="rtl" style={{ background: "#F5F6FA" }}>

      {/* ===== RIGHT PANEL: Form ===== */}
      <div
        className="relative z-10 flex items-center justify-center w-full lg:w-[45%] p-6 lg:p-10"
        style={{ background: "#F5F6FA" }}
      >
        <div
          className="w-full max-w-[360px]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Mobile only: logo */}
          <div className="flex flex-col items-center mb-6 lg:hidden">
            <img
              src="/logo-horizontal.png"
              className="h-auto object-contain"
              style={{ width: "200px", filter: "drop-shadow(0 2px 10px rgba(212,175,55,0.22))" }}
              alt="TEDJANI ATTENDIX"
            />
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: "#ffffff",
              border: "1px solid #e8eaee",
              boxShadow: "0 4px 24px rgba(13,19,33,0.10), 0 1px 4px rgba(13,19,33,0.06)",
            }}
          >
            {/* Header */}
            <div className="mb-7 text-right">
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: "#0D1321", fontFamily: "Tajawal, Cairo, sans-serif" }}
              >
                أهلاً بك
              </h2>
              <p className="text-sm" style={{ color: "#7a8494" }}>
                سجّل دخولك للمتابعة
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium block text-right"
                  style={{ color: "#374151" }}
                >
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <User
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "#9ca3af" }}
                  />
                  <Input
                    id="username"
                    data-testid="input-username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    className="pr-9 h-10 text-sm rounded-lg text-right"
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      color: "#111827",
                    }}
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
                  className="text-sm font-medium block text-right"
                  style={{ color: "#374151" }}
                >
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "#9ca3af" }}
                  />
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    placeholder="••••••••"
                    className="pr-9 h-10 text-sm rounded-lg text-right"
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      color: "#111827",
                    }}
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
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5"
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
                className="w-full h-11 text-sm font-bold rounded-xl border-0 mt-1"
                disabled={loading}
                data-testid="button-login-submit"
                style={{
                  background: loading
                    ? "rgba(212,175,55,0.30)"
                    : "linear-gradient(135deg, #D4AF37 0%, #c9a227 50%, #B8860B 100%)",
                  boxShadow: loading ? "none" : "0 4px 18px rgba(212,175,55,0.38), 0 1px 3px rgba(0,0,0,0.08)",
                  color: "#1a1200",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "rgba(26,18,0,0.25)", borderTopColor: "rgba(26,18,0,0.70)" }}
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
          <p
            className="text-xs text-center mt-5"
            style={{ color: "#9ca3af" }}
          >
            جميع الحقوق محفوظة — TEDJANI ATTENDIX
          </p>
        </div>
      </div>

      {/* ===== LEFT PANEL: Branding (desktop only) ===== */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] p-14 relative overflow-hidden"
        style={{
          background: "linear-gradient(155deg, #0D1321 0%, #111827 55%, #0f1a2e 100%)",
        }}
      >
        {/* Subtle gold radial glow — top center */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-80px",
            right: "50%",
            transform: "translateX(50%)",
            width: "700px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(212,175,55,0.09) 0%, transparent 65%)",
            filter: "blur(8px)",
          }}
        />
        {/* Subtle geometric grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top: Logo */}
        <div
          className="relative z-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-12px)",
            transition: "opacity 0.55s ease 0.05s, transform 0.55s ease 0.05s",
          }}
        >
          <img
            src="/logo-horizontal.png"
            alt="TEDJANI ATTENDIX"
            style={{
              width: "260px",
              maxWidth: "80%",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 6px 28px rgba(212,175,55,0.32))",
            }}
          />

          {/* Gold separator line */}
          <div
            className="mt-7 mb-0"
            style={{
              width: "56px",
              height: "2px",
              background: "linear-gradient(90deg, #D4AF37, rgba(212,175,55,0.1))",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Middle: Tagline + Features */}
        <div
          className="relative z-10 flex-1 flex flex-col justify-center py-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
          }}
        >
          {/* Tagline */}
          <p
            className="text-lg font-semibold mb-1"
            style={{ color: "rgba(255,255,255,0.90)", fontFamily: "Tajawal, Cairo, sans-serif", letterSpacing: "0.01em" }}
          >
            نظام الحضور والانصراف الذكي
          </p>
          <p
            className="text-sm mb-9 leading-relaxed max-w-sm"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            منصة متكاملة لإدارة حضور الموظفين مع تكامل أجهزة ZKTeco البيومترية وتقارير فورية.
          </p>

          {/* Features list */}
          <div className="space-y-3.5">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateX(0)" : "translateX(-10px)",
                  transition: `opacity 0.4s ease ${0.25 + i * 0.07}s, transform 0.4s ease ${0.25 + i * 0.07}s`,
                }}
              >
                {/* Icon badge */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                  style={{
                    background: "rgba(212,175,55,0.12)",
                    border: "1px solid rgba(212,175,55,0.22)",
                  }}
                >
                  <f.icon className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.58)" }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Stats bar */}
        <div
          className="relative z-10"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease 0.35s",
          }}
        >
          {/* Gold separator */}
          <div
            className="mb-7"
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.30) 40%, rgba(212,175,55,0.30) 60%, transparent)",
            }}
          />
          <div className="flex items-center gap-10">
            {[
              { value: "99.9%", label: "وقت التشغيل" },
              { value: "+50", label: "جهاز مدعوم" },
              { value: "لحظي", label: "تحديث البيانات" },
            ].map((s, i) => (
              <div key={i} className="text-right">
                <p
                  className="text-2xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37 0%, #f0d060 50%, #B8860B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "Tajawal, Cairo, sans-serif",
                  }}
                >
                  {s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.32)" }}>
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
