import { useEffect } from 'react'
import { Target, Zap, TrendingUp, Calendar } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import ProgressRing from '@/components/Dashboard/ProgressRing'
import TaskList from '@/components/Dashboard/TaskList'
import GoalCard from '@/components/Dashboard/GoalCard'

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="p-2.5 rounded-lg" style={{ background: `${color}15` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <div className="text-xl font-bold text-white tabular-nums">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
        {sub && <div className="text-xs text-slate-600">{sub}</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { tasks, goals, stats, loading, fetchAll } = useTaskStore()

  useEffect(() => { fetchAll() }, [fetchAll])

  const today = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })
  const streak = 7 // example

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-2xl font-bold text-white">AI 研發部門</h1>
        <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
          <Calendar size={13} /> {today}
          {loading && <span className="text-violet-400 text-xs animate-pulse ml-2">同步中...</span>}
        </p>
      </div>

      {/* Stat cards */}
      <div className="flex-shrink-0 grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Target size={18} />}    label="今日任務" value={`${stats.completed}/${stats.total}`} color="#7c3aed" />
        <StatCard icon={<Zap size={18} />}       label="完成率"   value={`${stats.percentage}%`}            color="#3b82f6" />
        <StatCard icon={<TrendingUp size={18} />} label="週目標進度" value="75%"                            color="#10b981" />
        <StatCard icon={<Calendar size={18} />}  label="連續天數" value={`${streak} 天`}                   color="#f59e0b" />
      </div>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-hidden min-h-0">

        {/* Progress ring + goals */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
          {/* Ring */}
          <div className="card p-5 flex flex-col items-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">今日完成進度</p>
            <ProgressRing
              percentage={stats.percentage}
              label="任務完成"
              sublabel={`${stats.completed} / ${stats.total} 項`}
            />

            {/* Mini breakdown */}
            <div className="w-full mt-5 space-y-2">
              {[
                { label: '高優先級', count: tasks.filter(t => t.priority === 'high' && t.completed).length, total: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
                { label: '中優先級', count: tasks.filter(t => t.priority === 'medium' && t.completed).length, total: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
                { label: '低優先級', count: tasks.filter(t => t.priority === 'low' && t.completed).length, total: tasks.filter(t => t.priority === 'low').length, color: '#64748b' },
              ].map(({ label, count, total, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16">{label}</span>
                  <div className="flex-1 h-1.5 bg-[#1c2133] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: total ? `${(count / total) * 100}%` : '0%', background: color }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{count}/{total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">本週目標</p>
            <div className="space-y-3">
              {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="lg:col-span-3 card p-4 overflow-hidden flex flex-col">
          <TaskList />
        </div>
      </div>
    </div>
  )
}
