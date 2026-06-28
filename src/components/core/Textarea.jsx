import React, { useState } from "react";

/** Textarea — multi-line, matches Input styling. */
export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  invalid = false,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: "100%",
        padding: "12px 14px",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-body)",
        lineHeight: "var(--lh-normal)",
        color: "var(--text-strong)",
        background: disabled ? "var(--surface-100)" : "var(--white)",
        border: `1px solid ${
          invalid ? "var(--risk-text)" : focus ? "var(--ink-900)" : "var(--border-input)"
        }`,
        borderRadius: "var(--radius-sm)",
        outline: "none",
        resize: "vertical",
        boxShadow: focus && !invalid ? "var(--shadow-focus)" : "none",
        transition: "border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)",
        ...style,
      }}
      {...rest}
    />
  );
}
