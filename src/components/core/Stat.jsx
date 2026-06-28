import React from "react";

/**
 * Stat — big coral number + short label. For the feature/proof section.
 */
export function Stat({ value, label, align = "left", style = {} }) {
  return (
    <div style={{ textAlign: align, ...style }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.5rem, 4vw, 3.25rem)",
          fontWeight: "var(--fw-extrabold)",
          lineHeight: 1,
          letterSpacing: "var(--ls-tight)",
          color: "var(--accent)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: "10px",
          fontSize: "var(--fs-sm)",
          color: "var(--text-muted)",
          lineHeight: "var(--lh-snug)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
