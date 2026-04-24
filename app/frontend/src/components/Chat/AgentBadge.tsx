import type { Agent } from '@/types'

interface AgentBadgeProps {
  agent: Agent
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  active?: boolean
  onClick?: () => void
}

const SIZES = { sm: 'w-7 h-7 text-sm', md: 'w-9 h-9 text-base', lg: 'w-11 h-11 text-xl' }

export default function AgentBadge({ agent, size = 'md', showName = false, active = false, onClick }: AgentBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg transition-all
        ${onClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
        ${active ? 'ring-2 ring-offset-2 ring-offset-[#090b10]' : ''}
      `}
      style={active ? { ringColor: agent.color } : {}}
    >
      <div
        className={`${SIZES[size]} rounded-lg flex items-center justify-center flex-shrink-0 font-medium`}
        style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}40` }}
      >
        {agent.emoji}
      </div>
      {showName && (
        <div className="text-left">
          <div className="text-sm font-medium text-white">{agent.name}</div>
        </div>
      )}
    </button>
  )
}
