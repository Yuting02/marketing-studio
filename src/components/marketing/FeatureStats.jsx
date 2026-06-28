import React from "react";
import { Eyebrow } from "../core/Eyebrow.jsx";
import { Stat } from "../core/Stat.jsx";
import { Card } from "../core/Card.jsx";

/* FeatureStats — proof 区：左侧大数字 + 右侧引用卡片（mint 底）。 */
export function FeatureStats() {
  const stats = [
    { value: "3 秒", label: "生成首版文案" },
    { value: "6 个版本", label: "一次输出广告变体" },
    { value: "2 个语种", label: "支持英文 / 法文同步生成" },
    { value: "86+", label: "地道度评分参考" },
  ];
  return (
    <section
      style={{
        background: "var(--mint-100)",
        borderTop: "1px solid var(--mint-200)",
        borderBottom: "1px solid var(--mint-200)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "72px 24px",
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 56,
          alignItems: "center",
        }}
        className="ms-feature-grid"
      >
        <div>
          <Eyebrow>为真实出海营销团队打造</Eyebrow>
          <h2
            style={{
              marginTop: 18,
              fontSize: "var(--fs-h1)",
              fontWeight: "var(--fw-extrabold)",
              letterSpacing: "var(--ls-tight)",
              color: "var(--text-strong)",
              maxWidth: 460,
            }}
          >
            让多语种广告文案产出更快、更稳。
          </h2>
          <div
            style={{
              marginTop: 36,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px 40px",
              maxWidth: 460,
            }}
          >
            {stats.map((s) => (
              <Stat key={s.value} value={s.value} label={s.label} />
            ))}
          </div>
        </div>

        <Card style={{ position: "relative", padding: "28px 28px 26px" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 24,
              bottom: 24,
              width: 3,
              background: "var(--accent)",
              borderRadius: 3,
            }}
          ></div>
          <p
            style={{
              fontSize: "var(--fs-lead)",
              color: "var(--text-body)",
              lineHeight: "var(--lh-normal)",
              fontWeight: 500,
              paddingLeft: 8,
            }}
          >
            “以前写英文和法文广告要来回改很多次。现在可以先生成版本，再看风险标签和中文参考，判断起来快很多。”
          </p>
          <div
            style={{
              marginTop: 22,
              paddingLeft: 8,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--text-strong)" }}>
              Yuting Guo
            </span>
            <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              出海营销内容工作台
            </span>
          </div>
        </Card>
      </div>
    </section>
  );
}
