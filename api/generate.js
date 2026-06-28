import OpenAI from "openai";

// 生成节点：接收产品信息，调用 OpenAI 生成 Meta 多语种广告文案。
// 提示词与输出 schema 严格照抄 docs/prompts.md「生成节点 generation」那一节。

// 优先用高性价比的 gpt-4o-mini；若该模型在账号里不可用，自动换下一个候选模型。
const CANDIDATE_MODELS = ["gpt-4o-mini", "gpt-4o"];

// —— System 提示词（docs/prompts.md）——
const SYSTEM_PROMPT =
  "你是一名资深海外效果广告文案，负责为正在拓展海外市场的品牌撰写 Meta (Facebook/Instagram) 广告文案。文案必须让目标语言的母语读者读起来地道、自然，绝不能生硬直译或像翻译腔。遵循 Meta 广告字段规范和指定的字符限制。";

// —— User 提示词模板（docs/prompts.md，{{...}} 用表单值填充）——
function buildUserPrompt({ productName, sellingPoints, langs }) {
  return `产品：${productName}
核心卖点：${sellingPoints}

针对 \`${JSON.stringify(
    langs
  )}\` 中的每一种目标语言（\`"en" = 英文\`，\`"fr" = 法文\`），生成 3 个彼此不同的广告变体。
这 3 个变体必须采用不同角度，例如：一个突出利益点，一个突出情绪或故事，一个突出紧迫感或优惠。不要把同一个想法重复 3 次。

每个变体包含：
- primaryText：广告正文，使用目标语言，≤125 个字符
- headline：广告标题，使用目标语言，≤40 个字符
- description：广告描述，使用目标语言，≤30 个字符
- cta：必须且只能是 SHOP_NOW, LEARN_MORE, SIGN_UP, GET_OFFER 之一
- translations：一个对象，包含对三个文本字段的忠实、自然的中文翻译，供中文运营人员理解。这些只是参考释义，不属于广告内容：
  - primaryText_zh：primaryText 的中文翻译
  - headline_zh：headline 的中文翻译
  - description_zh：description 的中文翻译

所有广告字段都要直接用目标语言写。不要先写英文再翻译。只有 \`translations\` 对象使用中文。`;
}

// —— 输出 Schema（OpenAI Structured Outputs，strict）——
// 对应 docs/prompts.md：variants 数组，每项含 translations，全部必填。
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
          // 中文译文，仅供运营理解，不是广告的一部分
          translations: {
            type: "object",
            properties: {
              primaryText_zh: { type: "string" },
              headline_zh: { type: "string" },
              description_zh: { type: "string" },
            },
            required: ["primaryText_zh", "headline_zh", "description_zh"],
            additionalProperties: false,
          },
        },
        required: [
          "id",
          "lang",
          "primaryText",
          "headline",
          "description",
          "cta",
          "translations",
        ],
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
