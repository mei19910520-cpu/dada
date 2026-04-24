export type Priority = 'high' | 'medium' | 'low'
export type LLMProvider = 'openai' | 'anthropic' | 'ollama'

export interface Task {
  id: string
  title: string
  description?: string
  category: string
  completed: boolean
  priority: Priority
  assignedTo?: string
  dueDate?: string
  createdAt: string
}

export interface Goal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  color: string
  deadline?: string
}

export interface TaskStats {
  total: number
  completed: number
  percentage: number
}

export interface Agent {
  id: string
  name: string
  emoji: string
  color: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentId?: string
  agentName?: string
  agentEmoji?: string
  agentColor?: string
  timestamp: Date
  isStreaming?: boolean
}

export interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[]
  agent: string
  provider: LLMProvider
  model?: string
}
