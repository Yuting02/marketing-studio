import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, Eyebrow, Field, Input, LangToggle, Tag, Textarea } from './ui.jsx'

/* ════════════════════════════════════════════════════════════
   出海营销内容工作台 — 页面实现
   设计来源：claude.ai/design 项目 marketing-studio
   说明：UI 整体按设计实现；数据仍走真实接口 /api/generate + /api/review，
        路由与接口形状均保持不变。
   ════════════════════════════════════════════════════════════ */

// 语种展示顺序与中文名：先 English 一组，再 French 一组
const LANG_ORDER = ['en', 'fr']
const LANG_TITLES = { en: 'English Ads', fr: 'French Ads' }

// 字段英文名 → 中文（命中规则标签里用）
const FIELD_NAMES = { primaryText: '主文案', headline: '标题', description: '描述' }

// 把后端的规则码翻译成中文标签（命中的具体词原样保留）
function ruleLabel(rule) {
  if (rule.startsWith('length:')) {
    const field = rule.slice('length:'.length)
    return `长度超限(${FIELD_NAMES[field] || field})`
  }
  if (rule.startsWith('banned:')) {
    return `违禁词: ${rule.slice('banned:'.length)}`
  }
  if (rule === 'sensitive') return '敏感/合规风险'
  if (rule === 'fluency') return '地道度偏低'
  return rule // 兜底：没认出来就原样显示
}

/* ─────────────────────────  顶部贴边导航  ───────────────────────── */
function StickyNav({ visible }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(8px)',
        WebkitBackdropFilter: 'saturate(180%) blur(8px)',
        borderBottom: '1px solid var(--line-200)',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        transition: 'transform var(--dur-slow) var(--ease-out), opacity var(--dur-slow) var(--ease-out)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--container-max)',
          margin: '0 auto',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--fs-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>♥</span> Built by Yuting Guo
        </span>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
          AI出海营销内容工作台
        </span>
      </div>
    </div>
  )
}

/* ─────────────────  Hero 右侧插图（原始位图 + 自动轮播）  ─────────────────
   三组可替换插图（放在 public/assets/ 下）：
     /assets/illu-1.png  主视觉 / 底层大图（填满圆角窗口）
     /assets/illu-2.png  左上浮动信息卡
     /assets/illu-3~5.png 右下自动轮播（3 秒间隔）
   替换任意文件即可换图。 */
const ILLU = {
  main: '/assets/illu-1.png',
  card: '/assets/illu-2.png',
  carousel: ['/assets/illu-3.png', '/assets/illu-4.png', '/assets/illu-5.png'],
}

// 卡片堆叠的位置/层级：front 翻飞离场，后面的卡上提补位，新卡从下方滑入最底层
const STACK_POS = {
  exit: { transform: 'translateY(-108%) scale(0.99)', opacity: 0, zIndex: 40 },
  0: { transform: 'translateY(0px) scale(1)', opacity: 1, zIndex: 30 },
  1: { transform: 'translateY(15px) scale(0.94)', opacity: 1, zIndex: 20 },
  2: { transform: 'translateY(30px) scale(0.88)', opacity: 1, zIndex: 10 },
  enter: { transform: 'translateY(64px) scale(0.84)', opacity: 0, zIndex: 5 },
}
const STACK_SHADOW = {
  exit: 'drop-shadow(0 20px 30px rgba(15,23,42,0.20))',
  0: 'drop-shadow(0 16px 26px rgba(15,23,42,0.18))',
  1: 'drop-shadow(0 18px 28px rgba(15,23,42,0.16))',
  2: 'drop-shadow(0 22px 32px rgba(15,23,42,0.16))',
  enter: 'drop-shadow(0 22px 32px rgba(15,23,42,0.14))',
}

