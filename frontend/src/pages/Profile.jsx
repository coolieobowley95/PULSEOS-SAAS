// frontend/src/pages/Profile.jsx
import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  Mail, Lock, Brain, Flame, CheckSquare,
  Target, BookOpen, Edit3, Save,
  ChevronDown, ChevronUp, Trash2, Loader2,
  Sparkles, CreditCard, Zap
} from 'lucide-react'

const CAT_COLORS = {
  project:    'bg-violet-500/10 text-violet-400 border-violet-500/20',
  habit:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  goal:       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  struggle:   'bg-red-500/10 text-red-400 border-red-500/20',
  preference: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  personal:   'bg-pink-500/10 text-pink-400 border-pink-500/20',
  work:       'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  general:    'bg-white/5 text-fg-muted border-white/10',
}

function StatCard({ icon: Icon, label, value, color = 'violet' }) {
  const colors = {
    violet:  'bg-violet-500/10 border-violet-500/20 text-violet-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
    blue:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
    orange:  'bg-orange-500/10 border-orange-500/20 text-orange-400',
  }
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${colors[color]}`}>
      <Icon size={18} />
      <div>
        <p className="text-2xl font-black text-fg">{value}</p>
        <p className="text-[11px] text-fg-muted">{label}</p>
      </div>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-fg">{title}</span>
        </div>
        {open ? <ChevronUp size={15} className="text-fg-muted" /> : <ChevronDown size={15} className="text-fg-muted" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-mono tracking-widest text-violet-400 uppercase">{label}</label>
      {children}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-fg px-3 py-2.5 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-fg-muted/40 transition-colors ${className}`}
      {...props}
    />
  )
}

function SaveButton({ loading, label = 'Save changes' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
      {loading ? 'Saving...' : label}
    </button>
  )
}

