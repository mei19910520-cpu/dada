import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, Goal, TaskStats } from '@/types'
import * as api from '@/api/client'

interface TaskStore {
  tasks: Task[]
  goals: Goal[]
  stats: TaskStats
  loading: boolean
  // actions
  fetchAll: () => Promise<void>
  toggleTask: (id: string) => Promise<void>
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      goals: [],
      stats: { total: 0, completed: 0, percentage: 0 },
      loading: false,

      fetchAll: async () => {
        set({ loading: true })
        try {
          const [{ tasks, stats }, goals] = await Promise.all([api.fetchTasks(), api.fetchGoals()])
          set({ tasks, stats, goals })
        } catch {
          // keep existing data if offline
        } finally {
          set({ loading: false })
        }
      },

      toggleTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (!task) return

        const updated = { ...task, completed: !task.completed }
        set((s) => {
          const tasks = s.tasks.map((t) => (t.id === id ? updated : t))
          const completed = tasks.filter((t) => t.completed).length
          return {
            tasks,
            stats: { total: tasks.length, completed, percentage: Math.round((completed / tasks.length) * 100) },
          }
        })

        try {
          await api.updateTask(id, { completed: updated.completed })
        } catch {
          // revert
          set((s) => {
            const tasks = s.tasks.map((t) => (t.id === id ? task : t))
            const completed = tasks.filter((t) => t.completed).length
            return { tasks, stats: { total: tasks.length, completed, percentage: Math.round((completed / tasks.length) * 100) } }
          })
        }
      },

      addTask: async (data) => {
        const task = await api.createTask(data)
        set((s) => {
          const tasks = [...s.tasks, task]
          const completed = tasks.filter((t) => t.completed).length
          return { tasks, stats: { total: tasks.length, completed, percentage: Math.round((completed / tasks.length) * 100) } }
        })
      },

      removeTask: async (id) => {
        await api.deleteTask(id)
        set((s) => {
          const tasks = s.tasks.filter((t) => t.id !== id)
          const completed = tasks.filter((t) => t.completed).length
          return { tasks, stats: { total: tasks.length, completed, percentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 } }
        })
      },
    }),
    { name: 'ai-rnd-tasks', partialize: (s) => ({ tasks: s.tasks, goals: s.goals, stats: s.stats }) }
  )
)
