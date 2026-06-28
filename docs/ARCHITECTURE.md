# 架构说明

> 这份文档回答“项目怎么运作、怎么分层”。
> 想看“发给模型的提示词”，去 `docs/prompts.md`；想看“为什么选这些技术”，去 `docs/TECH_DECISIONS.md`。

## 整体结构

一个两步 LLM 工作流的单页应用：用户填表单 → 生成节点产出文案 → 质检节点逐条把关 → 卡片展示。前端负责把两个节点串成流水线。

```
浏览器 (React, src/)
   │  fetch POST
   ├─► /api/generate   生成节点：产品信息 → 多语种广告文案 { variants: [...] }
   ├─► /api/review     质检节点：variants → 每条的 pass/risk + 建议 { reviews: [...] }
   └─► /api/ping       健康检查，返回 { ok: true }（前端未调用，手动联调用）

src/
├── main.jsx     入口，挂载 React
├── App.jsx      主组件：表单、依次调用两个接口、状态管理、卡片渲染（请求逻辑都在这）
├── ui.jsx       纯展示组件（卡片、徽章、按钮等），不发请求
└── index.css    样式

api/             Vercel Serverless Functions，一个文件 = 一个独立接口
├── generate.js  生成节点
├── review.js    质检节点（含确定性规则 + LLM 调用 + 合并逻辑）
└── ping.js      健康检查
```

## 依赖方向规则

- **前端只通过 `fetch('/api/...')` 访问后端，绝不直接调用 OpenAI。**
  已验证：`src/` 下没有任何 `openai` 引用，OpenAI 只出现在 `api/generate.js`、`api/review.js`。
- **OpenAI API key 只在后端**，从 `process.env.OPENAI_API_KEY` 读取，永不进入前端代码或 git。
  这是硬约束：key 一旦进前端就等于公开泄露。
- **后端函数之间互不调用**，每个都是独立的 serverless handler。“先生成再质检”的编排在前端 `App.jsx` 里完成。
- **请求逻辑集中在 `App.jsx`**，`ui.jsx` 只负责展示。

## 主要数据流

1. 用户在 `App.jsx` 的表单填产品名、卖点、目标语种，点“生成文案”。
2. `App.jsx` → POST `/api/generate`。后端用 System + User 提示词调 OpenAI（strict json_schema），返回 `{ variants: [...] }`。
3. 前端拿 variants 渲染卡片，紧接着 → POST `/api/review`，把这批 variants 交给质检。
4. `/api/review` 跑“混合判定”（见下），返回 `{ reviews: [...] }`。
5. 前端按 `variantId` 把质检结果（pass/risk 徽章 + 建议）贴回对应卡片。

## 质检节点（/api/review）怎么运作

> 这一节原本写在 `docs/prompts.md` 里，现在搬到这——因为它描述的是**代码行为**，不是发给模型的提示词。
> 质检节点的 System / User 提示词和 LLM 输出 Schema 仍在 `prompts.md`。实现见 `api/review.js`。

**核心设计：确定性的事用代码判，语义的事交给 LLM，两层结果合并成每条变体的最终评估。**
这样确定性风险（超长、违禁词）100% 可靠、零成本零延迟，模型只处理它真正擅长的语义判断。

### ① 代码层（确定性、零成本、零延迟）
见 `review.js` 的 `findLengthIssues` / `findBannedWords`：
- **规则①长度**：任一字段超过上限 → 命中码 `length:字段名`
- **规则②违禁词**：命中违禁词表 → 命中码 `banned:词`（大小写不敏感、整词匹配，避免误伤 `bestseller` 这类）

### ② LLM 层（语义判断）
提示词见 `prompts.md`，输出：敏感/合规风险、地道度评分 0–100、一条中文修改建议。

### ③ 合并层
见 `review.js` 的 `buildVariantReview`（纯函数，便于单测）。每条变体输出
`{ variantId, status, rulesHit, suggestions, fluencyScore }`：
- `rulesHit` = 代码层(`length:` / `banned:`) + LLM 层(`sensitive`、地道度 < 阈值 → `fluency`)
- `status` = `rulesHit` 非空 → `risk`，否则 `pass`
- **建议组装**：代码层命中给确定性建议（排在前），LLM 建议附后；**硬保证**——只要命中任一规则，建议里绝不出现“可直接使用”，若被滤空则用兜底建议。这避免“命中违禁词却提示可直接使用”的自相矛盾。

### 规则配置（规则即配置）
改规则只改 `review.js` 顶部的 `REVIEW_CONFIG`，不动逻辑：

| 配置 | 当前值 | 含义 |
|------|--------|------|
| `maxLengths` | primaryText 125 / headline 40 / description 30 | 各字段推荐字符上限 |
| `bannedWords` | best, #1, no.1, number one, guaranteed, guarantee, 100%, miracle, cheapest, risk-free | 绝对化 / 夸大违禁词（目前以英文为主，可扩展法语） |
| `fluencyThreshold` | 70 | 地道度低于此值算风险 |

> 阈值即“误杀 / 漏放”的旋钮：调高更严（误杀↑、漏放↓），调低更松（漏放↑、误杀↓）。

## 待补充
- [ ]（暂无）
