import ReactMarkdown from 'react-markdown'
import { useVoice } from '../hooks/useVoice'
import { useLanguage } from '../context/LanguageContext'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus,
  Search,
  Sparkles,
  Send,
  PanelLeft,
  X,
  Bot,
  User,
} from 'lucide-react'

import api from '../services/api'

import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'

import { cn } from '../lib/cn'

import MemoryPanel from '../components/MemoryPanel'

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-fg-muted/70"
          animate={{
            y: [0, -3, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.12,
          }}
        />
      ))}
    </div>
  )
}

const suggested = [
  'Plan my next 2 hours for maximum output.',
  'Summarize my current priorities in one sentence.',
  'Turn my goals into a weekly milestone plan.',
  'Ask me 3 questions to clarify what matters most today.',
]

export default function AIChat() {
  const location = useLocation()

  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [q, setQ] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)

  const bottomRef = useRef(null)

  const { language } = useLanguage()

  const {
    listening,
    speaking,
    startListening,
    speak,
  } = useVoice(language)

  useEffect(() => {
    const draft = location.state?.draft

    if (typeof draft === 'string' && draft.trim()) {
      setInput(draft)
    }
  }, [location.state])

  useEffect(() => {
    let alive = true

    setLoadingChats(true)

    api
      .get('/chat')
      .then((r) => {
        if (alive) {
          setChats(r.data ?? [])
        }
      })
      .finally(() => {
        if (alive) {
          setLoadingChats(false)
        }
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!activeChat) return

    let alive = true

    setLoadingMessages(true)

    api
      .get(`/chat/${activeChat.id}/messages`)
      .then((r) => {
        if (alive) {
          setMessages(r.data ?? [])
        }
      })
      .finally(() => {
        if (alive) {
          setLoadingMessages(false)
        }
      })

    return () => {
      alive = false
    }
  }, [activeChat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, sending])

  const visibleChats = useMemo(() => {
    const query = q.trim().toLowerCase()

    if (!query) return chats

    return chats.filter((c) =>
      String(c.title ?? '')
        .toLowerCase()
        .includes(query)
    )
  }, [chats, q])

  const newChat = async () => {
    const res = await api.post('/chat')

    setChats((prev) => [res.data, ...prev])

    setActiveChat(res.data)

    setMessages([])

    setListOpen(false)
  }

  const sendMessage = async (e) => {
    e?.preventDefault()

    if (!input.trim() || !activeChat) return

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMsg])

    setInput('')

    setSending(true)

    try {
      const res = await api.post(
        `/chat/${activeChat.id}/messages`,
        {
          content: userMsg.content,
        }
      )

      setMessages((prev) => [...prev, res.data])

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                title: userMsg.content.slice(0, 44),
              }
            : c
        )
      )

      // 🔊 Speak AI response
      if (voiceMode && res.data?.content) {
        speak(res.data.content)
      }

    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="px-3 pt-3 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* SIDEBAR */}
        <div className="lg:col-span-4 xl:col-span-3">

          <div className="lg:hidden mb-3 flex items-center justify-between">
            <Button
              variant="subtle"
              onClick={() => setListOpen(true)}
            >
              <PanelLeft size={16} />
              Chats
            </Button>

            <Button onClick={newChat}>
              <Plus size={16} />
              New
            </Button>
          </div>

          <div className="hidden lg:block">
            <Card className="rounded-3xl overflow-hidden">

              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="text-sm font-semibold text-fg flex items-center gap-2">
                  <Sparkles
                    size={16}
                    className="text-neon-blue"
                  />
                  AI Conversations
                </div>

                <Button
                  size="sm"
                  className="h-9"
                  onClick={newChat}
                >
                  <Plus size={16} />
                  New
                </Button>
              </div>

              <div className="p-3 border-b border-white/10">
                <div className="relative">

                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
                  />

                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search chats…"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="max-h-[calc(100vh-210px)] overflow-auto p-2">

                {loadingChats ? (
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : visibleChats.length ? (
                  visibleChats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChat(c)}
                      className={cn(
                        'w-full text-left rounded-2xl px-3 py-3 border transition-all mb-1',

                        activeChat?.id === c.id
                          ? 'bg-white/6 border-white/12 shadow-[0_0_0_1px_rgba(56,189,248,0.10)]'
                          : 'bg-white/0 border-transparent hover:bg-white/4 hover:border-white/10'
                      )}
                    >
                      <div className="text-sm text-fg truncate">
                        {c.title || 'New chat'}
                      </div>

                      <div className="text-[11px] text-fg-muted mt-0.5 truncate">
                        PulseOS Assistant
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-sm text-fg-muted">
                    No chats yet. Start a new conversation.
                  </div>
                )}

              </div>
            </Card>
          </div>
        </div>

        {/* MAIN */}
        <div className="lg:col-span-8 xl:col-span-9">

          <MemoryPanel />

          <Card className="rounded-3xl overflow-hidden">

            {/* HEADER */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">

              <div className="min-w-0">
                <div className="text-sm font-semibold text-fg truncate">
                  {activeChat
                    ? activeChat.title || 'Conversation'
                    : 'PulseOS AI'}
                </div>

                <div className="text-[11px] text-fg-muted">
                  Premium assistant panel
                </div>
              </div>

              <Badge tone="blue" className="gap-1">
                <Sparkles size={12} />
                Beta
              </Badge>
            </div>

            {/* EMPTY STATE */}
            {!activeChat ? (
              <div className="p-8 md:p-10">

                <div className="max-w-[760px] mx-auto">

                  <div className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">
                    Meet your{' '}
                    <span className="text-gradient">
                      life co-pilot
                    </span>.
                  </div>

                  <div className="text-sm text-fg-muted mt-2">
                    Ask PulseOS to prioritize,
                    summarize, plan, and reflect.
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {suggested.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setInput(p)
                          newChat()
                        }}
                        className="rounded-full border border-white/10 bg-white/4 hover:bg-white/6 hover:border-white/15 px-3 py-2 text-xs text-fg transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button onClick={newChat}>
                      <Plus size={16} />
                      Start a conversation
                    </Button>
                  </div>

                </div>
              </div>
            ) : (
              <>
                {/* MESSAGES */}
                <div className="h-[calc(100vh-240px)] lg:h-[calc(100vh-210px)] overflow-auto p-4 md:p-6 space-y-4">

                  {loadingMessages ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-[70%]" />
                      <Skeleton className="h-16 w-[62%] ml-auto" />
                      <Skeleton className="h-16 w-[68%]" />
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((m) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            'flex',
                            m.role === 'user'
                              ? 'justify-end'
                              : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[84%] md:max-w-[72%]',
                              m.role === 'user'
                                ? 'text-right'
                                : 'text-left'
                            )}
                          >

                            <div className="flex items-center gap-2 mb-1">

                              <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                {m.role === 'user'
                                  ? <User size={14} className="text-fg-muted" />
                                  : <Bot size={14} className="text-neon-blue" />}
                              </div>

                              <div className="text-[11px] text-fg-muted">
                                {m.role === 'user'
                                  ? 'You'
                                  : 'PulseOS AI'}
                              </div>
                            </div>

                            <div
                              className={cn(
                                'rounded-3xl px-4 py-3 text-sm leading-relaxed border shadow-glow',

                                m.role === 'user'
                                  ? 'bg-gradient-to-br from-neon-blue/85 to-neon-purple/85 border-white/0 text-white'
                                  : 'bg-white/4 border-white/10 text-fg'
                              )}
                            >
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>

                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}

                  {/* TYPING */}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="max-w-[72%]">

                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Bot size={14} className="text-neon-blue" />
                          </div>

                          <div className="text-[11px] text-fg-muted">
                            PulseOS AI
                          </div>
                        </div>

                        <div className="rounded-3xl px-4 py-3 text-sm border border-white/10 bg-white/4 shadow-glow">
                          <TypingDots />
                        </div>

                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* INPUT */}
                <form
                  onSubmit={sendMessage}
                  className="p-4 border-t flex gap-3 items-center"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >

                  {/* Voice Toggle */}
                  <button
                    type="button"
                    onClick={() => setVoiceMode(!voiceMode)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      background: voiceMode
                        ? 'rgba(139,92,246,0.3)'
                        : 'rgba(255,255,255,0.05)',

                      border: `1px solid ${
                        voiceMode
                          ? 'rgba(139,92,246,0.5)'
                          : 'rgba(255,255,255,0.08)'
                      }`,
                    }}
                  >
                    🔊
                  </button>

                  {/* Mic */}
                  <button
                    type="button"
                    onMouseDown={() =>
                      startListening((text) => {
                        setInput(text)
                      })
                    }
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      background: listening
                        ? 'rgba(239,68,68,0.3)'
                        : 'rgba(255,255,255,0.05)',

                      border: `1px solid ${
                        listening
                          ? 'rgba(239,68,68,0.5)'
                          : 'rgba(255,255,255,0.08)'
                      }`,
                    }}
                  >
                    🎤
                  </button>

                  {/* Input */}
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      listening
                        ? 'Listening...'
                        : 'Message PulseOS...'
                    }
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    style={{
                      background: '#0D1117',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />

                  {/* Send */}
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                    style={{
                      background:
                        'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                    }}
                  >
                    Send
                  </button>

                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}