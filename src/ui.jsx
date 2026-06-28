import { useState } from 'react'

/* ════════════════════════════════════════════════════════════
   核心 UI 组件库
   来源：claude.ai/design 项目 marketing-studio（components/core/*）
   保持设计原样：内联样式 + CSS 变量（见 index.css）。
   ════════════════════════════════════════════════════════════ */

/**
 * Button — 主操作按钮。
 * variant: coral(强调) | dark(黑) | secondary(描边) | ghost。size: sm | md | lg。
 */
export function Button({
  children,
  variant = 'coral',
  size = 'md',
  pill = true,
  icon = null,
  iconRight = null,
  disabled = false,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: '8px 16px', fontSize: 'var(--fs-sm)', gap: '6px', height: 36 },
    md: { padding: '11px 22px', fontSize: 'var(--fs-body)', gap: '8px', height: 44 },
    lg: { padding: '15px 30px', fontSize: 'var(--fs-lead)', gap: '10px', height: 54 },
  }
  const variants = {
    coral: { background: 'var(--accent)', color: 'var(--text-on-coral)', border: '1px solid var(--accent)' },
    dark: { background: 'var(--ink-900)', color: 'var(--white)', border: '1px solid var(--ink-900)' },
    secondary: { background: 'var(--white)', color: 'var(--text-strong)', border: '1px solid var(--border-input)' },
    ghost: { background: 'transparent', color: 'var(--text-strong)', border: '1px solid transparent' },
  }
  const s = sizes[size] || sizes.md
  const v = variants[variant] || variants.coral

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        minHeight: s.height,
        fontFamily: 'var(--font-sans)',
        fontSize: s.fontSize,
        fontWeight: 'var(--fw-semibold)',
        lineHeight: 1,
        letterSpacing: '0.005em',
        borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition:
          'background var(--dur) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
        ...v,
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', margin: '-2px 0' }}>{icon}</span>}
      {children}
      {iconRight && <span style={{ display: 'inline-flex', margin: '-2px 0' }}>{iconRight}</span>}
    </button>
  )
}

/**
 * Card — 白底卡片，浅灰边框，12px 圆角，克制阴影。interactive=true 时带悬浮微抬升。
 */
