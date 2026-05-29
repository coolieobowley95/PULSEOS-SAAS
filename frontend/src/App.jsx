import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Streaks from './pages/Streaks'
import Layout from './components/Layout'
import Profile from './pages/Profile'
import Integrations from './pages/Integrations'
// Auth Pages
import Login from './pages/Login'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Calendar from './pages/Calendar'

// Core Pages
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Goals from './pages/Goals'
import Journal from './pages/Journal'
import AIChat from './pages/AIChat'
import Analytics from './pages/Analytics'
import Agent from './pages/Agent'
import WeeklyReport from './pages/WeeklyReport'
import StartupGenerator from './pages/StartupGenerator'

// Social Pages
import Feed from './pages/Feed'
import UserProfile from './pages/UserProfile'

const Private = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-3xl glass-strong px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-blue/90 to-neon-purple/90 flex items-center justify-center font-bold">
            P
          </div>

          <div>
            <div className="text-sm font-semibold text-fg">
              Booting PulseOS
            </div>
            <div className="text-xs text-fg-muted">
              Syncing your system…
            </div>
          </div>

          <div className="ml-3 w-5 h-5 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/landing" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/landing" element={<Landing />} />

      {/* Protected app (Layout + nested routes) */}
      <Route
        path="/"
        element={
          <Private>
            <Layout />
          </Private>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="goals" element={<Goals />} />
        <Route path="journal" element={<Journal />} />
        <Route path="chat" element={<AIChat />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="streaks" element={<Streaks />} />
        <Route path="feed" element={<Feed />} />
        <Route path="feed/users/:userId" element={<UserProfile />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="agent" element={<Agent />} />
        <Route path="report" element={<WeeklyReport />} />
        <Route path="startup" element={<StartupGenerator />} />
        <Route path="profile" element={<Profile />} />
        <Route path="integrations" element={<Integrations />} />
      </Route>

      {/* Fallback to landing */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  )
}