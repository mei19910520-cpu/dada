import { Router, Request, Response } from 'express'
import { streamChat, LLMProvider, ChatMessage } from '../services/llm.js'

const router = Router()

// Agent system prompts (loaded from env or inline)
const AGENT_PROMPTS: Record<string, string> = {
  director: `你是AI研發策略總監，負責指揮整個AI研發部門。你的回應必須：
1. 簡練有力，直切要點
2. 給出具體可執行的決策
3. 以ROI和風險角度分析問題
4. 必要時指派任務給其他AI員工
用繁體中文回應。`,

  automation: `你是AI自動化架構師（員工1），精通n8n工作流設計和API整合。你的回應必須：
1. 提供具體的自動化方案
2. 說明技術實現細節
3. 評估自動化率和效率提升
4. 考慮錯誤處理和系統穩定度
用繁體中文回應。`,

  data: `你是AI數據關聯分析師（員工2），擅長市場趨勢分析和預測模型。你的回應必須：
1. 用數據支撐每個結論
2. 提供清晰的洞察摘要
3. 識別異常點和機會點
4. 給出可量化的預測
用繁體中文回應。`,

  conversion: `你是AI成交策略專家（員工3），專注於提升轉換率和客戶心理分析。你的回應必須：
1. 分析客戶心理和痛點
2. 提供具體的成交策略
3. 設計A/B測試方案
4. 計算預期ROI
用繁體中文回應。`,

  ux: `你是AI用戶體驗優化師（員工4），專注於表單優化和用戶流程改善。你的回應必須：
1. 識別用戶流失點
2. 提供具體的UI/UX改進建議
3. 設計A/B測試
4. 量化改善效果
用繁體中文回應。`,

  knowledge: `你是AI知識引擎（員工5），負責每日學習和知識庫管理。你的回應必須：
1. 提供最新的市場和技術洞察
2. 整理結構化的知識摘要
3. 指出可立即應用的知識
4. 提出創新研發方向
用繁體中文回應。`,

  feedback: `你是AI表單數據工程師（員工6），負責分析用戶回饋和優化數據收集。你的回應必須：
1. 分析表單填寫行為數據
2. 識別高價值問題和低效問題
3. 提出表單結構優化建議
4. 設計數據收集閉環
用繁體中文回應。`,
}

// POST /api/chat  (SSE streaming)
router.post('/stream', async (req: Request, res: Response) => {
  const {
    messages,
    agent = 'director',
    provider = 'openai',
    model,
  }: {
    messages: ChatMessage[]
    agent: string
    provider: LLMProvider
    model?: string
  } = req.body

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array required' })
    return
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.director

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  await streamChat({
    provider,
    model: model || getDefaultModel(provider),
    messages,
    systemPrompt,
    onToken: (token) => sendEvent('token', { token }),
    onDone: () => {
      sendEvent('done', { done: true })
      res.end()
    },
    onError: (err) => {
      sendEvent('error', { error: err.message })
      res.end()
    },
  })
})

// GET /api/chat/agents — list available agents
router.get('/agents', (_req: Request, res: Response) => {
  const agents = [
    { id: 'director',    name: '策略總監',      emoji: '👑', color: '#7c3aed' },
    { id: 'automation',  name: '自動化架構師',   emoji: '🔧', color: '#3b82f6' },
    { id: 'data',        name: '數據分析師',    emoji: '📊', color: '#06b6d4' },
    { id: 'conversion',  name: '成交策略師',    emoji: '💰', color: '#f59e0b' },
    { id: 'ux',          name: 'UX優化師',      emoji: '🎨', color: '#ec4899' },
    { id: 'knowledge',   name: '知識引擎',      emoji: '🤖', color: '#10b981' },
    { id: 'feedback',    name: '表單工程師',    emoji: '📋', color: '#f97316' },
  ]
  res.json(agents)
})

function getDefaultModel(provider: LLMProvider): string {
  const defaults: Record<LLMProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-sonnet-4-6',
    ollama: 'llama3.2:3b',
  }
  return defaults[provider]
}

export default router
