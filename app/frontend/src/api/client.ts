import type { Task, Goal, Agent, ChatMessage, ChatRequest, LLMProvider } from '@/types'

const BASE = '/api'

// ── Tasks ─────────────────────────────────────────────────
export async function fetchTasks(): Promise<{ tasks: Task[]; stats: { total: number; completed: number; percentage: number } }> {
  const res = await fetch(`${BASE}/tasks`)
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export async function createTask(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export async function deleteTask(id: string): Promise<void> {
  await fetch(`${BASE}/tasks/${id}`, { method: 'DELETE' })
}

export async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch(`${BASE}/tasks/goals`)
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json()
}

// ── Agents ────────────────────────────────────────────────
export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${BASE}/chat/agents`)
  if (!res.ok) throw new Error('Failed to fetch agents')
  return res.json()
}

// ── Chat (SSE streaming) ───────────────────────────────────
export function streamChat(
  request: ChatRequest,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): () => void {
  const controller = new AbortController()

  fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      onError(`HTTP ${res.status}`)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.token) onToken(json.token)
            if (json.done) onDone()
            if (json.error) onError(json.error)
          } catch {
            // skip malformed
          }
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') onError(err.message)
  })

  return () => controller.abort()
}

// ── Health ────────────────────────────────────────────────
export async function fetchHealth(): Promise<{ status: string; providers: Record<LLMProvider, boolean> }> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Backend offline')
  return res.json()
}
