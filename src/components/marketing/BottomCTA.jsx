import React from "react";
import { Button } from "../core/Button.jsx";

/* BottomCTA — 结尾 CTA + ♥ 页脚署名。 */
export function BottomCTA({ onStart }) {
  return (
    <footer style={{ background: "var(--white)", borderTop: "1px solid var(--line-200)" }}>
      <div
        style={{
          maxWidth: "var(--container-narrow)",
          margin: "0 auto",
          padding: "88px 24px 40px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "var(--fs-h1)",
            fontWeight: "var(--fw-extrabold)",
            letterSpacing: "var(--ls-tight)",
            color: "var(--text-strong)",
          }}
        >
          智能生成出海广告文案。
        </h2>
        <p
          style={{
            marginTop: 18,
            fontSize: "var(--fs-lead)",
            color: "var(--text-muted)",
            lineHeight: "var(--lh-normal)",
          }}
        >
          中文输入，英文 / 法文同步生成。<br />风险点、中文参考和修改建议一次看清。
        </p>
        <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
          <Button
            variant="coral"
            size="lg"
            onClick={onStart}
            iconRight={
              <span aria-hidden style={{ fontSize: 18, marginLeft: 2 }}>
                →
              </span>
            }
          >
            开始生成文案
          </Button>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--line-100)", padding: "22px 24px", textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: "var(--text-muted)",
          }}
        >
          <span style={{ color: "var(--accent)" }}>♥</span> Built by Yuting Guo
        </span>
      </div>
    </footer>
  );
}
