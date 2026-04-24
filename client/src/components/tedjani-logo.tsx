interface TejdaniLogoProps {
  variant?: "sidebar" | "full";
  className?: string;
}

export function TejdaniLogo({ variant = "full", className = "" }: TejdaniLogoProps) {
  const isSidebar = variant === "sidebar";

  const style: React.CSSProperties = isSidebar
    ? {
        width: "100%",
        maxHeight: "58px",
        height: "auto",
        objectFit: "contain",
        objectPosition: "center",
        filter: "drop-shadow(0 2px 12px rgba(212,175,55,0.30))",
      }
    : {
        width: "100%",
        maxWidth: "520px",
        height: "auto",
        objectFit: "contain",
        objectPosition: "center",
        filter: "drop-shadow(0 8px 32px rgba(212,175,55,0.32))",
      };

  return (
    <img
      src="/logo-horizontal.png"
      alt="TEDJANI ATTENDIX"
      data-testid="img-logo"
      className={className}
      style={style}
      draggable={false}
    />
  );
}