function FlipCarousel({ images }) {
  const idRef = useRef(3)
  const nextImgRef = useRef(3)
  const [cards, setCards] = useState(() => [0, 1, 2].map((p) => ({ id: p, img: images[p % images.length], state: p })))

  useEffect(() => {
    const len = images.length
    const tick = () => {
      // 全部上提一档；front 卡作为 "exit" 翻飞离场
      setCards((prev) => {
        const advanced = prev
          .filter((c) => c.state !== 'exit')
          .map((c) => {
            if (c.state === 0) return { ...c, state: 'exit' }
            if (c.state === 1) return { ...c, state: 0 }
            if (c.state === 2) return { ...c, state: 1 }
            return c
          })
        const newCard = { id: idRef.current++, img: images[nextImgRef.current % len], state: 'enter' }
        nextImgRef.current += 1
        return [...advanced, newCard]
      })
      // 让新加入的卡从下方滑入最底层槽位
      setTimeout(() => setCards((prev) => prev.map((c) => (c.state === 'enter' ? { ...c, state: 2 } : c))), 40)
      // 翻飞动画结束后移除离场卡
      setTimeout(() => setCards((prev) => prev.filter((c) => c.state !== 'exit')), 680)
    }
    const t = setInterval(tick, 3000)
    return () => clearInterval(t)
  }, [images.length])

  return (
    <div style={{ position: 'absolute', right: -30, bottom: 6, width: '66%', maxWidth: 340 }}>
      {/* 占位维持堆叠高度稳定 */}
      <div style={{ position: 'relative', aspectRatio: '853 / 147' }}>
        {cards.map((c) => (
          <div
            key={c.id}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              transition: 'transform 0.62s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.62s ease',
              ...STACK_POS[c.state],
            }}
          >
            <img
              src={c.img}
              alt="切换插图"
              style={{ width: '100%', height: 'auto', display: 'block', filter: STACK_SHADOW[c.state] }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroIllustration() {
  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', minHeight: 380, aspectRatio: '1398 / 1125' }}>
      {/* 底层主视觉 */}
      <img
        src={ILLU.main}
        alt="出海文案工作台 主视觉"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 'var(--radius-lg)',
          display: 'block',
          boxShadow: '0 24px 60px rgba(15,23,42,0.16)',
        }}
      />
      {/* 左上浮动信息卡 */}
      <img
        src={ILLU.card}
        alt="信息卡片"
        style={{ position: 'absolute', top: -30, left: -34, width: '50%', maxWidth: 250, height: 'auto', display: 'block' }}
      />
      {/* 右下自动轮播 */}
      <FlipCarousel images={ILLU.carousel} />
    </div>
  )
}

/* ─────────────────────────────  Hero  ───────────────────────────── */
function Hero({ onTryClick }) {
  return (
    <header style={{ background: 'var(--white)' }}>
      <div
        className="ms-hero-grid"
        style={{
          maxWidth: 'var(--container-max)',
          margin: '0 auto',
          padding: '72px 24px 64px',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div>
          <Eyebrow heart>Built by Yuting Guo</Eyebrow>
          <h1
            style={{
              marginTop: 20,
              fontSize: 'var(--fs-display)',
              fontWeight: 'var(--fw-extrabold)',
              letterSpacing: 'var(--ls-tight)',
              lineHeight: 'var(--lh-tight)',
              color: 'var(--text-strong)',
            }}
          >
            AI出海营销
            <br />
            内容工作台
          </h1>
          <p
            style={{
              marginTop: 22,
              fontSize: 'var(--fs-lead)',
              color: 'var(--text-muted)',
              lineHeight: 'var(--lh-normal)',
              maxWidth: 480,
            }}
          >
            用中文输入产品卖点与投放需求，AI 自动生成适配不同市场的广告文案，并同步完成语气、语法、文化表达与合规风险质检。
          </p>
          <div style={{ marginTop: 30 }}>
            <Button
              variant="coral"
              size="lg"
              onClick={onTryClick}
              iconRight={
                <span aria-hidden style={{ fontSize: 18, marginLeft: 2 }}>
                  →
                </span>
              }
            >
              开始生成文案
            </Button>
          </div>
        </div>
        <HeroIllustration />
      </div>
    </header>
  )
}

/* ─────────────────────────  单张文案卡片  ───────────────────────── */
function FieldBlock({ label, value, gloss }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 'var(--fs-micro)',
          fontWeight: 600,
          letterSpacing: 'var(--ls-wide)',
          color: 'var(--text-muted)',
          marginBottom: 4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-strong)', fontWeight: 500, lineHeight: 'var(--lh-snug)' }}>
        {value}
      </div>
      {gloss && (
        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-gloss)', lineHeight: 'var(--lh-relaxed)', marginTop: 3 }}>
          {gloss}
        </div>
      )}
    </div>
  )
}

