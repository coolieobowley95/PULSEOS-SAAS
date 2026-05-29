import { useEffect, useMemo, useState } from 'react'
import { RefreshCcw, Sparkles, CalendarDays, Target } from 'lucide-react'
import api from '../services/api'

const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

export default function DailyBriefing() {
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const loadBriefing = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/briefing/today')
      setBriefing(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load today briefing')
    } finally {
      setLoading(false)
    }
  }

  const refreshBriefing = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const response = await api.post('/briefing/refresh')
      setBriefing(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to refresh briefing')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadBriefing()
  }, [])

  const topTasks = useMemo(() => {
    if (!briefing?.topTasks) return []
    return briefing.topTasks.split('|').map((task) => task.trim()).filter(Boolean)
  }, [briefing])

  return (
    <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500/10 via-sky-400/10 to-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
            <Sparkles size={14} /> Daily Briefing
          </div>
          <div className="mt-3 text-2xl font-semibold text-fg">Your morning briefing</div>
          <p className="mt-2 text-sm text-fg-muted">A personal plan built from your tasks, goals, and recent moods.</p>
        </div>
        <button
          type="button"
          onClick={refreshBriefing}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5 rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 shadow-inner shadow-slate-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Today</p>
              <p className="mt-2 text-lg font-semibold text-white">{formatDate(new Date())}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200">
              <CalendarDays size={14} /> Morning plan
            </div>
          </div>
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 w-full rounded-full bg-slate-800/80" />
              <div className="h-28 rounded-[1.5rem] bg-slate-800/80" />
              <div className="h-4 w-3/4 rounded-full bg-slate-800/80" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-400/10 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white">Plan</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{briefing.plan}</p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Motivation</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{briefing.motivation}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 shadow-inner shadow-slate-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Top tasks</p>
                <p className="mt-2 text-lg font-semibold text-white">{topTasks.length ? 'Today’s priorities' : 'No tasks yet'}</p>
              </div>
              <Target size={20} className="text-slate-300" />
            </div>
            <div className="mt-5 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-3 rounded-full bg-slate-800/80" />
                ))
              ) : topTasks.length ? (
                topTasks.map((task, index) => (
                  <div key={index} className="rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                    {task}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">You don’t have top tasks for today. Add a task to your list to see a briefing suggestion.</p>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 shadow-inner shadow-slate-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Focus tip</p>
                <p className="mt-2 text-lg font-semibold text-white">Make today smoother</p>
              </div>
              <Sparkles size={20} className="text-slate-300" />
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-300">{loading ? 'Loading your focus tip…' : briefing?.focusTip}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
