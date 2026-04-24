interface TejdaniLogoProps {
  variant?: "sidebar" | "full";
  className?: string;
}

export function TejdaniLogo({ variant = "full", className = "" }: TejdaniLogoProps) {
  const isSidebar = variant === "sidebar";

  const style: React.CSSProperties = isSidebar
    ? {
        width: "100%",
        maxHeight: "72px",
        height: "auto",
        objectFit: "contain",
        objectPosition: "center",
        mixBlendMode: "screen",
        filter: "drop-shadow(0 2px 16px rgba(212,175,55,0.45))",
      }
    : {
        width: "100%",
        maxWidth: "400px",
        height: "auto",
        objectFit: "contain",
        objectPosition: "center",
        mixBlendMode: "screen",
        filter: "drop-shadow(0 6px 28px rgba(212,175,55,0.40))",
      };

  return (
    <img
      src="/logo-matrix.png?v=1"
      alt="TEDJANI ATTENDIX"
      data-testid="img-logo"
      className={className}
      style={style}
      draggable={false}
    />
  );
}
