import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Settings, Zap } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'

const NAV = [
  { to: '/',     icon: LayoutDashboard, label: '每日任務' },
  { to: '/chat', icon: MessageSquare,   label: '群組聊天' },
]

export default function Sidebar() {
  const { stats } = useTaskStore()

  return (
    <aside className="flex-shrink-0 w-16 lg:w-56 flex flex-col bg-[#0f1219] border-r border-[#1c2133] h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1c2133]">
        <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-violet-400" />
        </div>
        <div className="hidden lg:block">
          <div className="text-sm font-bold text-white">AI 研發部門</div>
          <div className="text-xs text-slate-600">一人公司大腦</div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                : 'text-slate-500 hover:text-slate-200 hover:bg-[#1c2133]'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: daily progress mini */}
      <div className="px-3 pb-4 border-t border-[#1c2133] pt-4">
        <div className="hidden lg:block mb-2 text-xs text-slate-600">今日進度</div>
        <div className="h-1.5 bg-[#1c2133] rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 rounded-full transition-all duration-700"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <div className="hidden lg:flex justify-between text-xs text-slate-600 mt-1">
          <span>{stats.completed}/{stats.total} 完成</span>
          <span>{stats.percentage}%</span>
        </div>

        {/* Settings link */}
        <button className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-[#1c2133] transition-all text-sm">
          <Settings size={18} className="flex-shrink-0" />
          <span className="hidden lg:block">設定</span>
        </button>
      </div>
    </aside>
  )
}
