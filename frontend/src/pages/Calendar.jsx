// frontend/src/pages/Calendar.jsx

import { useState, useEffect } from 'react'
import api from '../services/api'

import {
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Unlink,
  Send,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return ''

  const d = new Date(iso)

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(iso) {
  if (!iso) return 'All day'

  // All-day events don't include time
  if (!iso.includes('T')) return 'All day'

  const d = new Date(iso)

  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupByDate(events) {
  return events.reduce((acc, event) => {
    const dateKey = formatDate(event.start)

    if (!acc[dateKey]) {
      acc[dateKey] = []
    }

    acc[dateKey].push(event)

    return acc
  }, {})
}

// ─────────────────────────────────────────────────────────────
// Event Card
// ─────────────────────────────────────────────────────────────

function EventCard({ event }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <div className="mt-0.5 w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
        <CalendarIcon size={14} className="text-violet-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg truncate">
          {event.title}
        </p>

        <p className="text-xs text-fg-muted mt-0.5">
          {event.isAllDay
            ? 'All day'
            : `${formatTime(event.start)} – ${formatTime(event.end)}`}
        </p>

        {event.location && (
          <p className="text-xs text-fg-muted/60 mt-0.5 truncate">
            📍 {event.location}
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function Calendar() {
  const [connected, setConnected] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)

  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)

  const [connectLoading, setConnectLoading] = useState(false)

  const [nlText, setNlText] = useState('')
  const [creating, setCreating] = useState(false)

  const [createResult, setCreateResult] = useState(null)
  const [createError, setCreateError] = useState(null)

  const [disconnecting, setDisconnecting] = useState(false)

  // ───────────────────────────────────────────────────────────
  // On mount
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/calendar')
    }

    checkStatus()
  }, [])

  // ───────────────────────────────────────────────────────────
  // Check calendar status
  // ───────────────────────────────────────────────────────────

  async function checkStatus() {
    try {
      setStatusLoading(true)

      const { data } = await api.get('/calendar/status')

      setConnected(data.connected)

      if (data.connected) {
        fetchEvents()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setStatusLoading(false)
    }
  }

  // ───────────────────────────────────────────────────────────
  // Fetch events
  // ───────────────────────────────────────────────────────────

  async function fetchEvents() {
    try {
      setEventsLoading(true)

      const { data } = await api.get('/calendar/events')

      setEvents(data.events || [])
    } catch (err) {
      console.error(err)
    } finally {
      setEventsLoading(false)
    }
  }

  // ───────────────────────────────────────────────────────────
  // Connect Google Calendar
  // ───────────────────────────────────────────────────────────

  async function handleConnect() {
    try {
      setConnectLoading(true)

      const { data } = await api.get('/calendar/auth/url')

      window.location.href = data.url
    } catch (err) {
      console.error(err)
      setConnectLoading(false)
    }
  }

  // ───────────────────────────────────────────────────────────
  // Disconnect
  // ───────────────────────────────────────────────────────────

  async function handleDisconnect() {
    const confirmed = window.confirm(
      'Disconnect Google Calendar? Your events will no longer sync.'
    )

    if (!confirmed) return

    try {
      setDisconnecting(true)

      await api.delete('/calendar/disconnect')

      setConnected(false)
      setEvents([])
    } catch (err) {
      console.error(err)
    } finally {
      setDisconnecting(false)
    }
  }

  // ───────────────────────────────────────────────────────────
  // Create event
  // ───────────────────────────────────────────────────────────

  async function handleCreateEvent(e) {
    e.preventDefault()

    if (!nlText.trim() || creating) return

    setCreating(true)
    setCreateResult(null)
    setCreateError(null)

    try {
      const { data } = await api.post('/calendar/events', {
        text: nlText,
      })

      setCreateResult(data.event)

      setNlText('')

      fetchEvents()
    } catch (err) {
      console.error(err)

      setCreateError(
        err.response?.data?.error || 'Failed to create event'
      )
    } finally {
      setCreating(false)
    }
  }

  const grouped = groupByDate(events)

  // ───────────────────────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────────────────────

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2
          size={24}
          className="animate-spin text-fg-muted"
        />
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-1">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg">
          Google Calendar
        </h1>

        <p className="text-sm text-fg-muted mt-0.5">
          Sync your schedule and create events with natural language.
        </p>
      </div>

      {/* Not Connected */}
      {!connected && (
        <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl p-8 backdrop-blur-sm flex flex-col items-center text-center gap-4">

          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-violet-500/20 flex items-center justify-center">
            <CalendarIcon
              size={28}
              className="text-violet-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-fg">
              Connect Google Calendar
            </h2>

            <p className="text-sm text-fg-muted mt-1 max-w-sm">
              Sync your events, let the AI briefing read your
              schedule, and create events using natural language.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={connectLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold text-sm shadow-lg shadow-violet-900/30 disabled:opacity-50 transition-all"
          >
            {connectLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CalendarIcon size={16} />
                Connect Google Calendar
              </>
            )}
          </button>
        </div>
      )}

      {/* Connected */}
      {connected && (
        <div className="space-y-5">

          {/* Status */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={15}
                className="text-emerald-400"
              />

              <span className="text-sm font-medium text-emerald-400">
                Google Calendar connected
              </span>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-red-400 transition-colors"
            >
              <Unlink size={13} />

              {disconnecting
                ? 'Disconnecting...'
                : 'Disconnect'}
            </button>
          </div>

          {/* Create Event */}
          <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-sm">

            <div className="flex items-center gap-2 mb-3">
              <Plus size={15} className="text-violet-400" />

              <h2 className="text-sm font-semibold text-fg">
                Create Event
              </h2>

              <span className="text-[10px] text-fg-muted font-mono bg-white/5 px-2 py-0.5 rounded-full">
                natural language
              </span>
            </div>

            <form
              onSubmit={handleCreateEvent}
              className="flex gap-2"
            >
              <input
                type="text"
                value={nlText}
                onChange={(e) => setNlText(e.target.value)}
                placeholder='e.g. "Team standup tomorrow at 10am for 30 minutes"'
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-fg px-4 py-2.5 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-fg-muted/40 transition-colors"
              />

              <button
                type="submit"
                disabled={creating || !nlText.trim()}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {creating ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>

            {/* Success */}
            {createResult && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl">

                <CheckCircle2
                  size={15}
                  className="text-emerald-400 mt-0.5 shrink-0"
                />

                <div className="text-sm">
                  <p className="text-emerald-400 font-medium">
                    Event created!
                  </p>

                  <p className="text-fg-muted text-xs mt-0.5">
                    {createResult.title} ·{' '}
                    {formatTime(createResult.start)}
                  </p>

                  {createResult?.link && (
                    <a
                      href={String(createResult.link)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block"
                    >
                      Open in Google Calendar →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {createError && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-red-500/[0.07] border border-red-500/20 rounded-xl">

                <AlertCircle
                  size={15}
                  className="text-red-400 shrink-0"
                />

                <p className="text-sm text-red-300">
                  {createError}
                </p>
              </div>
            )}
          </div>

          {/* Events */}
          <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-sm">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-fg">
                Upcoming — Next 7 Days
              </h2>

              <button
                onClick={fetchEvents}
                className="text-xs text-fg-muted hover:text-fg transition-colors"
              >
                Refresh
              </button>
            </div>

            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={20}
                  className="animate-spin text-fg-muted"
                />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-fg-muted">
                  No upcoming events in the next 7 days.
                </p>
              </div>
            ) : (
              <div className="space-y-4">

                {Object.entries(grouped).map(
                  ([dateLabel, dayEvents]) => (
                    <div key={dateLabel}>

                      <p className="text-[11px] font-mono tracking-widest text-violet-400 uppercase mb-1">
                        {dateLabel}
                      </p>

                      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4">

                        {dayEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                          />
                        ))}

                      </div>
                    </div>
                  )
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


