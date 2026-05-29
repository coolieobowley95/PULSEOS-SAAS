import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, ChevronDown, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import api from '../services/api'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { cn } from '../lib/cn'

const CATEGORY_STYLES = {
  project: { badge: 'border-neon-blue/35 bg-neon-blue/10 text-neon-blue' },
  habit: { badge: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200' },
  goal: { badge: 'border-neon-purple/35 bg-neon-purple/10 text-neon-purple' },
  struggle: { badge: 'border-rose-400/35 bg-rose-400/10 text-rose-200' },
  preference: { badge: 'border-amber-300/35 bg-amber-300/10 text-amber-100' },
  personal: { badge: 'border-sky-300/35 bg-sky-300/10 text-sky-100' },
  work: { badge: 'border-indigo-300/35 bg-indigo-300/10 text-indigo-100' },
  general: { badge: 'border-white/15 bg-white/5 text-fg-muted' },
}

function normalizeMemory(raw) {
  const id = typeof raw?.id === 'string' ? raw.id : null
  const fact = typeof raw?.fact === 'string' ? raw.fact.trim() : ''
  const category = typeof raw?.category === 'string' ? raw.category.trim().toLowerCase() : 'general'
  if (!id || !fact) return null
  return { id, fact, category: CATEGORY_STYLES[category] ? category : 'general', updatedAt: raw?.updatedAt }
}

export default function MemoryPanel() {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/memory')
      const list = Array.isArray(res.data) ? res.data : []
      setItems(list.map(normalizeMemory).filter(Boolean))
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load memories')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const count = items.length
  const headerSubtitle = useMemo(() => {
    if (loading) return 'Loading…'
    if (error) return 'Could not load'
    if (!count) return 'No saved memories yet'
    return `${count} saved ${count === 1 ? 'memory' : 'memories'}`
  }, [count, error, loading])

  const remove = async (id) => {
    if (!id) return
    setItems(prev => prev.filter(m => m.id !== id))
    try {
      await api.delete(`/memory/${id}`)
    } catch (e) {
      // rollback on failure
      await load()
    }
  }

  return (
    <Card className="rounded-3xl overflow-hidden mb-4">
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Brain size={18} className="text-neon-blue" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-fg truncate">Memory</div>
            <div className="text-[11px] text-fg-muted truncate">{headerSubtitle}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="subtle"
            size="sm"
            className="h-9"
            onClick={load}
            disabled={loading}
            title="Refresh"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </Button>
          <Button
            variant="subtle"
            size="sm"
            className="h-9"
            onClick={() => setOpen(v => !v)}
            title={open ? 'Collapse' : 'Expand'}
          >
            <ChevronDown size={16} className={cn('transition-transform', open ? 'rotate-180' : 'rotate-0')} />
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {error ? (
                <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 text-rose-100 px-4 py-3 text-sm">
                  {error}
                </div>
              ) : null}

              {!loading && !error && !items.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-sm text-fg-muted">
                  PulseOS will automatically remember important facts you share in chat (goals, preferences, struggles, projects).
                </div>
              ) : null}

              <div className="space-y-2 mt-3">
                {items.map((m) => {
                  const style = CATEGORY_STYLES[m.category] || CATEGORY_STYLES.general
                  return (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-white/10 bg-white/3 hover:bg-white/4 transition-colors px-3 py-3 flex items-start gap-3"
                    >
                      <Badge className={cn('shrink-0 mt-0.5', style.badge)}>{m.category}</Badge>
                      <div className="flex-1 min-w-0 text-sm text-fg leading-relaxed">
                        {m.fact}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="shrink-0 h-9 w-9 rounded-2xl border border-white/10 bg-white/0 hover:bg-white/5 transition-colors flex items-center justify-center"
                        title="Delete memory"
                      >
                        <Trash2 size={15} className="text-fg-muted" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}

