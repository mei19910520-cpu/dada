import { Router, Request, Response } from 'express'

const router = Router()

// In-memory store (replace with DB for production)
interface Task {
  id: string
  title: string
  description?: string
  category: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  assignedTo?: string
  dueDate?: string
  createdAt: string
}

interface Goal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  color: string
  deadline?: string
}

const tasks: Task[] = [
  { id: '1', title: '知識攝取引擎執行', category: '自動化', completed: true,  priority: 'high',   assignedTo: 'automation', createdAt: new Date().toISOString() },
  { id: '2', title: '市場數據分析報告', category: '分析',   completed: true,  priority: 'high',   assignedTo: 'data',       createdAt: new Date().toISOString() },
  { id: '3', title: '成交漏斗優化建議', category: '行銷',   completed: false, priority: 'high',   assignedTo: 'conversion', createdAt: new Date().toISOString() },
  { id: '4', title: '表單完成率A/B測試', category: 'UX',    completed: false, priority: 'medium', assignedTo: 'ux',         createdAt: new Date().toISOString() },
  { id: '5', title: 'AI技術學習摘要',   category: '研發',   completed: true,  priority: 'medium', assignedTo: 'knowledge',  createdAt: new Date().toISOString() },
  { id: '6', title: '客戶回饋數據整理', category: '數據',   completed: false, priority: 'low',    assignedTo: 'feedback',   createdAt: new Date().toISOString() },
  { id: '7', title: '競品情報收集',     category: '研究',   completed: false, priority: 'medium', assignedTo: 'knowledge',  createdAt: new Date().toISOString() },
  { id: '8', title: 'Telegram日報生成', category: '自動化', completed: true,  priority: 'high',   assignedTo: 'automation', createdAt: new Date().toISOString() },
]

const goals: Goal[] = [
  { id: 'g1', title: '轉換率目標',   target: 30, current: 22, unit: '%',  color: '#7c3aed' },
  { id: 'g2', title: '每日知識攝取', target: 20, current: 15, unit: '條', color: '#3b82f6' },
  { id: 'g3', title: '客單價提升',   target: 15, current: 8,  unit: '%',  color: '#10b981' },
  { id: 'g4', title: '表單完成率',   target: 60, current: 48, unit: '%',  color: '#f59e0b' },
]

// GET /api/tasks
router.get('/', (_req: Request, res: Response) => {
  const completed = tasks.filter((t) => t.completed).length
  res.json({ tasks, stats: { total: tasks.length, completed, percentage: Math.round((completed / tasks.length) * 100) } })
})

// PATCH /api/tasks/:id
router.patch('/:id', (req: Request, res: Response) => {
  const task = tasks.find((t) => t.id === req.params.id)
  if (!task) { res.status(404).json({ error: 'Task not found' }); return }
  Object.assign(task, req.body)
  res.json(task)
})

// POST /api/tasks
router.post('/', (req: Request, res: Response) => {
  const task: Task = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    completed: false,
    priority: 'medium',
    category: '一般',
    ...req.body,
  }
  tasks.push(task)
  res.status(201).json(task)
})

// DELETE /api/tasks/:id
router.delete('/:id', (req: Request, res: Response) => {
  const idx = tasks.findIndex((t) => t.id === req.params.id)
  if (idx === -1) { res.status(404).json({ error: 'Task not found' }); return }
  tasks.splice(idx, 1)
  res.json({ success: true })
})

// GET /api/tasks/goals
router.get('/goals', (_req: Request, res: Response) => {
  res.json(goals)
})

// PATCH /api/tasks/goals/:id
router.patch('/goals/:id', (req: Request, res: Response) => {
  const goal = goals.find((g) => g.id === req.params.id)
  if (!goal) { res.status(404).json({ error: 'Goal not found' }); return }
  Object.assign(goal, req.body)
  res.json(goal)
})

export default router
