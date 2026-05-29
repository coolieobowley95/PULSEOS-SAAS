import { useState, useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

import { Sidebar, MobileSidebar } from './shell/Sidebar'
import { TopNav } from './shell/TopNav'
import { CommandPalette } from './shell/CommandPalette'
import { AssistantDock } from './shell/AssistantDock'

export default function Layout() {
  const { user, logout } = useAuth()

  const { language, changeLanguage, LANGUAGES } = useLanguage()

  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('pulseos.sidebar') === 'collapsed'
  )

  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteMode, setPaletteMode] = useState('search')

  useEffect(() => {
    localStorage.setItem(
      'pulseos.sidebar',
      collapsed ? 'collapsed' : 'expanded'
    )
  }, [collapsed])

  useEffect(() => {
    const onKeyDown = (e) => {
      const isK = e.key?.toLowerCase() === 'k'
      const meta = e.metaKey || e.ctrlKey

      if (meta && isK) {
        e.preventDefault()
        setPaletteMode('search')
        setPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  const contentPad = useMemo(
    () =>
      location.pathname === '/chat'
        ? 'p-0'
        : 'px-3 pb-10 pt-4 md:pt-6',
    [location.pathname]
  )

  return (
    <div className="min-h-screen">
      <div className="flex">

        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(v => !v)}
          onNavigate={() => {}}
        />

        <MobileSidebar
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex-1 min-w-0">

          <TopNav
            user={user}
            onOpenMobileSidebar={() => setMobileOpen(true)}
            onOpenCommandPalette={(mode) => {
              setPaletteMode(mode === 'create' ? 'create' : 'search')
              setPaletteOpen(true)
            }}
            onLogout={onLogout}
          />

          {/* Language Selector */}
          <div className="px-4 pt-4">
            <div className="mb-3">
              <select
                value={language}
                onChange={e => changeLanguage(e.target.value)}
                className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#9CA3AF',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {LANGUAGES.map(l => (
                  <option
                    key={l.code}
                    value={l.code}
                    style={{ background: '#0D1117' }}
                  >
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <main className={contentPad}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        mode={paletteMode}
        onClose={() => setPaletteOpen(false)}
      />

      <AssistantDock />
    </div>
  )
}
