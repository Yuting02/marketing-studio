import OpenAI from "openai";

// 生成节点：接收产品信息，调用 OpenAI 生成 Meta 多语种广告文案。
// 提示词与输出 schema 严格照抄 docs/prompts.md「生成节点 generation」那一节。

// 优先用高性价比的 gpt-4o-mini；若该模型在账号里不可用，自动换下一个候选模型。
const CANDIDATE_MODELS = ["gpt-4o-mini", "gpt-4o"];

// —— System 提示词（docs/prompts.md）——
const SYSTEM_PROMPT =
  "You are a senior performance-marketing copywriter who writes Meta (Facebook/Instagram) ad copy for brands expanding into overseas markets. Write copy that sounds native and natural to a first-language reader of the target language — never literal or translated. Follow Meta's ad field conventions and the requested character limits.";

// —— User 提示词模板（docs/prompts.md，{{...}} 用表单值填充）——
function buildUserPrompt({ productName, sellingPoints, langs }) {
  return `Product: ${productName}
Key selling points: ${sellingPoints}

For EACH target language in ${JSON.stringify(
    langs
  )} ("en" = English, "fr" = French), write 3 distinct ad variants.
The 3 variants must take different angles — e.g. one benefit-led, one emotion/story-led, one urgency/offer-led. Do not restate the same idea three times.

Each variant has:
- primaryText: main ad body, written in the target language, ≤125 characters
- headline: ≤40 characters, in the target language
- description: ≤30 characters, in the target language
- cta: exactly one of SHOP_NOW, LEARN_MORE, SIGN_UP, GET_OFFER

Write every field directly in the target language. Do not write English first and translate.`;
}

// —— 输出 Schema（OpenAI Structured Outputs，strict）——
// 对应 docs/prompts.md：variants 数组，每项 6 个字段，全部必填。
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    variants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          lang: { type: "string", enum: ["en", "fr"] },
          primaryText: { type: "string" },
          headline: { type: "string" },
          description: { type: "string" },
          cta: {
            type: "string",
            enum: ["SHOP_NOW", "LEARN_MORE", "SIGN_UP", "GET_OFFER"],
          },
        },
        required: ["id", "lang", "primaryText", "headline", "description", "cta"],
        additionalProperties: false,
      },
    },
  },
  required: ["variants"],
  additionalProperties: false,
};

export default async function handler(req, res) {
  // 这个接口只接受 POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "只支持 POST 请求" });
  }

  // 后端读取 API key，绝不出现在前端
  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ message: "服务端未配置 OPENAI_API_KEY，请在 .env.local 里设置" });
  }

  // 取出并校验表单数据
  const { productName, sellingPoints, langs } = req.body || {};
  if (!productName || !sellingPoints || !Array.isArray(langs) || langs.length === 0) {
    return res.status(400).json({
      message: "缺少参数：需要 productName、sellingPoints，以及至少一个 langs",
    });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const userPrompt = buildUserPrompt({ productName, sellingPoints, langs });

  try {
    let completion;
    let lastError;

    // 依次尝试候选模型：只在「模型不可用」时换下一个，其它错误直接抛出
    for (const model of CANDIDATE_MODELS) {
      try {
        completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ad_variants",
              strict: true,
              schema: OUTPUT_SCHEMA,
            },
          },
        });
        break; // 成功就跳出循环
      } catch (err) {
        lastError = err;
        const modelUnavailable =
          err?.status === 404 || err?.code === "model_not_found";
        console.log(`模型 ${model} 调用失败：`, err); // 原始报错打到服务端日志
        if (modelUnavailable) {
          continue; // 换下一个候选模型
        }
        throw err; // 非模型问题（如鉴权、限流），交给外层处理
      }
    }

    if (!completion) {
      throw lastError; // 所有候选模型都不可用
    }

    // strict json_schema 下，content 一定是符合 schema 的 JSON 字符串
    const data = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(data);
  } catch (err) {
    console.log("生成文案失败：", err); // 把原始报错打出来方便排查
    const status = err?.status || 500;
    return res.status(status).json({
      message: err?.message || "生成失败，请稍后重试",
    });
  }
}
