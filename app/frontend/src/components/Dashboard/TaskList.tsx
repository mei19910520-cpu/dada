import { useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import type { Priority } from '@/types'

const PRIORITY_STYLE: Record<Priority, string> = {
  high:   'bg-red-500/10 text-red-400 border border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  low:    'bg-slate-500/10 text-slate-400 border border-slate-500/20',
}
const PRIORITY_LABEL: Record<Priority, string> = { high: '高', medium: '中', low: '低' }

export default function TaskList() {
  const { tasks, toggleTask, addTask, removeTask } = useTaskStore()
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await addTask({ title: newTitle.trim(), category: '一般', completed: false, priority: 'medium' })
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-500 uppercase tracking-wider">任務列表</span>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          <Plus size={14} /> 新增
        </button>
      </div>

      {/* Add task input */}
      {adding && (
        <div className="flex gap-2 mb-3 animate-fade-in">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="任務名稱..."
            className="flex-1 bg-[#1c2133] border border-[#2d3148] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
          />
          <button onClick={handleAdd} className="btn-primary">確認</button>
        </div>
      )}

      {/* Task items */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-start gap-3 p-3 rounded-lg border transition-all
              ${task.completed
                ? 'bg-[#0f1219] border-[#1c2133] opacity-60'
                : 'bg-[#131720] border-[#1c2133] hover:border-[#2d3148]'
              }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleTask(task.id)}
              className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all mt-0.5
                ${task.completed
                  ? 'bg-violet-600 border-violet-600'
                  : 'border-[#2d3148] hover:border-violet-500'
                }`}
            >
              {task.completed && <Check size={12} strokeWidth={3} />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {task.title}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-600">{task.category}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_STYLE[task.priority]}`}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => removeTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
