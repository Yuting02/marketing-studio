# CLAUDE.md — 项目操作手册

> Claude Code 每次启动会自动读这个文件。改了项目方向，先改这里。

## 项目是什么
出海营销内容工作台：输入产品信息 → 生成 Meta（Facebook / Instagram）多语种广告文案 → 对每条文案做合规质检。详细需求见 `docs/PRD.md`。

## 知识库地图（改代码前，先读相关文档）
| 我想了解… | 去读 |
|----------|------|
| 整体架构、数据流、质检节点怎么运作 | `docs/ARCHITECTURE.md` |
| 发给模型的提示词（System / User / Schema） | `docs/prompts.md` |
| 命名、代码风格、提交规范 | `docs/CONVENTIONS.md` |
| 为什么选这些技术 | `docs/TECH_DECISIONS.md` |
| 什么叫“完成”、验收 / 审查清单 | `docs/QUALITY.md` |
| 完整需求（MVP 范围） | `docs/PRD.md` |
| 待开发功能 | `docs/exec-plans/backlog.md` |
| 已知技术债务 | `docs/exec-plans/tech-debt-tracker.md` |

## 技术栈（已定，不要擅自更换）
- 前端：React + Vite（单页应用）
- 后端：Vercel Serverless Functions（放在 `/api` 目录）
- 大模型：通过后端调用（Anthropic / OpenAI），**API key 只在后端，绝不出现在前端代码里**
- 部署：Vercel
- MVP 阶段不用数据库

## 目录约定
- `/src` 前端代码
- `/api` serverless 函数（如 `api/generate.js`、`api/review.js`）
- `/docs` 项目文档与知识库（见上方「知识库地图」）

## 工作纪律（重要）
- **每次只做一件事**，做完停下来等我确认，不要一次性改一大堆文件
- 动手前先用一两句话说明：你要做什么、会改哪些文件
- 不要把 API key 写进任何前端文件，也不要提交到 git，用环境变量
- 不要引入计划外的依赖库；确实要加，先说明理由
- 代码保持简单可读：**我是新手，能看懂 > 高级写法**

## 常用命令
- 安装依赖：`npm install`
- 本地开发（含后端 /api）：`vercel dev`  ← 要调通 /api 必须用这个
- 只跑前端（不含 /api）：`npm run dev`
