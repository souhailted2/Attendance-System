import { useId } from "react";

interface TejdaniLogoProps {
  variant?: "sidebar" | "full";
  className?: string;
}

function ClockIcon({ size, gid }: { size: number; gid: string }) {
  const h = Math.round(size * 82 / 92);
  return (
    <svg
      viewBox="0 0 92 82"
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${gid}-a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7e97a" />
          <stop offset="48%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6408" />
        </linearGradient>
        <radialGradient id={`${gid}-b`} cx="38%" cy="28%" r="62%">
          <stop offset="0%" stopColor="#f9ee90" />
          <stop offset="55%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9a7210" />
        </radialGradient>
        <filter id={`${gid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Human figure (upper-left, overlapping clock ring) ── */}
      {/* Head */}
      <circle cx="23" cy="15" r="6.5" fill={`url(#${gid}-b)`} filter={`url(#${gid}-glow)`} />
      {/* Body */}
      <path d="M23 21.5 Q22 27 21 34" stroke={`url(#${gid}-a)`} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Left arm — raised */}
      <path d="M22 26 Q15 20 10 13" stroke={`url(#${gid}-a)`} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Right arm — toward clock */}
      <path d="M23 27 Q30 32 36 37" stroke={`url(#${gid}-a)`} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* Left leg */}
      <path d="M21 34 Q17 43 15 51" stroke={`url(#${gid}-a)`} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* Right leg */}
      <path d="M21 34 Q25 43 28 51" stroke={`url(#${gid}-a)`} strokeWidth="2.6" fill="none" strokeLinecap="round" />

      {/* ── Clock ring — center (57, 47) r=30 ── */}
      <circle
        cx="57" cy="47" r="30"
        fill="rgba(212,175,55,0.05)"
        stroke={`url(#${gid}-a)`}
        strokeWidth="3.2"
        filter={`url(#${gid}-glow)`}
      />
      {/* Tick marks: 12 / 3 / 6 / 9 */}
      <line x1="57" y1="17" x2="57" y2="24" stroke={`url(#${gid}-a)`} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="87" y1="47" x2="80" y2="47" stroke={`url(#${gid}-a)`} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="57" y1="77" x2="57" y2="70" stroke={`url(#${gid}-a)`} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="27" y1="47" x2="34" y2="47" stroke={`url(#${gid}-a)`} strokeWidth="2.8" strokeLinecap="round" />

      {/* ── Checkmark — white, inside clock ── */}
      <polyline
        points="42,47 51,57 72,35"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TejdaniLogo({ variant = "full", className = "" }: TejdaniLogoProps) {
  const raw = useId();
  const gid = `tj${raw.replace(/:/g, "")}`;
  const isSidebar = variant === "sidebar";

  const iconSize  = isSidebar ? 44 : 76;
  const gap       = isSidebar ? "9px" : "14px";
  const szMain    = isSidebar ? "18px" : "30px";
  const szSub     = isSidebar ? "11px" : "17px";
  const szTag     = "9.5px";
  const mtSub     = isSidebar ? "2px" : "3px";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        fontFamily: "Tajawal, Cairo, 'IBM Plex Sans Arabic', sans-serif",
        userSelect: "none",
      }}
    >
      <ClockIcon size={iconSize} gid={gid} />

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        {/* TEDJANI — always white so it's visible on any dark background */}
        <span
          data-testid="text-logo-tedjani"
          style={{
            fontWeight: 800,
            fontSize: szMain,
            color: "rgba(255,255,255,0.95)",
            letterSpacing: "0.055em",
            lineHeight: 1,
          }}
        >
          TEDJANI
        </span>

        {/* ATTENDIX — gold */}
        <span
          data-testid="text-logo-attendix"
          style={{
            fontWeight: 600,
            fontSize: szSub,
            color: "#D4AF37",
            letterSpacing: "0.22em",
            lineHeight: 1.15,
            marginTop: mtSub,
          }}
        >
          ATTENDIX
        </span>

        {/* Tagline — full variant only */}
        {!isSidebar && (
          <>
            <div
              style={{
                height: "1px",
                background: "linear-gradient(90deg, rgba(212,175,55,0.50), rgba(212,175,55,0.08))",
                marginTop: "6px",
                marginBottom: "5px",
              }}
            />
            <span
              style={{
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: szTag,
                color: "rgba(212,175,55,0.58)",
                letterSpacing: "0.06em",
                lineHeight: 1.3,
              }}
            >
              Smart Attendance &amp; Workforce Management
            </span>
          </>
        )}
      </div>
    </div>
  );
}
