import { useState } from 'react'

// 语种展示顺序与中文名：先 English 一组，再 French 一组
const LANG_ORDER = ['en', 'fr']
const LANG_NAMES = { en: 'English', fr: 'French' }

// 字段英文名 → 中文（命中规则标签里用）
const FIELD_NAMES = { primaryText: '主文案', headline: '标题', description: '描述' }

// 把后端的规则码翻译成中文标签
function ruleLabel(rule) {
  if (rule.startsWith('length:')) {
    const field = rule.slice('length:'.length)
    return `长度超限(${FIELD_NAMES[field] || field})`
  }
  if (rule.startsWith('banned:')) {
    const word = rule.slice('banned:'.length)
    return `违禁词(${word})`
  }
  if (rule === 'sensitive') return '敏感/合规风险'
  if (rule === 'fluency') return '地道度偏低'
  return rule // 兜底：没认出来就原样显示
}

// 单张文案卡片：展示 4 个字段 + 质检结果，并提供「复制」按钮
function VariantCard({ variant, review, reviewLoading }) {
  const [copied, setCopied] = useState(false) // 是否刚复制过（短暂提示用）

  // 只把广告的四个字段整理成一段文本复制（译文 translations 故意不在内）
  async function handleCopy() {
    const text = [
      `主文案：${variant.primaryText}`,
      `标题：${variant.headline}`,
      `描述：${variant.description}`,
      `引导类别(CTA)：${variant.cta}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500) // 1.5 秒后恢复按钮文字
    } catch (err) {
      console.error('复制失败：', err)
    }
  }

  return (
    <div className="card">
      {/* 每个外文字段下方各显示对应中文译文（灰色小字，靠样式区分，不被复制） */}
      <div className="card-field">
        <span className="card-label">主文案</span>
        <p className="card-value">{variant.primaryText}</p>
        {variant.translations?.primaryText_zh && (
          <p className="card-translation">{variant.translations.primaryText_zh}</p>
        )}
      </div>
      <div className="card-field">
        <span className="card-label">标题</span>
        <p className="card-value">{variant.headline}</p>
        {variant.translations?.headline_zh && (
          <p className="card-translation">{variant.translations.headline_zh}</p>
        )}
      </div>
      <div className="card-field">
        <span className="card-label">描述</span>
        <p className="card-value">{variant.description}</p>
        {variant.translations?.description_zh && (
          <p className="card-translation">{variant.translations.description_zh}</p>
        )}
      </div>
      <div className="card-field">
        <span className="card-label">引导类别(CTA)</span>
        <p className="card-value">{variant.cta}</p>
      </div>

      {/* 质检结果区：还没返回时显示占位，返回后填上徽章/标签/评分/建议 */}
      <div className="card-review">
        {review ? (
          <>
            <div className="review-top">
              <span
                className={`badge ${
                  review.status === 'pass' ? 'badge-pass' : 'badge-risk'
                }`}
              >
                {review.status === 'pass' ? '通过' : '风险'}
              </span>
              {typeof review.fluencyScore === 'number' && (
                <span className="fluency">地道度 {review.fluencyScore}/100</span>
              )}
            </div>

            {review.rulesHit.length > 0 && (
              <div className="rule-tags">
                {review.rulesHit.map((rule, i) => (
                  <span key={i} className="rule-tag">
                    {ruleLabel(rule)}
                  </span>
                ))}
              </div>
            )}

            {review.suggestions.length > 0 && (
              <div className="suggestion">
                <span className="card-label">修改建议</span>
                {review.suggestions.map((s, i) => (
                  <p key={i} className="card-value">
                    {s}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : reviewLoading ? (
          <p className="review-pending">质检中…</p>
        ) : null}
      </div>

      <button type="button" className="copy-btn" onClick={handleCopy}>
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  )
}

// 首页：广告文案生成表单 + 结果卡片
function App() {
  // 三个输入项分别用 useState 管理
  const [productName, setProductName] = useState('')   // 产品名
  const [sellingPoints, setSellingPoints] = useState('') // 卖点
  // 语种用一个对象记录每个是否勾选，默认两个都勾上
  const [langs, setLangs] = useState({ en: true, fr: true })

  // 生成接口返回的结果；null 表示还没点过按钮
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false) // 生成请求进行中
  const [error, setError] = useState(null)       // 生成出错信息

  // 质检接口（/api/review）的状态：原始结果先用 <pre> 显示，方便确认判定
  const [reviewResult, setReviewResult] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  // 勾选 / 取消某个语种
  function toggleLang(code) {
    setLangs((prev) => ({ ...prev, [code]: !prev[code] }))
  }

  // 拿生成好的 variants 调 /api/review，做合规质检
  async function runReview(variants) {
    setReviewLoading(true)
    setReviewError(null)
    setReviewResult(null)

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || `质检失败（${res.status}）`)
      }

      setReviewResult(data) // 成功：原样显示质检结果
    } catch (err) {
      console.error('质检失败：', err)
      setReviewError(err.message || '质检失败，请稍后重试')
    } finally {
      setReviewLoading(false)
    }
  }

  // 点"生成文案"：把表单数据 POST 给 /api/generate，结果显示在下方
  async function handleGenerate() {
    // 把勾选的语种对象转成数组，例如 ['en', 'fr']
    const selectedLangs = Object.keys(langs).filter((code) => langs[code])

    const payload = {
      productName,
      sellingPoints,
      langs: selectedLangs,
    }

    setLoading(true)        // 进入加载态，按钮禁用
    setError(null)          // 清掉上一次的错误
    setResult(null)         // 清掉上一次的结果
    setReviewResult(null)   // 一并清掉上一次的质检结果
    setReviewError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        // 后端返回的错误带 message 字段
        throw new Error(data?.message || `请求失败（${res.status}）`)
      }

      setResult(data) // 成功：渲染卡片
      runReview(data.variants) // 卡片出来后，自动用 variants 调质检（不阻塞 loading）
    } catch (err) {
      console.error('生成失败：', err)
      setError(err.message || '生成失败，请稍后重试')
    } finally {
      setLoading(false) // 无论成败都退出加载态
    }
  }

  // 把质检结果按 variantId 建索引，方便每张卡片取自己那条
  const reviewsById = new Map(
    (reviewResult?.reviews || []).map((r) => [r.variantId, r]),
  )

  return (
    <main className="page">
      <h1 className="page-title">出海营销内容工作台</h1>
      <p className="page-subtitle">Meta 广告文案生成 + 合规质检</p>

      <div className="form">
        {/* 产品名：单行输入 */}
        <label className="field">
          <span className="field-label">产品名</span>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="例如：便携保温杯"
          />
        </label>

        {/* 卖点：多行文本框 */}
        <label className="field">
          <span className="field-label">卖点</span>
          <textarea
            rows={4}
            value={sellingPoints}
            onChange={(e) => setSellingPoints(e.target.value)}
            placeholder="写 2-3 句，例如：12 小时保温；一键开盖；316 不锈钢内胆"
          />
        </label>

        {/* 目标语种：两个复选框，默认都勾选 */}
        <div className="field">
          <span className="field-label">目标语种</span>
          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={langs.en}
                onChange={() => toggleLang('en')}
              />
              English
            </label>
            <label>
              <input
                type="checkbox"
                checked={langs.fr}
                onChange={() => toggleLang('fr')}
              />
              French
            </label>
          </div>
        </div>

        <button type="button" onClick={handleGenerate} disabled={loading}>
          {loading ? '生成中…' : '生成文案'}
        </button>
      </div>

      {/* 出错时显示错误信息 */}
      {error && (
        <div className="result">
          <h2>出错了</h2>
          <pre>{error}</pre>
        </div>
      )}

      {/* 成功后：按语种分组展示卡片，每组 3 张 */}
      {result && (
        <div className="result">
          {LANG_ORDER.map((code) => {
            // 保留全局下标，才能用 variantId 把质检结果对到这张卡片
            const items = result.variants
              .map((variant, index) => ({ variant, index }))
              .filter((item) => item.variant.lang === code)
            if (items.length === 0) return null // 没勾这个语种就不显示
            return (
              <section key={code} className="lang-group">
                <h2 className="lang-title">{LANG_NAMES[code]}</h2>
                <div className="card-list">
                  {items.map(({ variant, index }) => (
                    <VariantCard
                      key={index}
                      variant={variant}
                      review={reviewsById.get(index)}
                      reviewLoading={reviewLoading}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* 质检失败时给个整体提示（此时卡片质检区为空） */}
      {reviewError && (
        <div className="result">
          <p className="review-error">质检失败：{reviewError}</p>
        </div>
      )}
    </main>
  )
}

export default App
