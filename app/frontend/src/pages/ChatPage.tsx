import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import MessageList from '@/components/Chat/MessageList'
import AgentBadge from '@/components/Chat/AgentBadge'
import ChatInput from '@/components/Chat/ChatInput'

export default function ChatPage() {
  const { messages, agents, activeAgent, isStreaming, fetchAgents, setAgent } = useChatStore()

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const currentAgent = agents.find((a) => a.id === activeAgent) || agents[0]

  return (
    <div className="flex h-full gap-4 overflow-hidden">

      {/* Agent sidebar */}
      <div className="flex-shrink-0 w-52 card overflow-y-auto">
        <div className="p-3 border-b border-[#1c2133]">
          <p className="text-xs text-slate-500 uppercase tracking-wider">AI 員工</p>
        </div>
        <div className="p-2 space-y-1">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setAgent(agent.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                ${activeAgent === agent.id
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c2133]'
                }`}
              style={activeAgent === agent.id ? { background: `${agent.color}15`, border: `1px solid ${agent.color}30` } : {}}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${agent.color}20` }}
              >
                {agent.emoji}
              </div>
              <span className="text-sm font-medium truncate">{agent.name}</span>
            </button>
          ))}
        </div>

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="px-3 pb-3">
            <div className="text-xs text-violet-400 flex items-center gap-1.5 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              AI 回應中...
            </div>
          </div>
        )}
      </div>

      {/* Chat main */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex-shrink-0 flex items-center gap-3 p-4 border-b border-[#1c2133]">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ background: `${currentAgent?.color}20`, border: `1px solid ${currentAgent?.color}40` }}
          >
            {currentAgent?.emoji}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{currentAgent?.name}</div>
            <div className="text-xs text-slate-500">AI 研發部門成員</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse-slow"
              style={{ background: currentAgent?.color }}
            />
            <span className="text-xs text-slate-500">在線</span>
          </div>
        </div>

        {/* Messages */}
        <MessageList messages={messages} />

        {/* Input */}
        <ChatInput />
      </div>

      {/* Right panel: active agent info */}
      <div className="flex-shrink-0 w-56 flex flex-col gap-3 overflow-y-auto">
        {/* Current agent card */}
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">當前 AI 員工</p>
          <AgentBadge agent={currentAgent || agents[0]} size="lg" showName />

          <div className="mt-4 space-y-2">
            {getAgentCapabilities(activeAgent).map((cap) => (
              <div key={cap} className="text-xs text-slate-500 flex items-start gap-1.5">
                <span style={{ color: currentAgent?.color }}>•</span>
                {cap}
              </div>
            ))}
          </div>
        </div>

        {/* All agents quick select */}
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">快速切換</p>
          <div className="grid grid-cols-4 gap-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setAgent(agent.id)}
                title={agent.name}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-base transition-all
                  ${activeAgent === agent.id ? 'ring-2' : 'hover:scale-110'}`}
                style={{
                  background: `${agent.color}20`,
                  ringColor: agent.color,
                }}
              >
                {agent.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Message count */}
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-white">{messages.length}</div>
          <div className="text-xs text-slate-500 mt-1">本次對話訊息數</div>
        </div>
      </div>
    </div>
  )
}

function getAgentCapabilities(agentId: string): string[] {
  const caps: Record<string, string[]> = {
    director:   ['策略決策', 'ROI分析', '風險控制', '指揮派工'],
    automation: ['n8n設計', 'API串接', '系統架構', '自動化率'],
    data:       ['市場分析', '趨勢預測', '數據洞察', '競品研究'],
    conversion: ['成交策略', '文案優化', 'A/B測試', 'ROI計算'],
    ux:         ['表單優化', '用戶流程', '跳出率', 'UX評分'],
    knowledge:  ['知識攝取', '學習洞察', '研發方向', '知識整理'],
    feedback:   ['數據分析', '表單優化', '閉環設計', '問題評分'],
  }
  return caps[agentId] || []
}
