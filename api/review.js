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

// 字段英文名 → 中文（确定性建议文案里用）
const FIELD_ZH = { primaryText: "主文案", headline: "标题", description: "描述" };

// 违禁词 → 更克制的替换示例（仅作建议，没有就给通用提示）
const BANNED_REPLACEMENTS = {
  best: "high-quality",
  "#1": "a top",
  "no.1": "a top",
  "number one": "a top",
  guaranteed: "designed to",
  guarantee: "aim to",
  "100%": "highly",
  miracle: "effective",
  cheapest: "affordable",
  "risk-free": "easy to try",
};

// ——————————————————————————————————————————————
// 代码层规则（确定性）：返回结构化命中，便于既出 rulesHit 码、又出确定性建议
// ——————————————————————————————————————————————

// 规则①：长度 → [{ type:"length", field, over }]，over = 超出上限的字符数
function findLengthIssues(variant) {
  const hits = [];
  for (const field of ["primaryText", "headline", "description"]) {
    const value = variant[field] || "";
    const max = REVIEW_CONFIG.maxLengths[field];
    if (value.length > max) {
      hits.push({ type: "length", field, over: value.length - max });
    }
  }
  return hits;
}

// 规则②：违禁词 → [{ type:"banned", field, word }]（逐字段，大小写不敏感、整词匹配）
function findBannedWords(variant) {
  const hits = [];
  for (const field of ["primaryText", "headline", "description"]) {
    const value = variant[field] || "";
    for (const word of REVIEW_CONFIG.bannedWords) {
      // 转义正则特殊字符；用「前后不是单词字符」当边界，避免误伤 bestseller 之类
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?<!\\w)${escaped}(?!\\w)`, "i");
      if (re.test(value)) {
        hits.push({ type: "banned", field, word });
      }
    }
  }
  return hits;
}

// 把单条代码层命中转成一句确定性中文建议
function codeHitToSuggestion(hit) {
  const fieldZh = FIELD_ZH[hit.field] || hit.field;
  if (hit.type === "length") {
    const max = REVIEW_CONFIG.maxLengths[hit.field];
    const current = max + hit.over;
    return `${fieldZh}超出 ${max} 字符上限（当前 ${current}），需精简至 ${max} 字符内`;
  }
  // banned
  const replacement = BANNED_REPLACEMENTS[hit.word];
  return replacement
    ? `${fieldZh}命中违禁词 "${hit.word}"，建议改为更克制的表述（如 "${replacement}"）`
    : `${fieldZh}命中违禁词 "${hit.word}"，建议改为更克制、可验证的表述`;
}

// 命中风险但没有具体建议时的确定性兜底（保证 rulesHit 非空时一定有可操作建议）
function riskFallbackSuggestion(rulesHit, llmReview, fluencyScore) {
  if (rulesHit.includes("sensitive")) {
    const reason = (llmReview.sensitiveReason || "").trim();
    return reason
      ? `检测到敏感/合规风险：${reason}，请修改后再投放`
      : "检测到敏感/合规风险，请审核并修改后再投放";
  }
  if (rulesHit.includes("fluency")) {
    return `地道度偏低（${fluencyScore}/100），建议请母语者润色，使表达更自然地道`;
  }
  return "存在质检风险，请修改后再投放";
}

// ——————————————————————————————————————————————
// LLM 层（提示词与 schema 照抄 docs/prompts.md）
// ——————————————————————————————————————————————
const REVIEW_SYSTEM_PROMPT =
  "你是一名严格的广告合规与语言质量审核员，负责审核面向海外市场的 Meta 广告。判断文案是否包含敏感或不合规内容（歧视、无法验证的医疗或健康功效宣称、虚假或误导性表述），以及它对目标语言母语者来说是否地道流畅。严格但公平。";

function buildReviewUserPrompt(variantsForLlm) {
  return `审核这些广告变体：${JSON.stringify(variantsForLlm)}

每个变体的语言由其 \`lang\` 字段给出：en = 英文，fr = 法文。把它视为唯一事实来源，不要猜测语言，也不要把它说成任何其他语言（例如不要说 "German"）。

针对每个变体（按 id），返回：
- sensitiveRisk：如果包含歧视性内容、过度医疗功效宣称、虚假或误导性内容，则为 true；否则为 false
- sensitiveReason：如果 sensitiveRisk 为 true，用中文给出简短原因（任何违规短语必须按原语言逐字引用）；否则为 ""
- fluencyScore：0-100，表示它在自身语言中读起来有多地道自然（以 \`lang\` 字段为准）
- suggestion：遵循下面的规则

修改建议规则（重要：这里过去的输出质量不好）：
1. 用自然、流畅的中文写，像中文母语的营销审核员。不要有翻译腔。
2. 具体且可执行：必须点名实际出问题的字段，并说明具体修改。字段名按这个映射写：primaryText = 主文案，headline = 标题，description = 描述。不要把主文案的问题说成标题的问题，也不要把标题的问题说成主文案的问题。
3. 禁止使用 "增加吸引力"、"更个性化"、"添加情感词汇" 这类空泛表述。
4. suggestion 本身用中文写，但凡是引用原文问题词、问题短语、建议替换词，都必须使用该变体 \`lang\` 对应的原语言：en 只写英文短语，fr 只写法文短语。不要把英文 / 法文短语翻译成中文，也不要写中英混用或中法混用的替换词。
5. 建议替换词必须是可以直接放回对应广告字段的原语言文案片段。不要写 "顶级thermal瓶"、"高级bouteille" 这类混合表达。
6. 正确示例：如果 primaryText 是 "Don’t let cold drinks ruin your day. Experience the world’s best thermos now!"，应写：在主文案中将 "the world’s best" 改为 "a high-performance"，以避免绝对化夸大。不要写：在标题中改为 "顶级thermal瓶"。
7. 如果该变体没有实际问题，严格写成 "可直接使用"；不要编造修改建议。

不要检查字符长度或违禁词，这些由代码处理。\`translations\` 字段只是参考释义，不要评估它。`;
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

// 合并一条变体的代码层 + LLM 层结果，得到最终评估。纯函数，便于单测。
// llmReview 为该 id 对应的 LLM 评估对象（可能为 {}）。
export function buildVariantReview(variant, llmReview) {
  // 代码层：结构化命中（长度① + 违禁词②）
  const lengthHits = findLengthIssues(variant);
  const bannedHits = findBannedWords(variant);
  const codeHits = [...lengthHits, ...bannedHits];

  // rulesHit 字符串码（前端依赖 length:字段 / banned:词 的格式，保持不变）
  const rulesHit = [];
  for (const h of lengthHits) rulesHit.push(`length:${h.field}`);
  for (const h of bannedHits) rulesHit.push(`banned:${h.word}`);

  // LLM 层：敏感③ + 地道度④
  if (llmReview.sensitiveRisk) {
    rulesHit.push("sensitive");
  }
  const fluencyScore =
    typeof llmReview.fluencyScore === "number" ? llmReview.fluencyScore : null;
  if (fluencyScore !== null && fluencyScore < REVIEW_CONFIG.fluencyThreshold) {
    rulesHit.push("fluency");
  }

  // —— 建议组装 ——
  // 代码层命中 → 确定性建议（这是确定性问题，不能靠 LLM 保证）
  const codeSuggestions = codeHits.map(codeHitToSuggestion);
  // LLM 建议：去掉"可直接使用"这种无操作回答
  const llmSuggestion = (llmReview.suggestion || "").trim();
  const llmUsable = llmSuggestion && llmSuggestion !== "可直接使用";

  let suggestions;
  if (codeSuggestions.length > 0) {
    // 有代码层命中：确定性建议在前，再附上 LLM 的（仅当它不是"可直接使用"）
    suggestions = llmUsable
      ? [...codeSuggestions, llmSuggestion]
      : [...codeSuggestions];
  } else {
    // 无代码层命中：用 LLM 的（可能是"可直接使用"或地道度/敏感建议）
    suggestions = llmSuggestion ? [llmSuggestion] : [];
  }

  // 硬保证：只要命中任一规则，suggestions 里绝不出现"可直接使用"；被滤空则兜底
  if (rulesHit.length > 0) {
    suggestions = suggestions.filter((s) => s !== "可直接使用");
    if (suggestions.length === 0) {
      suggestions = [riskFallbackSuggestion(rulesHit, llmReview, fluencyScore)];
    }
  }

  return {
    variantId: variant.id,
    status: rulesHit.length > 0 ? "risk" : "pass", // 命中任一规则即 risk
    rulesHit,
    suggestions,
    fluencyScore,
  };
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

    // 合并代码层 + LLM 层（逐条变体）
    const reviews = indexed.map((v) =>
      buildVariantReview(v, reviewById.get(v.id) || {})
    );

    return res.status(200).json({ reviews });
  } catch (err) {
    console.log("质检失败：", err); // 把原始报错打出来方便排查
    const status = err?.status || 500;
    return res.status(status).json({
      message: err?.message || "质检失败，请稍后重试",
    });
  }
}
