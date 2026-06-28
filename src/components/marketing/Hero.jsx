import React from "react";
import { Button } from "../core/Button.jsx";
import { Eyebrow } from "../core/Eyebrow.jsx";

/* Hero — 单列：左对齐文案 + 开始生成按钮（按用户选择去掉右侧插图）。 */
export function Hero({ onTryClick }) {
  return (
    <header style={{ background: "var(--white)" }}>
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "84px 24px 72px",
        }}
        className="ms-hero-grid"
      >
        <div style={{ maxWidth: 720 }}>
          <Eyebrow heart>Built by Yuting Guo</Eyebrow>
          <h1
            style={{
              marginTop: 20,
              fontSize: "var(--fs-display)",
              fontWeight: "var(--fw-extrabold)",
              letterSpacing: "var(--ls-tight)",
              lineHeight: "var(--lh-tight)",
              color: "var(--text-strong)",
            }}
          >
            AI出海营销<br />内容工作台
          </h1>
          <p
            style={{
              marginTop: 22,
              fontSize: "var(--fs-lead)",
              color: "var(--text-muted)",
              lineHeight: "var(--lh-normal)",
              maxWidth: 560,
            }}
          >
            用中文输入产品卖点与投放需求，AI 自动生成适配不同市场的广告文案，并同步完成语气、语法、文化表达与合规风险质检。
          </p>
          <div style={{ marginTop: 30 }}>
            <Button
              variant="coral"
              size="lg"
              onClick={onTryClick}
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
      </div>
    </header>
  );
}
