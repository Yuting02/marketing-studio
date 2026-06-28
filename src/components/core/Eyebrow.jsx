import React from "react";

/**
 * Eyebrow — small low-contrast pill label (e.g. "为真实出海营销团队打造",
 * or the "♥ Built by Yuting Guo" signature). Restrained, uppercase-ish.
 */
export function Eyebrow({ children, heart = false, style = {} }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        fontSize: "var(--fs-micro)",
        fontWeight: "var(--fw-semibold)",
        letterSpacing: "var(--ls-wide)",
        color: "var(--text-muted)",
        background: "var(--surface-100)",
        border: "1px solid var(--line-200)",
        borderRadius: "var(--radius-pill)",
        ...style,
      }}
    >
      {heart && <span style={{ color: "var(--accent)" }}>♥</span>}
      {children}
    </span>
  );
}
