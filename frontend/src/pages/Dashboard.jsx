import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Sparkles,
  CalendarClock,
  Flame,
  Radar,
  Layers,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Page, PageSubtitle, PageTitle } from '../components/ui/Page'
import { Badge } from '../components/ui/Badge'
import { Progress } from '../components/ui/Progress'
import { RingProgress } from '../components/ui/RingProgress'
import { Skeleton } from '../components/ui/Skeleton'
import { Sparkline } from '../components/ui/Sparkline'
import DailyBriefing from '../components/DailyBriefing.jsx'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function safePct(n) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

export default function Dashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [goals, setGoals] = useState([])
  const [journals, setJournals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([api.get('/tasks'), api.get('/goals'), api.get('/journal')])
      .then(([t, g, j]) => {
        if (!alive) return
        setTasks(t.data ?? [])
        setGoals(g.data ?? [])
        setJournals(j.data ?? [])
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const computed = useMemo(() => {
    const done = tasks.filter(t => t.done).length
    const pending = tasks.filter(t => !t.done).length

    const avgGoalPct = goals.length
      ? Math.round(
          goals.reduce((acc, g) => acc + safePct((Number(g.progress ?? 0) / Math.max(1, Number(g.target ?? 100))) * 100), 0) / goals.length,
        )
      : 0

    const streak = Math.min(14, Math.max(0, journals.length))

    const upcoming = tasks
      .filter(t => !t.done)
      .slice(0, 6)

    return { done, pending, avgGoalPct, streak, upcoming }
  }, [tasks, goals, journals])

  const stats = [
    {
      label: 'Completed',
      value: computed.done,
      icon: CheckCircle2,
      tone: 'green',
      hint: 'Tasks finished',
      spark: [2, 4, 3, 6, 5, 7, 9],
    },
    {
      label: 'Pending',
      value: computed.pending,
      icon: CircleDashed,
      tone: 'amber',
      hint: 'Open tasks',
      spark: [8, 7, 7, 6, 6, 5, 5],
    },
    {
      label: 'Goals',
      value: `${computed.avgGoalPct}%`,
      icon: Radar,
      tone: 'purple',
      hint: 'Avg progress',
      spark: [10, 14, 12, 18, 22, 28, 30],
    },
    {
      label: 'Streak',
      value: `${computed.streak}d`,
      icon: Flame,
      tone: 'blue',
      hint: 'Reflection streak',
      spark: [1, 1, 2, 2, 3, 3, 4],
    },
  ]

  return (
    <Page>
      <div className="px-1 md:px-2">
        <DailyBriefing />
        <div className="mb-6 md:mb-8">
          <PageTitle>
            {greeting()},{' '}
            <span className="text-gradient">{(user?.name ?? 'there').split(' ')[0]}</span>
          </PageTitle>
          <PageSubtitle>PulseOS orchestrates your tasks, goals, and reflections into one signal.</PageSubtitle>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {stats.map((s, idx) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * idx }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <s.icon size={18} className="text-fg-muted" />
                          </div>
                          <div>
                            <CardTitle>{s.label}</CardTitle>
                            <CardDescription>{s.hint}</CardDescription>
                          </div>
                        </div>
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-end justify-between gap-3">
                        <div className="text-2xl font-semibold text-fg tracking-tight">
                          {loading ? <span className="text-fg-muted">—</span> : s.value}
                        </div>
                        <Sparkline className="opacity-90" data={s.spark} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>AI Summary</CardTitle>
                      <CardDescription>Today’s high-level signal, generated from your data.</CardDescription>
                    </div>
                    <Badge tone="blue" className="gap-1">
                      <Sparkles size={12} />
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[88%]" />
                      <Skeleton className="h-4 w-[76%]" />
                      <Skeleton className="h-4 w-[64%]" />
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed text-fg">
                      You have{' '}
                      <span className="text-gradient font-semibold">{computed.pending}</span> tasks pending and your
                      average goal progress is{' '}
                      <span className="text-gradient font-semibold">{computed.avgGoalPct}%</span>. Lock in one
                      high-impact win early, then batch the rest into a short sprint.
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3">
                      <div className="text-[11px] text-fg-muted">Focus Score</div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-lg font-semibold text-fg">{loading ? '—' : `${Math.max(42, 100 - computed.pending * 6)}`}</div>
                        <RingProgress value={loading ? 0 : Math.max(42, 100 - computed.pending * 6)} size={52} stroke={6} />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3">
                      <div className="text-[11px] text-fg-muted">Momentum</div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-lg font-semibold text-fg">{loading ? '—' : `${Math.min(100, computed.done * 12 + 35)}%`}</div>
                        <RingProgress value={loading ? 0 : Math.min(100, computed.done * 12 + 35)} size={52} stroke={6} />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3">
                      <div className="text-[11px] text-fg-muted">Reflection</div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-lg font-semibold text-fg">{loading ? '—' : `${Math.min(100, computed.streak * 7)}%`}</div>
                        <RingProgress value={loading ? 0 : Math.min(100, computed.streak * 7)} size={52} stroke={6} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Upcoming Tasks</CardTitle>
                      <CardDescription>Next actions to keep you in flow.</CardDescription>
                    </div>
                    <Link to="/tasks" className="text-xs text-neon-blue hover:text-neon-blue/80 inline-flex items-center gap-1">
                      View
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : computed.upcoming.length ? (
                    computed.upcoming.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 hover:bg-white/4 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <CalendarClock size={16} className="text-fg-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-fg truncate">{t.title}</div>
                          <div className="text-[11px] text-fg-muted">Priority: {t.priority ?? 'medium'}</div>
                        </div>
                        <Badge tone={t.priority === 'high' ? 'red' : t.priority === 'low' ? 'gray' : 'amber'}>
                          {t.priority ?? 'medium'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-fg-muted">No upcoming tasks. Add one to start a new streak.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Productivity Overview</CardTitle>
                    <CardDescription>Signals across tasks, goals, and reflection.</CardDescription>
                  </div>
                  <Badge tone="purple" className="gap-1">
                    <Layers size={12} />
                    Widgets
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <div className="text-xs text-fg-muted mb-2">Task completion</div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-fg">
                        {loading ? '—' : `${computed.done}/${computed.done + computed.pending}`}
                      </div>
                      <RingProgress
                        value={loading ? 0 : safePct((computed.done / Math.max(1, computed.done + computed.pending)) * 100)}
                        size={56}
                        stroke={6}
                        label="Done"
                      />
                    </div>
                    <div className="mt-3">
                      <Progress value={loading ? 0 : safePct((computed.done / Math.max(1, computed.done + computed.pending)) * 100)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <div className="text-xs text-fg-muted mb-2">Goal progress</div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-fg">{loading ? '—' : `${computed.avgGoalPct}%`}</div>
                      <RingProgress value={loading ? 0 : computed.avgGoalPct} size={56} stroke={6} label="Avg" />
                    </div>
                    <div className="mt-3">
                      <Progress value={loading ? 0 : computed.avgGoalPct} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <div className="text-xs text-fg-muted mb-2">Consistency</div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-fg">{loading ? '—' : `${computed.streak} days`}</div>
                      <RingProgress value={loading ? 0 : Math.min(100, computed.streak * 7)} size={56} stroke={6} label="Streak" />
                    </div>
                    <div className="mt-3">
                      <Progress value={loading ? 0 : Math.min(100, computed.streak * 7)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Recommendations</CardTitle>
                <CardDescription>Next best actions based on your current load.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : (
                  [
                    {
                      title: 'Ship one high-impact win',
                      body: 'Pick a single task and finish it before opening anything new.',
                      tone: 'blue',
                    },
                    {
                      title: 'Turn goals into milestones',
                      body: 'Add 3 milestones to your top goal and track weekly.',
                      tone: 'purple',
                    },
                    {
                      title: 'End-of-day reflection',
                      body: 'Log a short journal entry to keep your streak alive.',
                      tone: 'gray',
                    },
                  ].map((r) => (
                    <div
                      key={r.title}
                      className="rounded-2xl border border-white/10 bg-white/3 p-4 hover:bg-white/4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-fg">{r.title}</div>
                        <Badge tone={r.tone}>AI</Badge>
                      </div>
                      <div className="text-xs text-fg-muted mt-1 leading-relaxed">{r.body}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Chronological trail across your OS.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(loading
                    ? Array.from({ length: 5 }).map((_, i) => ({ id: i, loading: true }))
                    : [
                        ...tasks.slice(0, 2).map((t) => ({ id: `t-${t.id}`, label: `Task: ${t.title}`, tone: t.done ? 'green' : 'amber' })),
                        ...goals.slice(0, 2).map((g) => ({ id: `g-${g.id}`, label: `Goal: ${g.title}`, tone: 'purple' })),
                        ...journals.slice(0, 1).map((j) => ({ id: `j-${j.id}`, label: `Journal: ${String(j.content ?? '').slice(0, 42)}…`, tone: 'blue' })),
                      ].slice(0, 5))//
                    .map((a, idx) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <div className="mt-1 w-2.5 h-2.5 rounded-full bg-white/15 border border-white/10" />
                        <div className="flex-1 min-w-0">
                          {a.loading ? (
                            <Skeleton className="h-4 w-full" />
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm text-fg truncate">{a.label}</div>
                              <Badge tone={a.tone}>{idx === 0 ? 'Now' : 'Recent'}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  )
}
