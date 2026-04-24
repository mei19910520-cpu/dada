import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/types'

interface MessageListProps {
  messages: ChatMessage[]
}

function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end animate-slide-up">
      <div className="max-w-[75%]">
        <div className="bg-violet-600/90 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
          {msg.content}
        </div>
        <div className="text-right text-xs text-slate-600 mt-1 pr-1">
          {msg.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function AssistantMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-3 animate-slide-up">
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base mt-0.5"
        style={{ background: `${msg.agentColor}20`, border: `1px solid ${msg.agentColor}40` }}
      >
        {msg.agentEmoji}
      </div>

      <div className="max-w-[75%] min-w-0">
        {/* Agent name */}
        <div className="text-xs font-medium mb-1" style={{ color: msg.agentColor }}>
          {msg.agentName}
        </div>

        {/* Bubble */}
        <div className="bg-[#131720] border border-[#1c2133] text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {msg.content || (msg.isStreaming ? '' : '...')}
          {msg.isStreaming && <span className="typing-cursor" />}
        </div>

        <div className="text-xs text-slate-600 mt-1 pl-1">
          {msg.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="text-5xl mb-4">🤖</div>
        <div className="text-lg font-semibold text-white mb-2">AI 研發部門在線</div>
        <div className="text-sm text-slate-500 max-w-xs">
          選擇右側的 AI 員工，開始對話。每位員工都有專屬的能力和知識庫。
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) =>
        msg.role === 'user'
          ? <UserMessage key={msg.id} msg={msg} />
          : <AssistantMessage key={msg.id} msg={msg} />
      )}
      <div ref={bottomRef} />
    </div>
  )
}
