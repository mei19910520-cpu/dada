import { useState, useRef } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import type { LLMProvider } from '@/types'

const PROVIDERS: { id: LLMProvider; label: string }[] = [
  { id: 'openai',    label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'ollama',    label: 'Ollama (本地)' },
]

const MODEL_OPTIONS: Record<LLMProvider, string[]> = {
  openai:    ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  anthropic: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'],
  ollama:    ['llama3.2:3b', 'llama3.1:8b', 'mistral', 'nomic-embed-text'],
}

export default function ChatInput() {
  const { sendMessage, isStreaming, provider, model, setProvider, setModel, clearMessages, backendOnline } = useChatStore()
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!text.trim() || isStreaming) return
    sendMessage(text.trim())
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }

  return (
    <div className="border-t border-[#1c2133] p-4 space-y-3">
      {/* Provider + Model selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                ${provider === p.id
                  ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                  : 'border-[#1c2133] text-slate-500 hover:border-[#2d3148] hover:text-slate-400'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-xs bg-[#1c2133] border border-[#1c2133] text-slate-400 rounded-lg px-2 py-1.5 outline-none hover:border-[#2d3148] cursor-pointer"
        >
          {MODEL_OPTIONS[provider].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Backend status indicator */}
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <div className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className={backendOnline ? 'text-green-400' : 'text-red-400'}>
            {backendOnline ? '後台在線' : '後台離線'}
          </span>
        </div>
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-[#131720] border border-[#1c2133] rounded-xl overflow-hidden focus-within:border-violet-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息… (Enter 發送，Shift+Enter 換行)"
            disabled={isStreaming}
            rows={1}
            className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-slate-600 outline-none resize-none leading-relaxed disabled:opacity-50"
          />
        </div>

        <button
          onClick={clearMessages}
          className="p-3 rounded-xl border border-[#1c2133] text-slate-600 hover:text-slate-300 hover:border-[#2d3148] transition-all"
          title="清除對話"
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={handleSend}
          disabled={!text.trim() || isStreaming}
          className="p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
