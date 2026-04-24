interface TejdaniLogoProps {
  variant?: "sidebar" | "full";
  className?: string;
}

export function TejdaniLogo({ variant = "full", className = "" }: TejdaniLogoProps) {
  const isSidebar = variant === "sidebar";

  const style: React.CSSProperties = isSidebar
    ? {
        width: "100%",
        maxHeight: "64px",
        height: "auto",
        objectFit: "contain",
        objectPosition: "center",
        mixBlendMode: "screen",
        filter: "drop-shadow(0 2px 12px rgba(212,175,55,0.35))",
      }
    : {
        width: "100%",
        maxWidth: "380px",
        height: "auto",
        objectFit: "contain",
        objectPosition: "center",
        mixBlendMode: "screen",
        filter: "drop-shadow(0 6px 28px rgba(212,175,55,0.40))",
      };

  return (
    <img
      src="/logo-tedjani.png?v=3"
      alt="TEDJANI ATTENDIX"
      data-testid="img-logo"
      className={className}
      style={style}
      draggable={false}
    />
  );
}
