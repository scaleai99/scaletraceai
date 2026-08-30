/**
 * CopilotPage - Module 28: AI Copilot (full page view)
 *
 * Renders the CopilotPanel inline as a full-page view, not as a slide-over.
 * Useful when navigating directly to /copilot.
 */

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, MessageSquare, RotateCcw, Send } from 'lucide-react'
import { sendCopilotMessage, type ChatResponse } from '../../api/copilotApi'
import { cn } from '../../lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  fallback?: boolean
  modules?: string[]
  timestamp: Date
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I can answer questions about your ERP data. Try asking: 'How many open NCRs are there?' or 'Show me pending purchase orders.'",
  timestamp: new Date(),
}

// ---------------------------------------------------------------------------
// Bubble
// ---------------------------------------------------------------------------
function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex w-full mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-amber-500 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        )}
      >
        {msg.content}
        {msg.fallback && (
          <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            <AlertTriangle size={11} />
            <span>Approximate answer "" ERP data unavailable</span>
          </div>
        )}
        {!isUser && msg.modules && msg.modules.length > 0 && (
          <div className="mt-1.5 text-xs text-gray-400">Queried: {msg.modules.join(', ')}</div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Loader2 size={14} className="animate-spin text-amber-500" />
          <span className="text-xs text-gray-400">Scale AI Copilot is thinking...</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CopilotPage
// ---------------------------------------------------------------------------
export function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleNewChat = () => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }])
    setInput('')
  }

  const buildHistory = (msgs: Message[]) =>
    msgs
      .filter((m) => m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }))

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = buildHistory([...messages, userMsg])
      const res: ChatResponse = await sendCopilotMessage(text, history)

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.response,
        fallback: res.fallback,
        modules: res.modules_queried,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I could not reach the ERP system. Please try again.',
          fallback: true,
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Scale AI Copilot</h1>
            <p className="text-xs text-gray-500">Module 28 "" Natural language ERP queries via RAG</p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <RotateCcw size={14} />
          New Chat
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 px-6 py-4 space-y-1">
        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="pt-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about your ERP data - NCRs, orders, invoices, KPIs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className={cn(
              'flex-1 text-sm outline-none bg-transparent',
              'placeholder:text-gray-400',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={cn(
              'p-2 rounded-lg transition-colors',
              input.trim() && !loading
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send · AI responses are generated from your ERP data
        </p>
      </div>
    </div>
  )
}
