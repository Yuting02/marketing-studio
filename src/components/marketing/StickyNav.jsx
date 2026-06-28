import React from "react";

/* StickyNav — 嵌在 hero 里的署名；滚动越过 hero 后固定滑入。 */
export function StickyNav({ visible }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(180%) blur(8px)",
        WebkitBackdropFilter: "saturate(180%) blur(8px)",
        borderBottom: "1px solid var(--line-200)",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        transition:
          "transform var(--dur-slow) var(--ease-out), opacity var(--dur-slow) var(--ease-out)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-semibold)",
            color: "var(--text-muted)",
          }}
        >
          <span style={{ color: "var(--accent)" }}>♥</span> Built by Yuting Guo
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-bold)",
              color: "var(--text-strong)",
            }}
          >
            AI出海营销内容工作台
          </span>
        </div>
      </div>
    </div>
  );
}
