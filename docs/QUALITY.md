# 质量标准

## Definition of Done（一个改动算“完成”的标准）
- [ ] 本地 `vercel dev` 能跑起来，改动的功能实际可用
- [ ] 没把 API key 写进前端或提交进 git（`.env.local` 始终被忽略）
- [ ] 改了提示词 → `docs/prompts.md` 与代码里的 prompt 字符串保持一致
- [ ] 改了架构 / 约定 → 同步更新 `docs/ARCHITECTURE.md` / `docs/CONVENTIONS.md`
- [ ] git commit 信息说清做了什么
- [ ] 暂无自动化测试，因此更要手动验证关键路径（见下）

## MVP 验收标准（来自 PRD）
- [ ] 公网可访问，他人可打开
- [ ] 输入一个真实产品，返回 en + fr 各 3 组结构化文案
- [ ] 每组带质检结果（通过 / 风险 + 命中规则 + ≥1 条建议）
- [ ] API key 只在后端，前端不可见

## 质检节点手动验证清单（改了 review 相关时跑）
- [ ] 建议是中文写的
- [ ] 命中违禁词时，问题词 / 替换词用英文 / 法文原文，无中英混用（不该出现“顶级thermal瓶”这类）
- [ ] 不出现“命中违禁词却提示可直接使用”的矛盾
- [ ] 超长字段被标 `length:字段`，违禁词被标 `banned:词`

## 代码审查检查清单
**正确性**
- [ ] API key 没泄露到前端
- [ ] `/api/review` 的 `rulesHit` 字符串格式没破坏前端解析（见 CONVENTIONS）

**可维护性**
- [ ] 命名符合 `docs/CONVENTIONS.md`
- [ ] 业务逻辑在正确的层（前端不直接调 OpenAI，见 ARCHITECTURE）
- [ ] 提示词改动已同步到 `docs/prompts.md`

## 测试现状
当前没有任何自动化测试（无 `*.test.*` / `*.spec.*`）。`api/review.js` 的 `buildVariantReview` 是纯函数、已为单测设计，是最值得最先补测试的地方。见 `exec-plans/tech-debt-tracker.md`。

## 待补充
- [ ] 是否引入测试框架（如 Vitest）？目前未定。
