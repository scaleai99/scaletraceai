/**
 * CopilotPanel - Module 28: AI Copilot slide-over panel
 *
 * Features:
 * - Draggable floating trigger button (drag to reposition anywhere on screen)
 * - Slide-in panel from right (w-96)
 * - Chat interface: user (right, amber bg) + AI (left, white bg)
 * - Loading spinner while waiting
 * - Fallback message indicator
 * - New Chat button resets session
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageSquare, X, RotateCcw, Send, Loader2, AlertTriangle } from 'lucide-react'
import { sendCopilotMessage, type ChatResponse } from '../../api/copilotApi'
import { cn } from '../../lib/utils'

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
    "Hi! I'm your ERP Copilot, running on your on-premise AI. Ask me about Sales, Production, Purchasing, Inventory, Quality, Suppliers or Finance.",
  timestamp: new Date(),
}

const SUGGESTIONS = [
  'How many open NCRs?',
  "What's our AR outstanding?",
  'Show open sales orders',
  'Pending purchase orders',
  'Stock on hand',
]

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex w-full mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-amber-500 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        )}
      >
        {msg.content}
        {msg.fallback && (
          <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            <AlertTriangle size={11} />
            <span>Approximate answer</span>
          </div>
        )}
        {!isUser && msg.modules && msg.modules.length > 0 && (
          <div className="mt-1.5 text-xs text-gray-400">Queried: {msg.modules.join(', ')}</div>
        )}
      </div>
    </div>
  )
}

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

function buildHistory(messages: Message[]): unknown[] {
  return messages
    .filter((m) => m.id !== 'welcome')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }))
}

export function CopilotPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Draggable button state ──────────────────────────────────────────────
  const [pos, setPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const moved = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    moved.current = false
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      moved.current = true
      const nx = Math.min(Math.max(0, e.clientX - dragOffset.current.x), window.innerWidth - 60)
      const ny = Math.min(Math.max(0, e.clientY - dragOffset.current.y), window.innerHeight - 40)
      setPos({ x: nx, y: ny })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  // Touch support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    dragging.current = true
    moved.current = false
    dragOffset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }
  }, [pos])

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return
      moved.current = true
      const t = e.touches[0]
      const nx = Math.min(Math.max(0, t.clientX - dragOffset.current.x), window.innerWidth - 60)
      const ny = Math.min(Math.max(0, t.clientY - dragOffset.current.y), window.innerHeight - 40)
      setPos({ x: nx, y: ny })
      e.preventDefault()
    }
    const onTouchEnd = () => { dragging.current = false }
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const handleButtonClick = () => {
    // Only toggle if not dragged
    if (!moved.current) setOpen((o) => !o)
  }

  // ── Chat logic ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const handleNewChat = () => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }])
    setInput('')
  }

  const sendText = async (text: string) => {
    if (!text || loading) return
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = buildHistory([...messages, userMsg])
      const res: ChatResponse = await sendCopilotMessage(text, history)
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`, role: 'assistant', content: res.response,
        fallback: res.fallback, modules: res.modules_queried, timestamp: new Date(),
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant',
        content: 'Sorry, I could not reach the ERP system. Please try again.',
        fallback: true, timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <>
      {/* ── Draggable floating button ──────────────────────────────────── */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleButtonClick}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 40,
          cursor: dragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5',
          'bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg',
          'transition-colors duration-200 focus:outline-none',
          open && 'opacity-0 pointer-events-none'
        )}
        aria-label="Open AI Copilot"
        title="Drag to move · Click to open"
      >
        <MessageSquare size={18} />
        <span className="text-sm font-semibold select-none">AI</span>
      </button>

      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setOpen(false)} />
      )}

      {/* ── Slide-over panel ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-96 flex flex-col bg-gray-50 shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <MessageSquare size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Scale AI Copilot</h2>
              <p className="text-xs text-gray-400">Module 28 · ERP intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="New Chat"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {messages.map((msg) => <Bubble key={msg.id} msg={msg} />)}
          {messages.length <= 1 && !loading && (
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  onClick={() => sendText(sug)}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about your ERP data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(input.trim()) } }}
              disabled={loading}
              className="flex-1 text-sm rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 placeholder:text-gray-400"
            />
            <button
              onClick={() => sendText(input.trim())}
              disabled={!input.trim() || loading}
              className={cn(
                'p-2 rounded-xl transition-colors',
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
            Press Enter to send · AI-generated responses
          </p>
        </div>
      </div>
    </>
  )
}