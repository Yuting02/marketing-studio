import React, { useState } from "react";

/**
 * Card — white surface, light grey border, 12px radius, restrained shadow.
 * Optional hover lift (interactive=true) for actionable cards.
 */
export function Card({
  children,
  interactive = false,
  padding = "var(--space-5)",
  radius = "var(--radius-md)",
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${hover ? "var(--grey-300)" : "var(--border-card)"}`,
        borderRadius: radius,
        padding,
        boxShadow: hover ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transform: hover ? "translateY(-2px)" : "none",
        transition: "all var(--dur) var(--ease-out)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
