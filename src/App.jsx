import { useState } from 'react'

// 首页：广告文案生成表单（生成功能的前半部分，暂不接大模型）
function App() {
  // 三个输入项分别用 useState 管理
  const [productName, setProductName] = useState('')   // 产品名
  const [sellingPoints, setSellingPoints] = useState('') // 卖点
  // 语种用一个对象记录每个是否勾选，默认两个都勾上
  const [langs, setLangs] = useState({ en: true, fr: true })

  // 提交后要展示的结果；null 表示还没点过按钮
  const [result, setResult] = useState(null)

  // 勾选 / 取消某个语种
  function toggleLang(code) {
    setLangs((prev) => ({ ...prev, [code]: !prev[code] }))
  }

  // 点"生成文案"：暂时不调接口，只把收集到的数据整理出来
  function handleGenerate() {
    // 把勾选的语种对象转成数组，例如 ['en', 'fr']
    const selectedLangs = Object.keys(langs).filter((code) => langs[code])

    const data = {
      productName,
      sellingPoints,
      langs: selectedLangs,
    }

    console.log('表单收集到的数据：', data) // 控制台也打一份，方便调试
    setResult(data) // 显示在页面下方
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

        <button type="button" onClick={handleGenerate}>
          生成文案
        </button>
      </div>

      {/* 点过按钮后，把收集到的数据显示出来，方便确认 */}
      {result && (
        <div className="result">
          <h2>收集到的输入</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  )
}

export default App
