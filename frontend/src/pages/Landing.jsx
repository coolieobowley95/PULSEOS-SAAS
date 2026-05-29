// frontend/src/pages/Landing.jsx
// Standalone marketing page — no Layout wrapper, no sidebar.
// Links directly to /register and /login.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, CheckSquare, Target, BookOpen, Sparkles,
  BarChart3, Users, Github, Calendar, Bell,
  ArrowRight, Menu, X, Brain, Flame,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Features',  href: '#features'  },
  { label: 'How it works', href: '#how'    },
  { label: 'Stack',     href: '#stack'     },
]

const FEATURES = [
  {
    icon: CheckSquare,
    color: 'violet',
    title: 'Smart Task Management',
    desc:  'Prioritize, track, and complete tasks with AI suggestions that adapt to your work style.',
  },
  {
    icon: Target,
    color: 'emerald',
    title: 'Goal Tracking',
    desc:  'Set ambitious goals, track progress visually, and let AI keep you accountable.',
  },
  {
    icon: BookOpen,
    color: 'amber',
    title: 'AI-Powered Journal',
    desc:  'Write freely. PulseOS extracts mood, patterns, and insights from every entry automatically.',
  },
  {
    icon: Brain,
    color: 'blue',
    title: 'AI Memory System',
    desc:  'Your assistant remembers everything — preferences, struggles, goals — across every conversation.',
  },
  {
    icon: Users,
    color: 'pink',
    title: 'Social Productivity Feed',
    desc:  'Share wins, learn from others, and stay motivated inside a community that actually ships.',
  },
  {
    icon: BarChart3,
    color: 'cyan',
    title: 'Analytics & Reports',
    desc:  'Weekly AI-written reports show your productivity score, mood trends, and what to focus on next.',
  },
  {
    icon: Flame,
    color: 'orange',
    title: 'Streak System',
    desc:  'Daily streaks for tasks, journaling, and goals — with push notifications to keep them alive.',
  },
  {
    icon: Github,
    color: 'slate',
    title: 'GitHub Integration',
    desc:  'See your commits, repos, and coding activity directly inside your productivity dashboard.',
  },
  {
    icon: Calendar,
    color: 'indigo',
    title: 'Google Calendar Sync',
    desc:  "Connect your calendar and let the AI briefing read today's schedule before you start.",
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Create your account',
    desc:  'Sign up in 30 seconds. No credit card. No onboarding survey. Just start.',
  },
  {
    num: '02',
    title: 'Connect your tools',
    desc:  'Link GitHub and Google Calendar. PulseOS pulls your context automatically.',
  },
  {
    num: '03',
    title: 'Let the AI work',
    desc:  'Get a morning briefing, weekly reports, and an assistant that remembers everything.',
  },
]

const STACK = [
  'React + Vite', 'Node.js + Express', 'PostgreSQL', 'Prisma ORM',
  'Socket.io', 'Groq AI', 'JWT Auth', 'Web Push API',
]

const COLOR_MAP = {
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  text: 'text-violet-400'  },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400'   },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400'    },
  pink:    { bg: 'bg-pink-500/10',    border: 'border-pink-500/20',    text: 'text-pink-400'    },
  cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400'    },
  orange:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-400'  },
  slate:   { bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   text: 'text-slate-400'   },
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  text: 'text-indigo-400'  },
}

