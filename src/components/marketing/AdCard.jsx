import React, { useState } from "react";
import { Card } from "../core/Card.jsx";
import { Badge } from "../core/Badge.jsx";
import { Tag } from "../core/Tag.jsx";

/* AdCard — 一条广告变体：4 字段 + 中文 gloss + 质检（徽章/评分/规则/建议）+ 复制。
 *
 * 数据保真原则（团队要求，勿违反）：
 *   后端返回的所有数据 —— primaryText / headline / description / cta / 中文译文 gloss /
 *   文案自然度评分 score / 修改建议 suggestion —— 一律原样显示，绝不在前端自行润色或翻译。
 *   唯一允许的两处转换（均为团队明确要求，且不触碰广告正文）：
 *     1) 规则「码」→ 中文类型标签：length:description → 长度超限(描述)（命中的具体词原样保留）
 *     2) UI 生成的版本序号：版本 1 / 版本 2 …（在 Workbench 里按语种顺序生成）
 */

// 把后端返回的规则码翻译成中文标签（不翻译命中的具体词，原样保留）
const RULE_FIELD_ZH = { primaryText: "主文案", headline: "标题", description: "描述" };
function ruleLabel(rule) {
  if (rule.startsWith("length:")) {
    const field = rule.slice("length:".length);
    return `长度超限(${RULE_FIELD_ZH[field] || field})`;
  }
  if (rule.startsWith("banned:")) {
    return `违禁词: ${rule.slice("banned:".length)}`;
  }
  if (rule === "sensitive") return "敏感/合规风险";
  if (rule === "fluency") return "地道度偏低";
  return rule;
}

function FieldBlock({ label, value, gloss }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: "var(--fs-micro)",
          fontWeight: 600,
          letterSpacing: "var(--ls-wide)",
          color: "var(--text-muted)",
          marginBottom: 4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--fs-sm)",
          color: "var(--text-strong)",
          fontWeight: 500,
          lineHeight: "var(--lh-snug)",
        }}
      >
        {value}
      </div>
      {gloss && (
        <div
          style={{
            fontSize: "var(--fs-caption)",
            color: "var(--text-gloss)",
            lineHeight: "var(--lh-relaxed)",
            marginTop: 3,
          }}
        >
          {gloss}
        </div>
      )}
    </div>
  );
}

export function AdCard({ item, reviewLoading }) {
  const [copied, setCopied] = useState(false);
  const r = item.review; // 质检结果，可能为 null（尚未返回 / 质检失败）

  function copy() {
    const text = `主文案：${item.primaryText}\n标题：${item.headline}\n描述：${item.description}\n引导类别(CTA)：${item.cta}`;
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const rules = r?.rules || [];

  return (
    <Card interactive padding="0" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid var(--line-100)",
        }}
      >
        <span
          style={{
            fontSize: "var(--fs-caption)",
            fontWeight: 700,
            color: "var(--text-strong)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {item.variantLabel}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {r && <Badge status={r.status} />}
          <button
            type="button"
            onClick={copy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-micro)",
              fontWeight: 600,
              color: copied ? "var(--pass-text)" : "var(--text-muted)",
              background: copied ? "var(--pass-bg)" : "var(--surface-100)",
              border: `1px solid ${copied ? "var(--pass-border)" : "var(--line-200)"}`,
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              transition: "all var(--dur) var(--ease-out)",
            }}
          >
            {copied ? "✓ 已复制" : "复制"}
          </button>
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "16px 16px 4px" }}>
        <FieldBlock label="主文案" value={item.primaryText} gloss={item.zh.primaryText} />
        <FieldBlock label="标题" value={item.headline} gloss={item.zh.headline} />
        <FieldBlock label="描述" value={item.description} gloss={item.zh.description} />
        <FieldBlock label="引导 · CTA" value={item.cta} />
      </div>

      {/* footer / QC */}
      <div
        style={{
          marginTop: "auto",
          padding: "12px 16px 16px",
          borderTop: "1px solid var(--line-100)",
          background: "var(--surface-50)",
        }}
      >
        {r ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: rules.length ? 10 : 8,
              }}
            >
              <span
                style={{
                  fontSize: "var(--fs-micro)",
                  fontWeight: 600,
                  letterSpacing: "var(--ls-wide)",
                  color: "var(--text-muted)",
                }}
              >
                文案自然度评分
              </span>
              {typeof r.score === "number" ? (
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "var(--accent)",
                      letterSpacing: "var(--ls-tight)",
                    }}
                  >
                    {r.score}
                  </span>
                  <span style={{ fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>/100</span>
                </span>
              ) : (
                <span style={{ fontSize: "var(--fs-micro)", color: "var(--text-muted)" }}>—</span>
              )}
            </div>

            {rules.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {rules.map((rule, i) => (
                  <Tag key={i} mono={false}>
                    {ruleLabel(rule)}
                  </Tag>
                ))}
              </div>
            )}

            {r.suggestions && r.suggestions.length > 0 && (
              <div
                style={{
                  fontSize: "var(--fs-caption)",
                  color: r.status === "risk" ? "var(--text-body)" : "var(--text-muted)",
                  lineHeight: "var(--lh-normal)",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-strong)" }}>修改建议 · </span>
                {r.suggestions.map((s, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {s}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : reviewLoading ? (
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>质检中…</span>
        ) : null}
      </div>
    </Card>
  );
}
