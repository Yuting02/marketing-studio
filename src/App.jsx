import { useState } from 'react'

// 语种展示顺序与中文名：先 English 一组，再 French 一组
const LANG_ORDER = ['en', 'fr']
const LANG_NAMES = { en: 'English', fr: 'French' }

// 单张文案卡片：展示 4 个字段，并提供「复制」按钮
function VariantCard({ variant }) {
  const [copied, setCopied] = useState(false) // 是否刚复制过（短暂提示用）

  // 把这条文案的四个字段整理成一段文本，复制到剪贴板
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
      <div className="card-field">
        <span className="card-label">主文案</span>
        <p className="card-value">{variant.primaryText}</p>
      </div>
      <div className="card-field">
        <span className="card-label">标题</span>
        <p className="card-value">{variant.headline}</p>
      </div>
      <div className="card-field">
        <span className="card-label">描述</span>
        <p className="card-value">{variant.description}</p>
      </div>
      <div className="card-field">
        <span className="card-label">引导类别(CTA)</span>
        <p className="card-value">{variant.cta}</p>
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

  // 接口返回的结果；null 表示还没点过按钮
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false) // 请求进行中
  const [error, setError] = useState(null)       // 出错信息

  // 勾选 / 取消某个语种
  function toggleLang(code) {
    setLangs((prev) => ({ ...prev, [code]: !prev[code] }))
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

    setLoading(true)   // 进入加载态，按钮禁用
    setError(null)     // 清掉上一次的错误
    setResult(null)    // 清掉上一次的结果

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

      setResult(data) // 成功：原样显示返回数据
    } catch (err) {
      console.error('生成失败：', err)
      setError(err.message || '生成失败，请稍后重试')
    } finally {
      setLoading(false) // 无论成败都退出加载态
    }
  }

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
            const items = result.variants.filter((v) => v.lang === code)
            if (items.length === 0) return null // 没勾这个语种就不显示
            return (
              <section key={code} className="lang-group">
                <h2 className="lang-title">{LANG_NAMES[code]}</h2>
                <div className="card-list">
                  {items.map((variant, index) => (
                    <VariantCard key={`${code}-${index}`} variant={variant} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default App
