interface TejdaniLogoProps {
  variant?: "sidebar" | "full";
  className?: string;
}

export function TejdaniLogo({ variant = "full", className = "" }: TejdaniLogoProps) {
  const isSidebar = variant === "sidebar";

  const style: React.CSSProperties = isSidebar
    ? {
        width: "100%",
        maxHeight: "70px",
        height: "auto",
        objectFit: "contain",
        objectPosition: "center",
        mixBlendMode: "screen",
        filter: "drop-shadow(0 2px 14px rgba(212,175,55,0.35))",
      }
    : {
        width: "100%",
        maxWidth: "560px",
        height: "auto",
        objectFit: "contain",
        objectPosition: "center",
        mixBlendMode: "screen",
        filter: "drop-shadow(0 8px 36px rgba(212,175,55,0.40))",
      };

  return (
    <img
      src="/logo-tedjani.png"
      alt="TEDJANI ATTENDIX"
      data-testid="img-logo"
      className={className}
      style={style}
      draggable={false}
    />
  );
}
