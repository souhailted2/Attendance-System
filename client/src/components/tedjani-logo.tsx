import { useId } from "react";

interface TejdaniLogoProps {
  variant?: "sidebar" | "full";
  onDark?: boolean;
  className?: string;
}

function ClockIcon({ size, gradId }: { size: number; gradId: string }) {
  return (
    <svg
      viewBox="0 0 92 82"
      width={size}
      height={Math.round(size * 82 / 92)}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${gradId}-lg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5e47a" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6408" />
        </linearGradient>
        <radialGradient id={`${gradId}-rg`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#f7ea88" />
          <stop offset="55%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9a7210" />
        </radialGradient>
        <filter id={`${gradId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ─── Human figure — upper-left, overlapping clock ring ─── */}
      {/* Head */}
      <circle
        cx="23" cy="15" r="6.5"
        fill={`url(#${gradId}-rg)`}
        filter={`url(#${gradId}-glow)`}
      />
      {/* Neck / upper body */}
      <path
        d="M23 21.5 Q22 27 21 34"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.8"
        fill="none" strokeLinecap="round"
      />
      {/* Left arm — raised upward */}
      <path
        d="M22 26 Q15 20 10 13"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.8"
        fill="none" strokeLinecap="round"
      />
      {/* Right arm — down toward clock */}
      <path
        d="M23 27 Q31 32 36 38"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.5"
        fill="none" strokeLinecap="round"
      />
      {/* Left leg */}
      <path
        d="M21 34 Q17 43 15 51"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.5"
        fill="none" strokeLinecap="round"
      />
      {/* Right leg */}
      <path
        d="M21 34 Q25 43 28 51"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.5"
        fill="none" strokeLinecap="round"
      />

      {/* ─── Clock body — center at (57, 47) r=30 ─── */}
      {/* Outer ring */}
      <circle
        cx="57" cy="47" r="30"
        fill="none"
        stroke={`url(#${gradId}-lg)`}
        strokeWidth="3.2"
        filter={`url(#${gradId}-glow)`}
      />
      {/* Inner subtle background fill */}
      <circle cx="57" cy="47" r="27" fill="rgba(212,175,55,0.05)" />

      {/* Tick marks at 12, 3, 6, 9 */}
      <line x1="57" y1="18" x2="57" y2="25"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="86" y1="47" x2="79" y2="47"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="57" y1="76" x2="57" y2="69"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="28" y1="47" x2="35" y2="47"
        stroke={`url(#${gradId}-lg)`} strokeWidth="2.8" strokeLinecap="round" />

      {/* ─── Checkmark — white inside clock ─── */}
      <polyline
        points="42,47 51,57 71,35"
        stroke="white"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TejdaniLogo({
  variant = "full",
  onDark = true,
  className = "",
}: TejdaniLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `tj-${uid}`;
  const isSidebar = variant === "sidebar";

  const iconSize = isSidebar ? 42 : 76;
  const tedjaniColor = onDark ? "rgba(255,255,255,0.95)" : "#1B2434";
  const gap = isSidebar ? "8px" : "14px";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        fontFamily: "Tajawal, Cairo, 'IBM Plex Sans Arabic', sans-serif",
      }}
    >
      <ClockIcon size={iconSize} gradId={gradId} />

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        {/* TEDJANI */}
        <span
          style={{
            fontWeight: 800,
            fontSize: isSidebar ? "17px" : "30px",
            color: tedjaniColor,
            letterSpacing: "0.06em",
            lineHeight: 1,
          }}
        >
          TEDJANI
        </span>

        {/* ATTENDIX */}
        <span
          style={{
            fontWeight: 600,
            fontSize: isSidebar ? "10.5px" : "17px",
            color: "#D4AF37",
            letterSpacing: "0.22em",
            lineHeight: 1.15,
            marginTop: isSidebar ? "2px" : "3px",
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
                background:
                  "linear-gradient(90deg, rgba(212,175,55,0.55), rgba(212,175,55,0.10))",
                marginTop: "6px",
                marginBottom: "5px",
                width: "100%",
              }}
            />
            <span
              style={{
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: "9.5px",
                color: "rgba(212,175,55,0.60)",
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
