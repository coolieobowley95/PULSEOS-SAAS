// frontend/src/pages/Integrations.jsx
// Manages GitHub integration (and future integrations).
// GitHub: connect via PAT, view commits, repos, activity chart.

import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  Github, GitCommit, Star, ExternalLink,
  CheckCircle2, Unlink, Loader2, AlertCircle,
  BarChart3, Code2, Zap,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (days > 0)  return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${mins}m ago`
}

const LANG_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', CSS: '#563d7c', HTML: '#e34c26',
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function CommitRow({ commit }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0">
      <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <GitCommit size={13} className="text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-fg truncate">{commit.message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-mono text-violet-400">{commit.sha}</span>
          <span className="text-[11px] text-fg-muted">·</span>
          <span className="text-[11px] text-fg-muted truncate">{commit.repo.split('/')[1] || commit.repo}</span>
          <span className="text-[11px] text-fg-muted ml-auto shrink-0">{timeAgo(commit.date)}</span>
        </div>
      </div>
    </div>
  )
}

function RepoCard({ repo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Code2 size={15} className="text-fg-muted shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg truncate">{repo.name}</p>
          {repo.language && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: LANG_COLORS[repo.language] || '#888' }}
              />
              <span className="text-[11px] text-fg-muted">{repo.language}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-fg-muted">
          <Star size={11} />
          {repo.stars}
        </div>
        <ExternalLink size={13} className="text-fg-muted group-hover:text-violet-400 transition-colors" />
      </div>
    </a>
  )
}

function ActivityBar({ day, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
        <div
          className="w-full rounded-t-sm bg-violet-500/60 transition-all"
          style={{ height: `${Math.max(pct, count > 0 ? 8 : 2)}%`, minHeight: count > 0 ? 4 : 1 }}
        />
      </div>
      <span className="text-[10px] text-fg-muted font-mono">{day}</span>
      {count > 0 && <span className="text-[10px] text-violet-400 font-bold">{count}</span>}
    </div>
  )
}

// ─── GitHub Panel ─────────────────────────────────────────────────────────────
function GitHubPanel() {
  const [status,       setStatus]       = useState(null)
  const [activity,     setActivity]     = useState(null)
  const [token,        setToken]        = useState('')
  const [connecting,   setConnecting]   = useState(false)
  const [connectError, setConnectError] = useState('')
  const [loading,      setLoading]      = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [activeTab,    setActiveTab]    = useState('commits')

  useEffect(() => { fetchStatus() }, [])

  async function fetchStatus() {
    try {
      const { data } = await api.get('/github/status')
      setStatus(data)
      if (data.connected) fetchActivity()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchActivity() {
    try {
      const { data } = await api.get('/github/activity')
      setActivity(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleConnect(e) {
    e.preventDefault()
    if (!token.trim()) return
    setConnecting(true)
    setConnectError('')
    try {
      const { data } = await api.post('/github/connect', { token })
      setStatus({ connected: true, username: data.username })
      setToken('')
      fetchActivity()
    } catch (err) {
      setConnectError(err.response?.data?.error || 'Invalid token')
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect GitHub?')) return
    setDisconnecting(true)
    try {
      await api.delete('/github/disconnect')
      setStatus({ connected: false, username: null })
      setActivity(null)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <Loader2 size={20} className="animate-spin text-fg-muted" />
    </div>
  )

  // ── Not connected ──
  if (!status?.connected) return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center gap-3 py-6">
        <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Github size={26} className="text-fg-muted" />
        </div>
        <div>
          <h3 className="text-base font-bold text-fg">Connect GitHub</h3>
          <p className="text-xs text-fg-muted mt-1 max-w-xs">
            Track your commits, repos, and coding activity inside PulseOS.
          </p>
        </div>
      </div>

      <form onSubmit={handleConnect} className="space-y-3">
        <div>
          <label className="block text-[10px] font-mono tracking-widest text-violet-400 uppercase mb-1.5">
            Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-fg px-3 py-2.5 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-fg-muted/40 transition-colors font-mono"
          />
          <p className="text-[11px] text-fg-muted mt-1.5">
            Generate at{' '}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
              github.com/settings/tokens
            </a>
            {' '}with <code className="text-violet-300">repo</code> + <code className="text-violet-300">read:user</code> scopes.
          </p>
        </div>

        {connectError && (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertCircle size={13} />
            {connectError}
          </div>
        )}

        <button
          type="submit"
          disabled={connecting || !token.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {connecting
            ? <><Loader2 size={15} className="animate-spin" /> Connecting...</>
            : <><Github size={15} /> Connect GitHub</>
          }
        </button>
      </form>
    </div>
  )

  // ── Connected ──
  const maxCommits = activity
    ? Math.max(...(activity.commitsByDay || []).map(d => d.count), 1)
    : 1

  return (
    <div className="space-y-5">

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            Connected as <span className="font-bold">@{status.username}</span>
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex items-center gap-1 text-xs text-fg-muted hover:text-red-400 transition-colors"
        >
          <Unlink size={12} />
          {disconnecting ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>

      {activity ? (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-violet-400">{activity.totalCommits7d}</p>
              <p className="text-[11px] text-fg-muted">commits this week</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-violet-400">{activity.topRepos.length}</p>
              <p className="text-[11px] text-fg-muted">active repos</p>
            </div>
          </div>

          {/* Activity chart */}
          {activity.commitsByDay?.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={13} className="text-violet-400" />
                <span className="text-[11px] font-mono text-fg-muted uppercase tracking-widest">Last 7 days</span>
              </div>
              <div className="flex items-end gap-1.5">
                {activity.commitsByDay.map(d => (
                  <ActivityBar key={d.day} day={d.day} count={d.count} max={maxCommits} />
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1.5">
            {['commits', 'repos'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-white/[0.03] border-white/[0.07] text-fg-muted hover:text-fg'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Commits */}
          {activeTab === 'commits' && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4">
              {activity.recentCommits.length === 0 ? (
                <p className="text-sm text-fg-muted text-center py-6">No recent commits found.</p>
              ) : (
                activity.recentCommits.map((c, i) => <CommitRow key={i} commit={c} />)
              )}
            </div>
          )}

          {/* Repos */}
          {activeTab === 'repos' && (
            <div className="space-y-2">
              {activity.topRepos.map(r => <RepoCard key={r.fullName} repo={r} />)}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-24">
          <Loader2 size={20} className="animate-spin text-fg-muted" />
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Integrations() {
  return (
    <div className="space-y-6 p-1">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={18} className="text-violet-400" />
          <h1 className="text-2xl font-bold text-fg">Integrations</h1>
        </div>
        <p className="text-sm text-fg-muted">Connect your tools and bring everything into PulseOS.</p>
      </div>

      {/* GitHub card */}
      <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Github size={18} className="text-fg" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-fg">GitHub</h2>
            <p className="text-[11px] text-fg-muted">Commits, repos, coding activity</p>
          </div>
        </div>
        <GitHubPanel />
      </div>

      {/* Coming soon placeholder */}
      <div className="bg-[#0f1420]/40 border border-white/[0.04] rounded-2xl p-5 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-lg">🎵</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-fg">Spotify</h2>
            <p className="text-[11px] text-fg-muted">Mood detection + playlist suggestions — coming soon</p>
          </div>
          <span className="ml-auto text-[10px] font-mono text-fg-muted border border-white/10 px-2 py-0.5 rounded-full">
            Soon
          </span>
        </div>
      </div>

    </div>
  )
}