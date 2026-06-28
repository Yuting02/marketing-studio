import React from "react";

/**
 * LangToggle — segmented multi-select for target languages.
 * Selected = dark fill + white text + check; unselected = white + grey border.
 * value is an object like { en: true, fr: false }.
 */
export function LangToggle({
  options = [
    { code: "en", label: "English" },
    { code: "fr", label: "French" },
  ],
  value = {},
  onToggle,
  style = {},
}) {
  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", ...style }}>
      {options.map((opt) => {
        const active = !!value[opt.code];
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => onToggle && onToggle(opt.code)}
            aria-pressed={active}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-semibold)",
              color: active ? "var(--white)" : "var(--text-body)",
              background: active ? "var(--ink-900)" : "var(--white)",
              border: `1px solid ${active ? "var(--ink-900)" : "var(--border-input)"}`,
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              transition: "all var(--dur) var(--ease-out)",
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 16,
                height: 16,
                borderRadius: "var(--radius-pill)",
                border: `1.5px solid ${active ? "var(--white)" : "var(--grey-300)"}`,
                background: active ? "var(--white)" : "transparent",
                color: "var(--ink-900)",
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {active ? "✓" : ""}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
