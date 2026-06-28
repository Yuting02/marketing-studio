# 代码约定

> 这里是从现有代码**归纳**出来的规律，不是发明新规则。和现状不符的地方会如实标出来。

## 文件命名
- **API 函数**：小写名词 `.js`，一个文件 = 一个接口：`generate.js`、`review.js`、`ping.js`
- **React 组件文件**：目前**不统一**——`App.jsx` 是大驼峰，`ui.jsx`、`main.jsx` 是小写
  （当前不一致；若要统一，建议组件文件用大驼峰 `Xxx.jsx`，入口/工具用小写）
- **样式**：`index.css`（单文件，全局样式）

## 命名规律（代码内部，比较一致）
- **React 组件**：大驼峰 `PascalCase`——`Hero`、`AdCard`、`LangGroup`、`Button`、`Card`、`Badge`、`Field`
- **普通函数**：小驼峰 `camelCase`——`buildUserPrompt`、`findLengthIssues`、`buildVariantReview`
- **事件处理**：常用 `handleXxx` / `onXxx`——`handleGenerate`、`onScroll`、`onTryClick`
- **模块级常量 / 配置**：全大写下划线 `UPPER_SNAKE_CASE`——`REVIEW_CONFIG`、`CANDIDATE_MODELS`、`SYSTEM_PROMPT`、`OUTPUT_SCHEMA`
- **API handler**：每个 `api/*.js` 默认导出 `export default async function handler(req, res)`

## 目录组织
- `src/App.jsx`：主组件 + 所有请求逻辑（`handleGenerate` → /api/generate，`runReview` → /api/review）
- `src/ui.jsx`：可复用纯展示组件（`export function Xxx`），不发请求
- `src/main.jsx`：挂载入口
- `api/`：每个文件一个独立 serverless 接口
- 依赖方向规则见 `docs/ARCHITECTURE.md`

## 质检命中码格式（前端依赖，别乱改）
`/api/review` 返回的 `rulesHit` 是字符串数组，格式固定，前端按它显示徽章/标签：
- `length:字段名`（如 `length:headline`）
- `banned:词`（如 `banned:best`）
- `sensitive`（LLM 判定敏感 / 合规风险）
- `fluency`（地道度低于阈值）

改这个格式，要同步改前端解析（`src/App.jsx` 的 `ruleLabel`）。

## 注释
- 用中文写，解释“为什么”而不是复述代码
- 密度适中：关键决策和不直观处才注释

## 提示词
- 发给模型的提示词集中在 `docs/prompts.md`，代码里的 prompt 字符串以它为准（`api/generate.js`、`api/review.js`）

## Git Commit
- 历史上两种风格混用：`type: 描述`（`feat:` / `fix:` / `docs:`）与纯祈使句（“Add project README”）；中英文都有
- **建议统一为** `type: 描述`，type 取 `feat / fix / docs / refactor / chore`，一句话说清做了什么

## 待补充
- [ ] 是否强制统一组件文件名大小写？（当前 `App.jsx` 与 `ui.jsx` 不一致）
