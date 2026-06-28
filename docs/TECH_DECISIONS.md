# 技术决策记录

> 选型原因大多来自 README「关键工程决策」与实际代码。拿不准原始原因的标「待补充」，不凭空编造。

## React + Vite（前端）
**用途**：单页应用，表单 + 卡片展示。
**选择原因**：Vite 启动 / 构建快、配置少，适合 MVP 快速迭代。
**注意**：目前单页、无路由；状态都在 `App.jsx` 里用 React 内置 hooks（`useState` 等）管理，未引入状态库。

## Vercel Serverless Functions（后端）
**用途**：`/api/*` 接口，承载调用大模型的逻辑。
**选择原因**：与前端同仓库、push 自动部署、无需单独运维服务器；天然把 API key 挡在后端。
**注意**：本地必须用 `vercel dev` 才能跑 `/api`（普通 `vite` 跑不起后端）。每个函数是独立的 `handler(req, res)`，互不调用。

## OpenAI（大模型，Structured Outputs）
**用途**：生成节点产出文案、质检节点做语义审核。
**选择原因**：用 strict `json_schema` 约束输出，前端拿到的就是严格结构化 JSON，不用“求模型返回 JSON 再祈祷”。
**注意**：
- key 只在后端环境变量 `OPENAI_API_KEY`，前端无任何 OpenAI 依赖（已验证）。
- 模型用候选列表 `["gpt-4o-mini", "gpt-4o"]`：优先便宜的 mini，不可用才换。

## 不用数据库（MVP）
**原因**：MVP 不需要持久化（无登录、无历史记录），见 PRD「不做（留 v2）」。
**影响**：生成结果不保存，刷新即丢；历史记录是 v2 功能。

## 提示词作为版本化资产
**做法**：提示词与输出 schema 集中在 `docs/prompts.md`，随代码一起版本化。
**注意**：代码里的 prompt 是硬编码字符串，需与 `docs/prompts.md` **手动**保持一致（已知约束，见 `exec-plans/tech-debt-tracker.md`）。

## 待补充
- [ ] 选 OpenAI 而非其他厂商（如 Anthropic）的具体原因？README 未写明，需人工确认。
