import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export type LLMProvider = 'openai' | 'anthropic' | 'ollama'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamOptions {
  provider: LLMProvider
  model: string
  messages: ChatMessage[]
  systemPrompt?: string
  onToken: (token: string) => void
  onDone: () => void
  onError: (err: Error) => void
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function streamChat(opts: StreamOptions): Promise<void> {
  const { provider, model, messages, systemPrompt, onToken, onDone, onError } = opts

  try {
    if (provider === 'openai') {
      await streamOpenAI({ model, messages, systemPrompt, onToken, onDone })
    } else if (provider === 'anthropic') {
      await streamAnthropic({ model, messages, systemPrompt, onToken, onDone })
    } else if (provider === 'ollama') {
      await streamOllama({ model, messages, systemPrompt, onToken, onDone })
    }
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}

async function streamOpenAI({
  model,
  messages,
  systemPrompt,
  onToken,
  onDone,
}: Omit<StreamOptions, 'provider' | 'onError'>) {
  const msgs: OpenAI.ChatCompletionMessageParam[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  const stream = await openai.chat.completions.create({
    model: model || 'gpt-4o-mini',
    messages: msgs,
    stream: true,
    max_tokens: 2048,
    temperature: 0.7,
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) onToken(delta)
  }
  onDone()
}

async function streamAnthropic({
  model,
  messages,
  systemPrompt,
  onToken,
  onDone,
}: Omit<StreamOptions, 'provider' | 'onError'>) {
  const anthropicMsgs = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const stream = anthropic.messages.stream({
    model: model || 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt
      ? [{ type: 'text' as const, text: systemPrompt, cache_control: { type: 'ephemeral' as const } }]
      : undefined,
    messages: anthropicMsgs,
  })

  stream.on('text', (text) => onToken(text))
  await stream.finalMessage()
  onDone()
}

async function streamOllama({
  model,
  messages,
  systemPrompt,
  onToken,
  onDone,
}: Omit<StreamOptions, 'provider' | 'onError'>) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'

  const body = {
    model: model || 'llama3.2:3b',
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    stream: true,
  }

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok || !res.body) throw new Error(`Ollama error: ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        const token = json.message?.content
        if (token) onToken(token)
      } catch {
        // ignore parse errors
      }
    }
  }
  onDone()
}
