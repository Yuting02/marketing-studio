import React from "react";

/** Field — label + optional hint wrapper around a form control. */
export function Field({ label, hint, htmlFor, children, style = {} }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }}
    >
      {label && (
        <span
          style={{
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-semibold)",
            color: "var(--text-strong)",
          }}
        >
          {label}
        </span>
      )}
      {children}
      {hint && (
        <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}
