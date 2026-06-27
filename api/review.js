import OpenAI from "openai";

// 质检节点：对 /api/generate 返回的 variants 做「混合判定」。
//   代码层（确定性、零成本）：①字段长度 ②违禁词
//   LLM 层（语义判断）：③敏感/合规风险 ④地道度评分 + 一条中文建议
//   合并：每条变体输出 { variantId, status, rulesHit, suggestions, fluencyScore }
// 设计与提示词严格照 docs/prompts.md「质检节点 review」那一节。

// ——————————————————————————————————————————————
// 规则配置（规则即配置：改规则只改这一处，无需动逻辑）
// ——————————————————————————————————————————————
const REVIEW_CONFIG = {
  // 各字段推荐字符上限
  maxLengths: { primaryText: 125, headline: 40, description: 30 },
  // 绝对化 / 夸大违禁词（大小写不敏感、整词匹配）。目前以英文为主，可按需扩展法语词
  bannedWords: [
    "best",
    "#1",
    "no.1",
    "number one",
    "guaranteed",
    "guarantee",
    "100%",
    "miracle",
    "cheapest",
    "risk-free",
  ],
  // 地道度低于此值算风险。调高更严（误杀↑漏放↓），调低更松（漏放↑误杀↓）
  fluencyThreshold: 70,
};

// 生成节点用哪个模型，这里沿用同一套候选
const CANDIDATE_MODELS = ["gpt-4o-mini", "gpt-4o"];

// ——————————————————————————————————————————————
// 代码层规则
// ——————————————————————————————————————————————

// 规则①：任一字段超过推荐上限 → 返回 ["length:字段名", ...]
function findLengthIssues(variant) {
  const hits = [];
  for (const field of ["primaryText", "headline", "description"]) {
    const value = variant[field] || "";
    if (value.length > REVIEW_CONFIG.maxLengths[field]) {
      hits.push(`length:${field}`);
    }
  }
  return hits;
}

// 规则②：命中违禁词 → 返回 ["banned:词", ...]（大小写不敏感、整词匹配）
function findBannedWords(text) {
  const hits = [];
  for (const word of REVIEW_CONFIG.bannedWords) {
    // 转义正则特殊字符；用「前后不是单词字符」当边界，避免误伤 bestseller 之类
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<!\\w)${escaped}(?!\\w)`, "i");
    if (re.test(text)) {
      hits.push(`banned:${word}`);
    }
  }
  return hits;
}

// ——————————————————————————————————————————————
// LLM 层（提示词与 schema 照抄 docs/prompts.md）
// ——————————————————————————————————————————————
const REVIEW_SYSTEM_PROMPT =
  "You are a strict advertising-compliance and language-quality reviewer for Meta ads in overseas markets. Judge whether copy contains sensitive or non-compliant content (discrimination, unverifiable medical/health claims, false or misleading statements), and how native and fluent it reads to a first-language speaker. Be strict but fair.";

function buildReviewUserPrompt(variantsForLlm) {
  return `Review these ad variants: ${JSON.stringify(variantsForLlm)}

Each variant's language is given by its \`lang\` field: en = English, fr = French. Treat this as ground truth — never guess the language and never call it anything else (e.g. do not say "German").

For EACH variant (by id), return:
- sensitiveRisk: true if it has discriminatory / medical-overclaiming / false-or-misleading content, else false
- sensitiveReason: if true, a short reason in Chinese (quote any offending phrase verbatim in its original language); else ""
- fluencyScore: 0-100 — how native and natural it reads in ITS OWN language (per the lang field)
- suggestion: follow the rules below

Suggestion rules (important — past output was bad here):
1. Write in natural, fluent Chinese, like a native Chinese marketing reviewer. No awkward translationese.
2. Be specific and actionable: name the field and the concrete change. Forbidden: vague filler like "增加吸引力"、"更个性化"、"添加情感词汇".
3. When you reference a specific word/phrase from the copy (a problem, or a proposed replacement), quote it VERBATIM in the copy's original language (English or French). Do NOT translate that phrase into Chinese (e.g. never render "unmatched insulation" as "无与伦比的绝缘").
4. If the variant has no real issue, write exactly "可直接使用" — do not invent a change.

Do NOT check character length or banned keywords — those are handled in code. The \`translations\` field is only a reference gloss; do not evaluate it.`;
}

