import React from "react";

/**
 * Badge — QC status pill. pass = soft green, risk = soft orange (never red).
 */
export function Badge({ status = "pass", children, style = {} }) {
  const map = {
    pass: { bg: "var(--pass-bg)", fg: "var(--pass-text)", bd: "var(--pass-border)", dot: "var(--pass-strong)", label: "通过" },
    risk: { bg: "var(--risk-bg)", fg: "var(--risk-text)", bd: "var(--risk-border)", dot: "var(--risk-strong)", label: "风险" },
    neutral: { bg: "var(--surface-100)", fg: "var(--text-muted)", bd: "var(--line-200)", dot: "var(--grey-400)", label: "" },
  };
  const c = map[status] || map.pass;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px 3px 9px",
        fontSize: "var(--fs-caption)",
        fontWeight: "var(--fw-semibold)",
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        borderRadius: "var(--radius-pill)",
        lineHeight: 1.4,
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--radius-pill)",
          background: c.dot,
        }}
      />
      {children || c.label}
    </span>
  );
}
