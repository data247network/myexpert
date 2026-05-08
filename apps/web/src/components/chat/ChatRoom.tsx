/**
 * Shared ChatRoom component — used by both customer and worker views.
 * Handles fetching, Realtime subscription, sending, and read-marking.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@myexpert/shared'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Send, CheckCircle } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatJobMeta {
  id:           string
  title:        string
  status:       string
  customer_id:  string
  worker_id:    string | null
  other_name:   string   // full_name of the other party
}

interface Message {
  id:         string
  sender_id:  string
  content:    string | null
  is_read:    boolean
  created_at: string
}

// ── Helper ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ChatRoom({ job }: { job: ChatJobMeta }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  const [messages,  setMessages]  = useState<Message[]>([])
  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [loading,   setLoading]   = useState(true)

  // ── Initial load ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return

    supabase
      .from('messages')
      .select('id, sender_id, content, is_read, created_at')
      .eq('job_id', job.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as Message[])
        setLoading(false)
      })
  }, [job.id, user])

  // ── Realtime subscription ───────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${job.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `job_id=eq.${job.id}`,
        },
        payload => {
          const msg = payload.new as Message
          setMessages(prev => {
            // Avoid duplicate if we already optimistically added it
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [job.id])

  // ── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Mark unread messages as read ────────────────────────────────────────

  useEffect(() => {
    if (!user || messages.length === 0) return
    const unread = messages
      .filter(m => !m.is_read && m.sender_id !== user.id)
      .map(m => m.id)
    if (unread.length === 0) return
    supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unread)
      .then(() => {})
  }, [messages, user])

  // ── Send ────────────────────────────────────────────────────────────────

  const send = async () => {
    const body = text.trim()
    if (!body || !user || sending) return
    setText('')
    setSending(true)

    // Optimistic insert
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id:         tempId,
      sender_id:  user.id,
      content:    body,
      is_read:    false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('messages')
      .insert({ job_id: job.id, sender_id: user.id, content: body })
      .select('id, sender_id, content, is_read, created_at')
      .single()

    setSending(false)

    if (error) {
      // Revert optimistic
      setMessages(prev => prev.filter(m => m.id !== tempId))
      return
    }
    // Replace optimistic with real record
    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? (data as Message) : m))
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const isClosed = ['confirmed', 'cancelled', 'disputed'].includes(job.status)

  return (
    <div className="flex flex-col h-dvh">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-surface-tertiary bg-surface shrink-0">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink truncate">{job.other_name}</p>
          <p className="text-xs text-ink-tertiary truncate">{job.title}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          job.status === 'booked' || job.status === 'accepted'
            ? 'bg-brand-50 text-brand-700'
            : job.status === 'in_progress' || job.status === 'en_route'
            ? 'bg-orange-50 text-orange-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {job.status.replace('_', ' ')}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-surface-secondary">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
            <p className="text-3xl">💬</p>
            <p className="font-semibold text-ink">Start the conversation</p>
            <p className="text-sm text-ink-secondary">
              Messages are private between you and {job.other_name}.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === user?.id
              const showTime = i === 0 ||
                new Date(msg.created_at).getTime() -
                new Date(messages[i - 1].created_at).getTime() > 5 * 60 * 1000

              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="text-center text-[10px] text-ink-tertiary my-2">
                      {formatTime(msg.created_at)}
                    </p>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-surface text-ink rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.content}
                      {isMe && (
                        <span className="inline-flex items-center ml-2 -mb-0.5">
                          <CheckCircle
                            size={10}
                            className={msg.is_read ? 'text-brand-200' : 'text-brand-400 opacity-60'}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      {isClosed ? (
        <div className="px-4 py-3 bg-surface border-t border-surface-tertiary text-center shrink-0">
          <p className="text-xs text-ink-tertiary">This job is closed — chat is read-only.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 bg-surface border-t border-surface-tertiary shrink-0">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            maxLength={1000}
            className="flex-1 px-4 py-2.5 bg-surface-secondary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 text-ink placeholder:text-ink-tertiary"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform">
            <Send size={16} className="text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