export function Card({
  children,
  interactive = false,
  padding = 'var(--space-5)',
  radius = 'var(--radius-md)',
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${hover ? 'var(--grey-300)' : 'var(--border-card)'}`,
        borderRadius: radius,
        padding,
        boxShadow: hover ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all var(--dur) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Badge — 质检状态徽章。pass=柔绿，risk=柔橙（永不用红）。 */
export function Badge({ status = 'pass', children, style = {} }) {
  const map = {
    pass: { bg: 'var(--pass-bg)', fg: 'var(--pass-text)', bd: 'var(--pass-border)', dot: 'var(--pass-strong)', label: '通过' },
    risk: { bg: 'var(--risk-bg)', fg: 'var(--risk-text)', bd: 'var(--risk-border)', dot: 'var(--risk-strong)', label: '风险' },
    neutral: { bg: 'var(--surface-100)', fg: 'var(--text-muted)', bd: 'var(--line-200)', dot: 'var(--grey-400)', label: '' },
  }
  const c = map[status] || map.pass
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px 3px 9px',
        fontSize: 'var(--fs-caption)',
        fontWeight: 'var(--fw-semibold)',
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        borderRadius: 'var(--radius-pill)',
        lineHeight: 1.4,
        ...style,
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 'var(--radius-pill)', background: c.dot }} />
      {children || c.label}
    </span>
  )
}

/** Tag — 命中规则的小药丸（如 banned:best）。tone: risk | muted。 */
export function Tag({ children, tone = 'risk', mono = true, style = {} }) {
  const tones = {
    risk: { bg: 'var(--risk-bg)', fg: 'var(--risk-text)', bd: 'var(--risk-border)' },
    muted: { bg: 'var(--surface-100)', fg: 'var(--text-muted)', bd: 'var(--line-200)' },
  }
  const c = tones[tone] || tones.risk
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: 'var(--fs-micro)',
        fontWeight: 'var(--fw-medium)',
        letterSpacing: mono ? '-0.01em' : 0,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        borderRadius: 'var(--radius-xs)',
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Eyebrow — 小号低对比药丸标签（如 ♥ Built by …）。 */
export function Eyebrow({ children, heart = false, style = {} }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        fontSize: 'var(--fs-micro)',
        fontWeight: 'var(--fw-semibold)',
        letterSpacing: 'var(--ls-wide)',
        color: 'var(--text-muted)',
        background: 'var(--surface-100)',
        border: '1px solid var(--line-200)',
        borderRadius: 'var(--radius-pill)',
        ...style,
      }}
    >
      {heart && <span style={{ color: 'var(--accent)' }}>♥</span>}
      {children}
    </span>
  )
}

/** Field — label + 可选 hint 的表单控件包裹。 */
export function Field({ label, hint, htmlFor, children, style = {} }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      {label && (
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
          {label}
        </span>
      )}
      {children}
      {hint && <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{hint}</span>}
    </label>
  )
}

/** Input — 单行文本框。白底灰边 8px 圆角，聚焦黑边。 */
export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  invalid = false,
  style = {},
  onFocus,
  onBlur,
  ...rest
}) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={(e) => { setFocus(true); onFocus && onFocus(e) }}
      onBlur={(e) => { setFocus(false); onBlur && onBlur(e) }}
      style={{
        width: '100%',
        padding: '11px 14px',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-body)',
        color: 'var(--text-strong)',
        background: disabled ? 'var(--surface-100)' : 'var(--white)',
        border: `1px solid ${invalid ? 'var(--risk-text)' : focus ? 'var(--ink-900)' : 'var(--border-input)'}`,
        borderRadius: 'var(--radius-sm)',
        outline: 'none',
        boxShadow: focus && !invalid ? 'var(--shadow-focus)' : 'none',
        transition: 'border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
        ...style,
      }}
      {...rest}
    />
  )
}

/** Textarea — 多行文本框，样式与 Input 一致。 */
export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  invalid = false,
  style = {},
  onFocus,
  onBlur,
  ...rest
}) {
  const [focus, setFocus] = useState(false)
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      onFocus={(e) => { setFocus(true); onFocus && onFocus(e) }}
      onBlur={(e) => { setFocus(false); onBlur && onBlur(e) }}
      style={{
        width: '100%',
        padding: '12px 14px',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-body)',
        lineHeight: 'var(--lh-normal)',
        color: 'var(--text-strong)',
        background: disabled ? 'var(--surface-100)' : 'var(--white)',
        border: `1px solid ${invalid ? 'var(--risk-text)' : focus ? 'var(--ink-900)' : 'var(--border-input)'}`,
        borderRadius: 'var(--radius-sm)',
        outline: 'none',
        resize: 'vertical',
        boxShadow: focus && !invalid ? 'var(--shadow-focus)' : 'none',
        transition: 'border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
        ...style,
      }}
      {...rest}
    />
  )
}

/**
 * LangToggle — 目标语种分段多选。选中=黑底白字+勾，未选=白底灰边。
 * value 形如 { en: true, fr: false }。
 */
export function LangToggle({
  options = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'French' },
  ],
  value = {},
  onToggle,
  style = {},
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', ...style }}>
      {options.map((opt) => {
        const active = !!value[opt.code]
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => onToggle && onToggle(opt.code)}
            aria-pressed={active}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 'var(--fw-semibold)',
              color: active ? 'var(--white)' : 'var(--text-body)',
              background: active ? 'var(--ink-900)' : 'var(--white)',
              border: `1px solid ${active ? 'var(--ink-900)' : 'var(--border-input)'}`,
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              transition: 'all var(--dur) var(--ease-out)',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: 'var(--radius-pill)',
                border: `1.5px solid ${active ? 'var(--white)' : 'var(--grey-300)'}`,
                background: active ? 'var(--white)' : 'transparent',
                color: 'var(--ink-900)',
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {active ? '✓' : ''}
            </span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