// ─── Components ───────────────────────────────────────────────────────────────
function Navbar({ menuOpen, setMenuOpen }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#080b14]/90 backdrop-blur-xl border-b border-white/[0.06]' : ''
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-violet-900/40">
          
          </div>
          <span className="font-bold text-white text-base">PulseOS</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl transition-colors shadow-lg shadow-violet-900/30"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={() => setMenuOpen(o => !o)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 space-y-3">
          {NAV_LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-slate-400 hover:text-white py-1.5"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link to="/login" className="text-sm text-center text-slate-300 border border-white/10 rounded-xl py-2.5">
              Sign in
            </Link>
            <Link to="/register" className="text-sm font-bold text-center text-white bg-violet-600 rounded-xl py-2.5">
              Get started free
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

function FeatureCard({ feature }) {
  const c = COLOR_MAP[feature.color]
  const Icon = feature.icon
  return (
    <div className="bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all group">
      <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
        <Icon size={18} className={c.text} />
      </div>
      <h3 className="text-sm font-bold text-white mb-1.5">{feature.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
    </div>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1500
        const steps    = 40
        const inc      = target / steps
        let current    = 0
        const timer = setInterval(() => {
          current += inc
          if (current >= target) { setCount(target); clearInterval(timer) }
          else setCount(Math.floor(current))
        }, duration / steps)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#080b14] text-white overflow-x-hidden">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-800/[0.05] blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/[0.04] blur-[80px]" />
      </div>

      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-semibold text-violet-300 tracking-wide">
              AI-Powered Life OS · Now in Beta
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            The last productivity
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">
              app you'll ever need
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            PulseOS combines tasks, goals, journaling, AI assistance, and social accountability
            into one living system that learns who you are and helps you become who you want to be.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold text-base shadow-xl shadow-violet-900/40 transition-all hover:-translate-y-0.5 w-full sm:w-auto justify-center"
            >
              Start for free
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold text-base transition-all w-full sm:w-auto justify-center"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-slate-600 mt-4">
            Free forever · No credit card required · Setup in 60 seconds
          </p>
        </div>

        {/* ── App preview mockup ── */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="rounded-3xl border border-white/[0.08] bg-[#0d1117] overflow-hidden shadow-2xl shadow-black/60">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 bg-white/[0.04] rounded-lg h-6 flex items-center px-3">
                <span className="text-[11px] text-slate-600 font-mono">app.pulseos.io/dashboard</span>
              </div>
            </div>

            {/* Mock dashboard */}
            <div className="p-6 grid grid-cols-3 gap-4 min-h-[280px]">
              {/* Sidebar mock */}
              <div className="col-span-1 hidden md:flex flex-col gap-2">
                {['Dashboard', 'Tasks', 'Goals', 'Journal', 'AI Chat', 'Feed', 'Analytics'].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                      i === 0
                        ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300'
                        : 'text-slate-600'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-sm ${i === 0 ? 'bg-violet-400' : 'bg-slate-700'}`} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content mock */}
              <div className="col-span-3 md:col-span-2 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="h-4 w-32 bg-white/10 rounded-lg" />
                    <div className="h-3 w-20 bg-white/5 rounded-lg mt-1.5" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/40 to-violet-700/40 border border-violet-500/20" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Tasks done', val: '12', c: 'violet' },
                    { label: 'Goal progress', val: '68%', c: 'emerald' },
                    { label: 'Journal streak', val: '7d', c: 'amber' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                      <div className={`text-lg font-black ${
                        s.c === 'violet' ? 'text-violet-400' :
                        s.c === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>{s.val}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 space-y-2">
                  {[85, 60, 40].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-500/40 shrink-0" />
                      <div className="h-2 bg-white/[0.06] rounded-full flex-1">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-violet-400/40"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Glow under mockup */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-violet-600/20 blur-3xl rounded-full" />
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS
      ════════════════════════════════════════ */}
      <section className="relative py-16 px-6 border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: 9,    suffix: '+', label: 'Core modules'      },
            { val: 100,  suffix: '%', label: 'Free to start'     },
            { val: 4,    suffix: '',  label: 'AI integrations'   },
            { val: 24,   suffix: '/7', label: 'AI briefings'     },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl font-black text-white mb-1">
                <Counter target={s.val} suffix={s.suffix} />
              </div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5 mb-5">
              <Sparkles size={13} className="text-violet-400" />
              <span className="text-xs font-semibold text-slate-400">Everything you need</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Built for people who
              <br />
              <span className="text-slate-500">actually want to ship</span>
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Nine deeply integrated modules, one cohesive system. No more switching between ten different apps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section id="how" className="relative py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Up and running
              <br />
              <span className="text-slate-500">in 3 steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-8 border-t border-dashed border-white/10 z-10" />
                )}
                <div className="bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-6 hover:border-violet-500/20 transition-all">
                  <div className="text-4xl font-black text-violet-500/30 mb-4 font-mono">{step.num}</div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TECH STACK
      ════════════════════════════════════════ */}
      <section id="stack" className="relative py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-3">Built with production-grade tech</h2>
          <p className="text-slate-500 mb-10 text-sm">No shortcuts. Real architecture from day one.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {STACK.map(s => (
              <span
                key={s}
                className="text-xs font-mono font-semibold text-slate-400 bg-white/[0.04] border border-white/[0.07] px-4 py-2 rounded-full hover:border-violet-500/30 hover:text-violet-300 transition-colors"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section className="relative py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center font-black text-white text-2xl mx-auto mb-8 shadow-2xl shadow-violet-900/50">
            
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
            Ready to run
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              life like a system?
            </span>
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            Join PulseOS today. Free forever, no credit card needed.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold text-lg shadow-xl shadow-violet-900/40 transition-all hover:-translate-y-0.5"
          >
            Get started free
            <ArrowRight size={20} />
          </Link>
          <p className="text-xs text-slate-700 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-500 hover:text-white transition-colors underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.05] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-white text-xs">
              
            </div>
            <span className="font-bold text-white text-sm">PulseOS</span>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} PulseOS · The last productivity app you'll ever need.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link to="/register" className="hover:text-slate-400 transition-colors"> </Link>
                    An independent AI productivity platform built by Coolieo Bowley
          </div>
        </div>
      </footer>

    </div>
  )
}