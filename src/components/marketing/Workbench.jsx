import React, { useState } from "react";
import { Button } from "../core/Button.jsx";
import { Input } from "../core/Input.jsx";
import { Textarea } from "../core/Textarea.jsx";
import { Field } from "../core/Field.jsx";
import { LangToggle } from "../core/LangToggle.jsx";
import { Tag } from "../core/Tag.jsx";
import { AdCard } from "./AdCard.jsx";

// 语种分组标题（仅展示用，不影响接口字段）
const LANG_GROUPS = [
  { code: "en", title: "English Ads" },
  { code: "fr", title: "French Ads" },
];

function LangGroup({ title, items, reviewLoading }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <h3
          style={{
            fontSize: "var(--fs-h3)",
            fontWeight: "var(--fw-bold)",
            color: "var(--text-strong)",
          }}
        >
          {title}
        </h3>
        <Tag tone="muted" mono={false}>
          {items.length} 个版本
        </Tag>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "stretch" }}
        className="ms-card-grid"
      >
        {items.map((it) => (
          <AdCard key={it.id} item={it} reviewLoading={reviewLoading} />
        ))}
      </div>
    </section>
  );
}

export function Workbench({ innerRef }) {
  // 预填示例输入（来自设计 demo），但结果区默认为空
  const [product, setProduct] = useState("便携保温杯");
  const [points, setPoints] = useState("12 小时保温；一键开盖；316 不锈钢内胆");
  // 预填的示例文字显示为灰色，用户一旦改动（touched）即变黑色
  const [productTouched, setProductTouched] = useState(false);
  const [pointsTouched, setPointsTouched] = useState(false);
  const [langs, setLangs] = useState({ en: true, fr: true });

  // 生成接口状态
  const [result, setResult] = useState(null); // /api/generate 返回的 { variants }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 质检接口状态（异步、不阻塞生成）
  const [reviewResult, setReviewResult] = useState(null); // /api/review 返回的 { reviews }
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // 拿生成好的 variants 调 /api/review 做合规质检
  async function runReview(variants) {
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `质检失败（${res.status}）`);
      }
      setReviewResult(data);
    } catch (err) {
      console.error("质检失败：", err);
      setReviewError(err.message || "质检失败，请稍后重试");
    } finally {
      setReviewLoading(false);
    }
  }

  // 点「生成文案」：把表单数据 POST 给 /api/generate
  async function handleGenerate() {
    const selectedLangs = Object.keys(langs).filter((code) => langs[code]);

    const payload = {
      productName: product,
      sellingPoints: points,
      langs: selectedLangs,
    };

    setLoading(true);
    setError(null);
    setResult(null);
    setReviewResult(null);
    setReviewError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `请求失败（${res.status}）`);
      }
      setResult(data); // 成功：渲染卡片
      runReview(data.variants); // 卡片出来后自动质检（不阻塞）
    } catch (err) {
      console.error("生成失败：", err);
      setError(err.message || "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  // 把质检结果按 variantId（= variants 数组下标）建索引
  const reviewsById = new Map((reviewResult?.reviews || []).map((r) => [r.variantId, r]));

  // 把某语种的 variants 转成 AdCard item（保留全局下标用于匹配质检）
  function buildItems(code) {
    if (!result) return [];
    let n = 0;
    return result.variants
      .map((variant, index) => ({ variant, index }))
      .filter(({ variant }) => variant.lang === code)
      .map(({ variant, index }) => {
        n += 1;
        const rv = reviewsById.get(index);
        return {
          id: index,
          variantLabel: `版本 ${n}`,
          primaryText: variant.primaryText,
          headline: variant.headline,
          description: variant.description,
          cta: variant.cta,
          zh: {
            primaryText: variant.translations?.primaryText_zh,
            headline: variant.translations?.headline_zh,
            description: variant.translations?.description_zh,
          },
          review: rv
            ? {
                status: rv.status,
                score: rv.fluencyScore,
                rules: rv.rulesHit,
                suggestions: rv.suggestions,
              }
            : null,
        };
      });
  }

  return (
    <div ref={innerRef} style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "56px 24px 80px" }}>
      {/* workbench heading */}
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: "40px",
            fontWeight: "var(--fw-extrabold)",
            letterSpacing: "var(--ls-tight)",
            color: "var(--text-strong)",
          }}
        >
          工作台
        </h2>
        <p style={{ marginTop: 8, fontSize: "var(--fs-body)", color: "var(--text-muted)", lineHeight: "var(--lh-normal)" }}>
          填写产品名与核心卖点，选择目标语种，一键生成并质检多语种广告文案。
        </p>
      </div>

      {/* input panel */}
      <div
        style={{
          background: "var(--mint-100)",
          border: "1px solid var(--mint-200)",
          borderRadius: "var(--radius-lg)",
          padding: 28,
          marginBottom: 44,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="ms-input-grid">
          <Field label="产品名">
            <Input
              value={product}
              onFocus={() => {
                // 首次聚焦：清空预填示例，让用户直接输入
                if (!productTouched) {
                  setProduct("");
                  setProductTouched(true);
                }
              }}
              onChange={(e) => {
                setProduct(e.target.value);
                setProductTouched(true);
              }}
              placeholder="例如：便携保温杯"
              style={{ color: productTouched ? "var(--text-strong)" : "var(--text-gloss)" }}
            />
          </Field>
          <Field label="核心卖点">
            <Textarea
              rows={3}
              value={points}
              onFocus={() => {
                // 首次聚焦：清空预填示例，让用户直接输入
                if (!pointsTouched) {
                  setPoints("");
                  setPointsTouched(true);
                }
              }}
              onChange={(e) => {
                setPoints(e.target.value);
                setPointsTouched(true);
              }}
              placeholder="写 2-3 句，例如：12 小时保温；一键开盖；316 不锈钢内胆"
              style={{ color: pointsTouched ? "var(--text-strong)" : "var(--text-gloss)" }}
            />
          </Field>
        </div>
        <div style={{ marginTop: 20 }}>
          <Field label="目标语种">
            <LangToggle value={langs} onToggle={(c) => setLangs((p) => ({ ...p, [c]: !p[c] }))} />
          </Field>
        </div>
        <div style={{ marginTop: 22 }}>
          <Button
            variant="coral"
            size="lg"
            onClick={handleGenerate}
            disabled={loading}
            icon={
              <span aria-hidden style={{ fontSize: 17 }}>
                ✦
              </span>
            }
          >
            {loading ? "生成中…" : "生成文案"}
          </Button>
        </div>
      </div>

      {/* 生成出错 */}
      {error && (
        <div
          style={{
            marginBottom: 24,
            padding: "14px 16px",
            background: "var(--risk-bg)",
            border: "1px solid var(--risk-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--risk-text)",
            fontSize: "var(--fs-sm)",
          }}
        >
          生成失败：{error}
        </div>
      )}

      {/* results */}
      {result &&
        LANG_GROUPS.map(({ code, title }) => {
          const items = buildItems(code);
          if (items.length === 0) return null;
          return <LangGroup key={code} title={title} items={items} reviewLoading={reviewLoading} />;
        })}

      {/* 质检失败（卡片已出，质检整体失败时给个提示） */}
      {reviewError && (
        <p style={{ color: "var(--risk-text)", fontSize: "var(--fs-sm)" }}>质检失败：{reviewError}</p>
      )}
    </div>
  );
}