// 单张广告卡片：展示 4 个字段 + 中文译文，下半部分展示质检结果
function AdCard({ variant, label, review, reviewLoading }) {
  const [copied, setCopied] = useState(false)

  // 只复制广告四个字段（译文 gloss 故意不在内）
  function copy() {
    const text = [
      `主文案：${variant.primaryText}`,
      `标题：${variant.headline}`,
      `描述：${variant.description}`,
      `引导类别(CTA)：${variant.cta}`,
    ].join('\n')
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const t = variant.translations || {}

  return (
    <Card interactive padding="0" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* header：版本号 + 状态徽章 + 复制 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--line-100)',
        }}
      >
        <span style={{ fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--text-strong)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {review && <Badge status={review.status === 'pass' ? 'pass' : 'risk'} />}
          <button
            type="button"
            onClick={copy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-micro)',
              fontWeight: 600,
              color: copied ? 'var(--pass-text)' : 'var(--text-muted)',
              background: copied ? 'var(--pass-bg)' : 'var(--surface-100)',
              border: `1px solid ${copied ? 'var(--pass-border)' : 'var(--line-200)'}`,
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              transition: 'all var(--dur) var(--ease-out)',
            }}
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </div>
      </div>

      {/* body：四个字段 + 中文译文 */}
      <div style={{ padding: '16px 16px 4px' }}>
        <FieldBlock label="主文案" value={variant.primaryText} gloss={t.primaryText_zh} />
        <FieldBlock label="标题" value={variant.headline} gloss={t.headline_zh} />
        <FieldBlock label="描述" value={variant.description} gloss={t.description_zh} />
        <FieldBlock label="引导 · CTA" value={variant.cta} />
      </div>

      {/* footer：质检区 */}
      <div
        style={{
          marginTop: 'auto',
          padding: '12px 16px 16px',
          borderTop: '1px solid var(--line-100)',
          background: 'var(--surface-50)',
        }}
      >
        {review ? (
          <>
            {typeof review.fluencyScore === 'number' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: review.rulesHit.length ? 10 : 8,
                }}
              >
                <span style={{ fontSize: 'var(--fs-micro)', fontWeight: 600, letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)' }}>
                  文案自然度评分
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      letterSpacing: 'var(--ls-tight)',
                    }}
                  >
                    {review.fluencyScore}
                  </span>
                  <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-muted)' }}>/100</span>
                </span>
              </div>
            )}

            {review.rulesHit.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {review.rulesHit.map((rule, i) => (
                  <Tag key={i} mono={false}>
                    {ruleLabel(rule)}
                  </Tag>
                ))}
              </div>
            )}

            {review.suggestions.length > 0 && (
              <div
                style={{
                  fontSize: 'var(--fs-caption)',
                  color: review.status === 'risk' ? 'var(--text-body)' : 'var(--text-muted)',
                  lineHeight: 'var(--lh-normal)',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>修改建议 · </span>
                {review.suggestions.join(' ')}
              </div>
            )}
          </>
        ) : reviewLoading ? (
          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>质检中…</span>
        ) : null}
      </div>
    </Card>
  )
}

