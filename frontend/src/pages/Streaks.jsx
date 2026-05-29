// frontend/src/pages/Streaks.jsx
// Displays streak data for tasks, journal, and goals.
// Also handles push notification permission request.

import { useState, useEffect } from 'react'
import api from '../services/api'
import { subscribeToPush, getNotificationPermission } from '../services/push'
import { Flame, BookOpen, Target, CheckSquare, Bell, BellOff, Loader2 } from 'lucide-react'

// ─── Streak config ────────────────────────────────────────────────────────────
const STREAK_CONFIG = {
  task: {
    label: 'Task Streak',
    icon:  CheckSquare,
    color: 'violet',
    tip:   'Complete at least one task every day to keep this streak alive.',
  },
  journal: {
    label: 'Journal Streak',
    icon:  BookOpen,
    color: 'emerald',
    tip:   'Write a journal entry every day.',
  },
  goal: {
    label: 'Goal Streak',
    icon:  Target,
    color: 'amber',
    tip:   'Update your goal progress every day.',
  },
}

const COLOR_MAP = {
  violet:  { ring: 'ring-violet-500/30',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20'  },
  emerald: { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  amber:   { ring: 'ring-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
}

// ─── Streak Card ──────────────────────────────────────────────────────────────
function StreakCard({ type, data }) {
  const config = STREAK_CONFIG[type]
  const colors = COLOR_MAP[config.color]
  const Icon   = config.icon
  const isAlive = data.current > 0

  return (
    <div className={`bg-[#0f1420]/80 border ${colors.border} rounded-2xl p-5 backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <Icon size={18} className={colors.text} />
        </div>
        {isAlive && (
          <div className="flex items-center gap-1">
            <Flame size={14} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-400">Active</span>
          </div>
        )}
      </div>

      <p className="text-xs text-fg-muted mb-1">{config.label}</p>

      {/* Current streak — big number */}
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-4xl font-black ${colors.text}`}>{data.current}</span>
        <span className="text-sm text-fg-muted mb-1">day{data.current !== 1 ? 's' : ''}</span>
      </div>

      {/* Longest */}
      <div className="flex items-center justify-between text-xs text-fg-muted border-t border-white/5 pt-3">
        <span>Best streak</span>
        <span className={`font-bold ${colors.text}`}>{data.longest} days</span>
      </div>

      <p className="text-[11px] text-fg-muted/60 mt-2">{config.tip}</p>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Streaks() {
  const [streaks, setStreaks]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [permission, setPermission]     = useState(getNotificationPermission())
  const [subscribing, setSubscribing]   = useState(false)
  const [testSent, setTestSent]         = useState(false)

  useEffect(() => {
    fetchStreaks()
  }, [])

  async function fetchStreaks() {
    try {
      const { data } = await api.get('/streaks')
      setStreaks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleEnableNotifications() {
    setSubscribing(true)
    try {
      const success = await subscribeToPush()
      setPermission(getNotificationPermission())
      if (success) {
        // Send a test notification immediately so user knows it works
        await api.post('/push/test')
        setTestSent(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubscribing(false)
    }
  }

  const totalCurrent = streaks
    ? Object.values(streaks).reduce((sum, s) => sum + s.current, 0)
    : 0

  return (
    <div className="space-y-6 p-1">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Flame size={18} className="text-orange-400" />
          <h1 className="text-2xl font-bold text-fg">Streaks</h1>
        </div>
        <p className="text-sm text-fg-muted">Stay consistent. Every day counts.</p>
      </div>

      {/* ── Total streak summary ── */}
      {streaks && (
        <div className="bg-gradient-to-r from-orange-500/10 to-violet-500/10 border border-orange-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Flame size={22} className="text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-fg-muted">Combined active streak days</p>
              <p className="text-3xl font-black text-fg">{totalCurrent}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Streak cards ── */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-fg-muted" />
        </div>
      ) : streaks ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(streaks).map(([type, data]) => (
            <StreakCard key={type} type={type} data={data} />
          ))}
        </div>
      ) : null}

      {/* ── Push notifications panel ── */}
      <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell size={15} className="text-violet-400" />
              <h2 className="text-sm font-semibold text-fg">Push Notifications</h2>
            </div>
            <p className="text-xs text-fg-muted max-w-sm">
              Get reminded to complete tasks at 8PM and journal at 9PM. Keeps your streaks alive.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {permission === 'granted' ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <Bell size={13} />
                Notifications enabled
              </div>
            ) : permission === 'denied' ? (
              <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
                <BellOff size={13} />
                Blocked in browser settings
              </div>
            ) : (
              <button
                onClick={handleEnableNotifications}
                disabled={subscribing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {subscribing
                  ? <><Loader2 size={13} className="animate-spin" /> Enabling...</>
                  : <><Bell size={13} /> Enable Notifications</>
                }
              </button>
            )}

            {testSent && (
              <p className="text-[11px] text-emerald-400">✓ Test notification sent!</p>
            )}
          </div>
        </div>

        {/* Reminder schedule */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
          {[
            { time: '8:00 PM', label: 'Task reminder',   icon: '📋' },
            { time: '9:00 PM', label: 'Journal reminder', icon: '📓' },
          ].map(r => (
            <div key={r.time} className="flex items-center gap-2 text-xs text-fg-muted">
              <span>{r.icon}</span>
              <span>{r.label}</span>
              <span className="ml-auto font-mono text-violet-400">{r.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}