// LLM 输出 Schema（strict）
const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    reviews: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          sensitiveRisk: { type: "boolean" },
          sensitiveReason: { type: "string" },
          fluencyScore: { type: "integer" },
          suggestion: { type: "string" },
        },
        required: ["id", "sensitiveRisk", "sensitiveReason", "fluencyScore", "suggestion"],
        additionalProperties: false,
      },
    },
  },
  required: ["reviews"],
  additionalProperties: false,
};

// 调 LLM 拿语义评估；只在「模型不可用」时换下一个候选模型
async function runLlmReview(client, variantsForLlm) {
  let completion;
  let lastError;
  for (const model of CANDIDATE_MODELS) {
    try {
      completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: REVIEW_SYSTEM_PROMPT },
          { role: "user", content: buildReviewUserPrompt(variantsForLlm) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "ad_reviews", strict: true, schema: REVIEW_SCHEMA },
        },
      });
      break;
    } catch (err) {
      lastError = err;
      const modelUnavailable = err?.status === 404 || err?.code === "model_not_found";
      console.log(`模型 ${model} 调用失败：`, err);
      if (modelUnavailable) {
        continue;
      }
      throw err;
    }
  }
  if (!completion) {
    throw lastError;
  }
  return JSON.parse(completion.choices[0].message.content);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "只支持 POST 请求" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ message: "服务端未配置 OPENAI_API_KEY，请在 .env.local 里设置" });
  }

  const { variants } = req.body || {};
  if (!Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ message: "缺少参数：需要非空的 variants 数组" });
  }

  // 用数组下标作为稳定的 variantId，避免模型生成的 id 在不同语种间重复导致对不上
  const indexed = variants.map((v, i) => ({
    id: i,
    lang: v.lang,
    primaryText: v.primaryText,
    headline: v.headline,
    description: v.description,
    cta: v.cta,
  }));

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const llm = await runLlmReview(client, indexed);

    // 把 LLM 结果按 id 建索引，方便合并
    const reviewById = new Map((llm.reviews || []).map((r) => [r.id, r]));

    // 合并代码层 + LLM 层
    const reviews = indexed.map((v) => {
      const rulesHit = [];

      // 代码层：长度① + 违禁词②
      rulesHit.push(...findLengthIssues(v));
      const joinedText = `${v.primaryText} ${v.headline} ${v.description}`;
      rulesHit.push(...findBannedWords(joinedText));

      // LLM 层：敏感③ + 地道度④
      const r = reviewById.get(v.id) || {};
      if (r.sensitiveRisk) {
        rulesHit.push("sensitive");
      }
      const fluencyScore =
        typeof r.fluencyScore === "number" ? r.fluencyScore : null;
      if (fluencyScore !== null && fluencyScore < REVIEW_CONFIG.fluencyThreshold) {
        rulesHit.push("fluency");
      }

      // 建议：LLM 给的一条中文建议
      const suggestions = r.suggestion ? [r.suggestion] : [];

      return {
        variantId: v.id,
        status: rulesHit.length > 0 ? "risk" : "pass", // 命中任一规则即 risk
        rulesHit,
        suggestions,
        fluencyScore,
      };
    });

    return res.status(200).json({ reviews });
  } catch (err) {
    console.log("质检失败：", err); // 把原始报错打出来方便排查
    const status = err?.status || 500;
    return res.status(status).json({
      message: err?.message || "质检失败，请稍后重试",
    });
  }
}