/* ─────────────────────────  语种分组  ───────────────────────── */
function LangGroup({ title, items, reviewsById, reviewLoading }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>{title}</h3>
        <Tag tone="muted" mono={false}>
          {items.length} 个版本
        </Tag>
      </div>
      <div
        className="ms-card-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }}
      >
        {items.map(({ variant, index }, i) => (
          <AdCard
            key={index}
            variant={variant}
            label={`版本 ${i + 1}`}
            review={reviewsById.get(index)}
            reviewLoading={reviewLoading}
          />
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────  底部签名  ───────────────────────── */
function BottomCTA() {
  return (
    <footer style={{ background: 'var(--white)', borderTop: '1px solid var(--line-200)' }}>
      <div style={{ padding: '22px 24px', textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>♥</span> Built by Yuting Guo
        </span>
      </div>
    </footer>
  )
}

/* ═════════════════════════════  App  ═════════════════════════════ */
function App() {
  // 三个输入项分别用 useState 管理
  const [productName, setProductName] = useState('')
  const [sellingPoints, setSellingPoints] = useState('')
  // 语种用一个对象记录每个是否勾选，默认两个都勾上
  const [langs, setLangs] = useState({ en: true, fr: true })

  // 生成接口返回的结果；null 表示还没点过按钮
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 质检接口（/api/review）的状态
  const [reviewResult, setReviewResult] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  // 顶部贴边导航：滚动超过 hero 后出现
  const [navVisible, setNavVisible] = useState(false)
  const workbenchRef = useRef(null)

  useEffect(() => {
    function onScroll() {
      setNavVisible(window.scrollY > 520)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToWorkbench() {
    if (workbenchRef.current) {
      const y = workbenchRef.current.getBoundingClientRect().top + window.scrollY - 70
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

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

      setReviewResult(data)
    } catch (err) {
      console.error('质检失败：', err)
      setReviewError(err.message || '质检失败，请稍后重试')
    } finally {
      setReviewLoading(false)
    }
  }

  // 点"生成文案"：把表单数据 POST 给 /api/generate
  async function handleGenerate() {
    const selectedLangs = Object.keys(langs).filter((code) => langs[code])

    const payload = {
      productName,
      sellingPoints,
      langs: selectedLangs,
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setReviewResult(null)
    setReviewError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || `请求失败（${res.status}）`)
      }

      setResult(data)
      runReview(data.variants) // 卡片出来后自动质检（不阻塞 loading）
    } catch (err) {
      console.error('生成失败：', err)
      setError(err.message || '生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 把质检结果按 variantId 建索引
  const reviewsById = new Map((reviewResult?.reviews || []).map((r) => [r.variantId, r]))

  return (
    <>
      <StickyNav visible={navVisible} />
      <Hero onTryClick={scrollToWorkbench} />

      {/* 工作台 */}
      <div ref={workbenchRef} style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '56px 24px 80px' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '40px', fontWeight: 'var(--fw-extrabold)', letterSpacing: 'var(--ls-tight)', color: 'var(--text-strong)' }}>
            工作台
          </h2>
          <p style={{ marginTop: 8, fontSize: 'var(--fs-body)', color: 'var(--text-muted)', lineHeight: 'var(--lh-normal)' }}>
            填写产品名与核心卖点，选择目标语种，一键生成并质检多语种广告文案。
          </p>
        </div>

        {/* 输入面板（mint 色块） */}
        <div
          style={{
            background: 'var(--mint-100)',
            border: '1px solid var(--mint-200)',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            marginBottom: 44,
          }}
        >
          <div className="ms-input-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Field label="产品名">
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="例如：便携保温杯"
              />
            </Field>
            <Field label="核心卖点">
              <Textarea
                rows={3}
                value={sellingPoints}
                onChange={(e) => setSellingPoints(e.target.value)}
                placeholder="写 2-3 句，例如：12 小时保温；一键开盖；316 不锈钢内胆"
              />
            </Field>
          </div>
          <div style={{ marginTop: 20 }}>
            <Field label="目标语种">
              <LangToggle value={langs} onToggle={toggleLang} />
            </Field>
          </div>
          <div style={{ marginTop: 22 }}>
            <Button
              variant="coral"
              size="lg"
              onClick={handleGenerate}
              disabled={loading}
              icon={
                <span aria-hidden style={{ fontSize: 17 }}>
                  ✦
                </span>
              }
            >
              {loading ? '生成中…' : '生成文案'}
            </Button>
          </div>
        </div>

        {/* 出错时显示错误信息 */}
        {error && (
          <div
            style={{
              background: 'var(--risk-bg)',
              border: '1px solid var(--risk-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
              marginBottom: 32,
              color: 'var(--risk-text)',
            }}
          >
            <strong style={{ display: 'block', marginBottom: 4, color: 'var(--risk-strong)' }}>出错了</strong>
            {error}
          </div>
        )}

        {/* 成功后：按语种分组展示卡片 */}
        {result &&
          LANG_ORDER.map((code) => {
            // 保留全局下标，才能用 variantId 把质检结果对到这张卡片
            const items = result.variants
              .map((variant, index) => ({ variant, index }))
              .filter((item) => item.variant.lang === code)
            if (items.length === 0) return null
            return (
              <LangGroup
                key={code}
                title={LANG_TITLES[code]}
                items={items}
                reviewsById={reviewsById}
                reviewLoading={reviewLoading}
              />
            )
          })}

        {/* 质检整体失败提示 */}
        {reviewError && (
          <div style={{ color: 'var(--risk-text)', fontSize: 'var(--fs-sm)' }}>质检失败：{reviewError}</div>
        )}
      </div>

      <BottomCTA />
    </>
  )
}

export default App
