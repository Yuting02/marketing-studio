import React from "react";

/**
 * Button — primary actions across the workbench.
 * Variants: coral (accent), dark (black), secondary (outline), ghost.
 * Sizes: sm | md | lg. Optional leading/trailing icon. Capsule by default.
 */
export function Button({
  children,
  variant = "coral",
  size = "md",
  pill = true,
  icon = null,
  iconRight = null,
  disabled = false,
  type = "button",
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: "8px 16px", fontSize: "var(--fs-sm)", gap: "6px", height: 36 },
    md: { padding: "11px 22px", fontSize: "var(--fs-body)", gap: "8px", height: 44 },
    lg: { padding: "15px 30px", fontSize: "var(--fs-lead)", gap: "10px", height: 54 },
  };
  const variants = {
    coral: {
      background: "var(--accent)",
      color: "var(--text-on-coral)",
      border: "1px solid var(--accent)",
    },
    dark: {
      background: "var(--ink-900)",
      color: "var(--white)",
      border: "1px solid var(--ink-900)",
    },
    secondary: {
      background: "var(--white)",
      color: "var(--text-strong)",
      border: "1px solid var(--border-input)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-strong)",
      border: "1px solid transparent",
    },
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.coral;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`ds-btn ds-btn--${variant}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        padding: s.padding,
        minHeight: s.height,
        fontFamily: "var(--font-sans)",
        fontSize: s.fontSize,
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1,
        letterSpacing: "0.005em",
        borderRadius: pill ? "var(--radius-pill)" : "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background var(--dur) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur) var(--ease-out)",
        ...v,
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: "inline-flex", margin: "-2px 0" }}>{icon}</span>}
      {children}
      {iconRight && <span style={{ display: "inline-flex", margin: "-2px 0" }}>{iconRight}</span>}
    </button>
  );
}
