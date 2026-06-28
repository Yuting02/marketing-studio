import React, { useState } from "react";

/**
 * Input — single-line text field. White fill, grey border, 8px radius,
 * clear black-border focus. Optional label + hint via the Field wrapper.
 */
export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  invalid = false,
  onFocus,
  onBlur,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={(e) => {
        setFocus(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        onBlur?.(e);
      }}
      style={{
        width: "100%",
        padding: "11px 14px",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-body)",
        color: "var(--text-strong)",
        background: disabled ? "var(--surface-100)" : "var(--white)",
        border: `1px solid ${
          invalid
            ? "var(--risk-text)"
            : focus
            ? "var(--ink-900)"
            : "var(--border-input)"
        }`,
        borderRadius: "var(--radius-sm)",
        outline: "none",
        boxShadow: focus && !invalid ? "var(--shadow-focus)" : "none",
        transition: "border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)",
        ...style,
      }}
      {...rest}
    />
  );
}
