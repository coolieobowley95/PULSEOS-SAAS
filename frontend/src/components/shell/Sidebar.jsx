import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { Plug2 } from 'lucide-react'


import {
  LayoutGrid,
  CheckSquare,
  Target,
  BookOpen,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
} from 'lucide-react'

import { Calendar } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { User } from 'lucide-react'

const nav = [
  { to: '/streaks', label: 'Streaks', icon: Flame },
  { to: '/integrations', label: 'Integrations', icon: Plug2 },
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/chat', label: 'AI Chat', icon: Sparkles },
  { to: '/startup', label: 'AI Generator', icon: Zap },
]

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate }) {
  const width = collapsed ? 76 : 264

  return (
    <motion.aside
      layout
      className={cn(
        'hidden md:flex shrink-0 h-[calc(100vh-24px)] sticky top-3 ml-3',
        'rounded-3xl glass-strong overflow-hidden',
      )}
      style={{ width }}
    >
      <div className="flex flex-col w-full">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-neon-blue/90 to-neon-purple/90 shadow-[0_0_24px_rgba(56,189,248,0.18)] flex items-center justify-center font-bold">
              P
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-fg">PulseOS</div>
                <div className="text-[11px] text-fg-muted -mt-0.5">
                  Life Operating System
                </div>
              </div>
            )}
          </div>

          <div className={cn('mt-3 flex', collapsed ? 'justify-center' : 'justify-end')}>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 px-0"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 p-2.5', collapsed ? 'px-2.5' : 'px-3')}>
          <div className="flex flex-col gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all',
                    'hover:bg-white/5 hover:border-white/10 border border-transparent',
                    isActive &&
                      'bg-white/6 border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]',
                    collapsed && 'justify-center px-0',
                  )
                }
              >
                <Icon size={18} className="text-fg-muted group-hover:text-fg" />
                {!collapsed && <span className="text-fg">{label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

      </div>
    </motion.aside>
  )
}

export function MobileSidebar({ open, onClose }) {
  if (!open) return null

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -24, opacity: 0 }}
        className="absolute left-3 top-3 bottom-3 w-[86vw] max-w-[320px] rounded-3xl glass-strong overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-neon-blue/90 to-neon-purple/90 flex items-center justify-center font-bold">
              P
            </div>
            <div>
              <div className="text-sm font-semibold text-fg">PulseOS</div>
              <div className="text-[11px] text-fg-muted -mt-0.5">Life OS</div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </Button>
        </div>

        <nav className="p-3">
          <div className="flex flex-col gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all',
                    'hover:bg-white/5 hover:border-white/10 border border-transparent',
                    isActive && 'bg-white/6 border-white/10',
                  )
                }
              >
                <Icon size={18} className="text-fg-muted group-hover:text-fg" />
                <span className="text-fg">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </motion.div>
    </div>
  )
}