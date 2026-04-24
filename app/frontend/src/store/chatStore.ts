import { create } from 'zustand'
import type { ChatMessage, Agent, LLMProvider } from '@/types'
import * as api from '@/api/client'
import { streamChat } from '@/api/client'

interface ChatStore {
  messages: ChatMessage[]
  agents: Agent[]
  activeAgent: string
  provider: LLMProvider
  model: string
  isStreaming: boolean
  backendOnline: boolean
  // actions
  fetchAgents: () => Promise<void>
  sendMessage: (content: string) => void
  setAgent: (id: string) => void
  setProvider: (p: LLMProvider) => void
  setModel: (m: string) => void
  clearMessages: () => void
}

const DEFAULT_AGENTS: Agent[] = [
  { id: 'director',   name: '策略總監',    emoji: '👑', color: '#7c3aed' },
  { id: 'automation', name: '自動化架構師', emoji: '🔧', color: '#3b82f6' },
  { id: 'data',       name: '數據分析師',  emoji: '📊', color: '#06b6d4' },
  { id: 'conversion', name: '成交策略師',  emoji: '💰', color: '#f59e0b' },
  { id: 'ux',         name: 'UX優化師',    emoji: '🎨', color: '#ec4899' },
  { id: 'knowledge',  name: '知識引擎',    emoji: '🤖', color: '#10b981' },
  { id: 'feedback',   name: '表單工程師',  emoji: '📋', color: '#f97316' },
]

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  agents: DEFAULT_AGENTS,
  activeAgent: 'director',
  provider: 'openai',
  model: 'gpt-4o-mini',
  isStreaming: false,
  backendOnline: false,

  fetchAgents: async () => {
    try {
      const [agents] = await Promise.all([api.fetchAgents(), api.fetchHealth()])
      set({ agents, backendOnline: true })
    } catch {
      set({ backendOnline: false })
    }
  },

  sendMessage: (content: string) => {
    const { agents, activeAgent, provider, model, messages, isStreaming } = get()
    if (isStreaming || !content.trim()) return

    const agent = agents.find((a) => a.id === activeAgent) || agents[0]

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      agentColor: agent.color,
      timestamp: new Date(),
      isStreaming: true,
    }

    set({ messages: [...messages, userMsg, assistantMsg], isStreaming: true })

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

    streamChat(
      { messages: history, agent: activeAgent, provider, model },
      (token) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: m.content + token } : m
          ),
        }))
      },
      () => {
        set((s) => ({
          isStreaming: false,
          messages: s.messages.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
          ),
        }))
      },
      (err) => {
        set((s) => ({
          isStreaming: false,
          messages: s.messages.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `❌ 錯誤：${err}`, isStreaming: false }
              : m
          ),
        }))
      }
    )
  },

  setAgent: (id) => set({ activeAgent: id }),
  setProvider: (provider) => {
    const defaults: Record<LLMProvider, string> = {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-sonnet-4-6',
      ollama: 'llama3.2:3b',
    }
    set({ provider, model: defaults[provider] })
  },
  setModel: (model) => set({ model }),
  clearMessages: () => set({ messages: [] }),
}))