function FeedbackMsg({ msg }) {
  if (!msg) return null
  const isError = msg.startsWith('✗')
  return (
    <p className={`text-xs mt-2 ${isError ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>
  )
}

function Avatar({ name, avatar, size = 'lg' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm'
  if (avatar) {
    return <img src={avatar} alt={name} className={`${sz} rounded-3xl object-cover border-2 border-violet-500/30`} />
  }
  return (
    <div className={`${sz} rounded-3xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center font-black text-white border-2 border-violet-500/30`}>
      {initials}
    </div>
  )
}

// ─── Billing Section ──────────────────────────────────────────────────────────
function BillingSection({ plan }) {
  const [loading, setLoading] = useState(false)
  const isPro = plan === 'pro'

  async function handleUpgrade() {
    setLoading(true)
    try {
      const { data } = await api.post('/billing/checkout')
      window.location.href = data.url
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleManage() {
    setLoading(true)
    try {
      const { data } = await api.post('/billing/portal')
      window.location.href = data.url
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionCard title="Plan & Billing" icon={CreditCard} defaultOpen={true}>
      {isPro ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <Sparkles size={18} className="text-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-fg">You're on Pro 🎉</p>
              <p className="text-xs text-fg-muted">All features unlocked. Thank you for supporting PulseOS!</p>
            </div>
          </div>
          <button
            onClick={handleManage}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
            {loading ? 'Loading...' : 'Manage subscription'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">Free Plan</span>
              <span className="text-[10px] font-mono tracking-widest text-fg-muted uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">Current</span>
            </div>
            <ul className="space-y-1.5 text-xs text-fg-muted">
              <li>✓ Tasks, goals, journal</li>
              <li>✓ 10 AI chat messages/day</li>
              <li>✓ 5 memories stored</li>
              <li className="text-white/30">✗ Unlimited AI chat</li>
              <li className="text-white/30">✗ Full analytics & reports</li>
              <li className="text-white/30">✗ Daily briefing</li>
              <li className="text-white/30">✗ GitHub integration</li>
            </ul>
          </div>

          <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg flex items-center gap-1.5">
                <Zap size={14} className="text-violet-400" /> Pro Plan
              </span>
              <span className="text-sm font-black text-violet-400">£9/mo</span>
            </div>
            <ul className="space-y-1.5 text-xs text-fg-muted">
              <li className="text-emerald-400">✓ Everything in Free</li>
              <li className="text-emerald-400">✓ Unlimited AI chat</li>
              <li className="text-emerald-400">✓ Unlimited memories</li>
              <li className="text-emerald-400">✓ Full analytics & weekly reports</li>
              <li className="text-emerald-400">✓ Daily AI briefing</li>
              <li className="text-emerald-400">✓ GitHub integration</li>
              <li className="text-emerald-400">✓ Spotify integration</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              {loading ? 'Redirecting...' : 'Upgrade to Pro — £9/mo'}
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const [editName, setEditName]     = useState('')
  const [editBio, setEditBio]       = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [newEmail, setNewEmail]           = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailMsg, setEmailMsg]           = useState('')
  const [emailSaving, setEmailSaving]     = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg]         = useState('')
  const [pwSaving, setPwSaving]   = useState(false)

  const [memories, setMemories]               = useState([])
  const [deletingMemoryId, setDeletingMemoryId] = useState(null)

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    try {
      const { data: d } = await api.get('/profile')
      setData(d)
      setEditName(d.user.name || '')
      setEditBio(d.user.bio || '')
      setEditAvatar(d.user.avatar || '')
      setMemories(d.memories || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg('')
    try {
      await api.patch('/profile', { name: editName, bio: editBio, avatar: editAvatar })
      setProfileMsg('✓ Profile updated')
      fetchProfile()
    } catch (err) {
      setProfileMsg('✗ ' + (err.response?.data?.error || 'Failed to update'))
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleEmailSave(e) {
    e.preventDefault()
    setEmailSaving(true)
    setEmailMsg('')
    try {
      await api.patch('/profile/email', { email: newEmail, password: emailPassword })
      setEmailMsg('✓ Email updated')
      setNewEmail('')
      setEmailPassword('')
      fetchProfile()
    } catch (err) {
      setEmailMsg('✗ ' + (err.response?.data?.error || 'Failed to update email'))
    } finally {
      setEmailSaving(false)
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwMsg('✗ Passwords do not match'); return }
    if (newPw.length < 8)    { setPwMsg('✗ Minimum 8 characters'); return }
    setPwSaving(true)
    setPwMsg('')
    try {
      await api.patch('/profile/password', { currentPassword: currentPw, newPassword: newPw })
      setPwMsg('✓ Password changed')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwMsg('✗ ' + (err.response?.data?.error || 'Failed to change password'))
    } finally {
      setPwSaving(false)
    }
  }

  async function handleDeleteMemory(id) {
    setDeletingMemoryId(id)
    try {
      await api.delete(`/memory/${id}`)
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingMemoryId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-fg-muted" />
      </div>
    )
  }

  const { user = {}, stats = {}, streaks = {} } = data || {}

  return (
    <div className="space-y-5 p-1 max-w-2xl mx-auto">

      {/* ── Profile header ── */}
      <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} avatar={user.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-fg truncate">{user.name}</h1>
            <p className="text-sm text-fg-muted truncate">{user.email}</p>
            {user.bio && <p className="text-xs text-fg-muted/70 mt-1 line-clamp-2">{user.bio}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border ${user.plan === 'pro' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' : 'text-fg-muted bg-white/5 border-white/10'}`}>
                {user.plan} plan
              </span>
              <span className="text-[11px] text-fg-muted">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={CheckSquare} label="Tasks done"      value={stats.tasksDone}     color="violet"  />
        <StatCard icon={Target}      label="Goals"           value={stats.goalCount}      color="amber"   />
        <StatCard icon={BookOpen}    label="Journal entries" value={stats.journalCount}   color="emerald" />
        <StatCard icon={Flame}       label="Task streak"     value={`${streaks?.task?.current ?? 0}d`}    color="orange"  />
        <StatCard icon={Flame}       label="Journal streak"  value={`${streaks?.journal?.current ?? 0}d`} color="emerald" />
        <StatCard icon={Brain}       label="AI memories"     value={stats.memoriesCount}  color="blue"    />
      </div>

      {/* ── Billing ── */}
      <BillingSection plan={user.plan} />

      {/* ── Edit profile ── */}
      <SectionCard title="Edit Profile" icon={Edit3}>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <Field label="Display name">
            <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Bio">
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="A short bio about yourself..."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-fg px-3 py-2.5 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-fg-muted/40 transition-colors resize-none"
            />
          </Field>
          <Field label="Avatar URL (optional)">
            <Input value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="https://..." />
          </Field>
          <div className="flex items-center gap-3">
            <SaveButton loading={profileSaving} />
            <FeedbackMsg msg={profileMsg} />
          </div>
        </form>
      </SectionCard>

      {/* ── Change email ── */}
      <SectionCard title="Change Email" icon={Mail} defaultOpen={false}>
        <form onSubmit={handleEmailSave} className="space-y-4">
          <Field label="New email">
            <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" />
          </Field>
          <Field label="Confirm password">
            <Input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="Your current password" />
          </Field>
          <div className="flex items-center gap-3">
            <SaveButton loading={emailSaving} label="Update email" />
            <FeedbackMsg msg={emailMsg} />
          </div>
        </form>
      </SectionCard>

      {/* ── Change password ── */}
      <SectionCard title="Change Password" icon={Lock} defaultOpen={false}>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <Field label="Current password">
            <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="New password">
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
          </Field>
          <div className="flex items-center gap-3">
            <SaveButton loading={pwSaving} label="Change password" />
            <FeedbackMsg msg={pwMsg} />
          </div>
        </form>
      </SectionCard>

      {/* ── AI Memory viewer ── */}
      <SectionCard title={`AI Memory (${memories.length})`} icon={Brain} defaultOpen={false}>
        {memories.length === 0 ? (
          <p className="text-sm text-fg-muted py-2">
            No memories yet. Chat with the AI assistant and it will start remembering things about you.
          </p>
        ) : (
          <div className="space-y-2">
            {memories.map(m => (
              <div key={m.id} className="flex items-start justify-between gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-fg">{m.fact}</p>
                  <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full border font-mono ${CAT_COLORS[m.category] || CAT_COLORS.general}`}>
                    {m.category}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteMemory(m.id)}
                  disabled={deletingMemoryId === m.id}
                  className="text-fg-muted hover:text-red-400 transition-colors shrink-0 mt-0.5"
                >
                  {deletingMemoryId === m.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  )
}