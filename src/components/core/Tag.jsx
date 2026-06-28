import React from "react";

/**
 * Tag — small low-key pill for QC rule codes (e.g. banned:best, length:headline).
 * Mono font, light surface, not attention-grabbing. tone: "risk" | "muted".
 */
export function Tag({ children, tone = "risk", mono = true, style = {} }) {
  const tones = {
    risk: { bg: "var(--risk-bg)", fg: "var(--risk-text)", bd: "var(--risk-border)" },
    muted: { bg: "var(--surface-100)", fg: "var(--text-muted)", bd: "var(--line-200)" },
  };
  const c = tones[tone] || tones.risk;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: "var(--fs-micro)",
        fontWeight: "var(--fw-medium)",
        letterSpacing: mono ? "-0.01em" : 0,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        borderRadius: "var(--radius-xs)",
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
