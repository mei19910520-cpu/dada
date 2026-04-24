import type { Goal } from '@/types'

interface GoalCardProps {
  goal: Goal
}

export default function GoalCard({ goal }: GoalCardProps) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100))

  return (
    <div className="card p-4 hover:border-[#2d3148] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-200">{goal.title}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${goal.color}20`, color: goal.color }}
        >
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#1c2133] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${goal.color}99, ${goal.color})` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>目前 <span className="text-slate-300 font-semibold">{goal.current}{goal.unit}</span></span>
        <span>目標 <span className="text-slate-300 font-semibold">{goal.target}{goal.unit}</span></span>
      </div>
    </div>
  )
}
