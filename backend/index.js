import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Routes
import authRoutes      from './src/routes/auth.routes.js'
import taskRoutes      from './src/routes/tasks.routes.js'
import goalRoutes      from './src/routes/goals.routes.js'
import journalRoutes   from './src/routes/journal.routes.js'
import chatRoutes      from './src/routes/chat.routes.js'
import briefingRoutes  from './src/routes/briefing.routes.js'
import memoryRoutes    from './src/routes/memory.routes.js'
import analyticsRoutes from './src/routes/analytics.routes.js'
import agentRoutes     from './src/routes/agent.routes.js'
import reportRoutes    from './src/routes/report.routes.js'
import feedRoutes      from './src/routes/feed.routes.js'
import startupRoutes   from './src/routes/startup.routes.js'
import calendarRoutes  from './src/routes/calendar.routes.js'
import streakRoutes    from './src/routes/streak.routes.js'
import pushRoutes      from './src/routes/push.routes.js'
import profileRoutes   from './src/routes/profile.routes.js'
import githubRoutes    from './src/routes/github.routes.js'
import billingRoutes   from './src/routes/billing.routes.js'

// Other
import { startBriefingCron } from './src/cron/briefing.cron.js'
import { errorMiddleware }    from './src/utils/errorHandler.js'
import { authLimiter, aiLimiter } from './src/middleware/rateLimit.middleware.js'

const app        = express()
const httpServer = createServer(app)
const PORT       = process.env.PORT || 5000

const io = new Server(httpServer, {
  cors: {
    origin:  process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// ── Stripe webhook needs raw body BEFORE express.json() ──────────────────────
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }))

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))

// Attach io to every request so controllers can emit events
app.use((req, res, next) => { req.io = io; next() })

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ message: 'PulseOS API is running 🚀' }))
app.use('/api/auth',      authLimiter, authRoutes)
app.use('/api/tasks',     taskRoutes)
app.use('/api/goals',     goalRoutes)
app.use('/api/journal',   journalRoutes)
app.use('/api/chat',      aiLimiter,   chatRoutes)
app.use('/api/briefing',  aiLimiter,   briefingRoutes)
app.use('/api/memory',    memoryRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/agent',     aiLimiter,   agentRoutes)
app.use('/api/report',    aiLimiter,   reportRoutes)
app.use('/api/feed',      feedRoutes)
app.use('/api/startup',   aiLimiter,   startupRoutes)
app.use('/api/calendar',  calendarRoutes)
app.use('/api/streaks',   streakRoutes)
app.use('/api/push',      pushRoutes)
app.use('/api/profile',   profileRoutes)
app.use('/api/github',    githubRoutes)
app.use('/api/billing',   billingRoutes)
app.use(errorMiddleware)

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join_feed', () => socket.join('feed'))
  socket.on('disconnect', () => {})
})

// ── Error handling ────────────────────────────────────────────────────────────
httpServer.on('error', (error) => {
  if (error.syscall !== 'listen') throw error
  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`
  if (error.code === 'EACCES')    { console.error(`${bind} requires elevated privileges.`); process.exit(1) }
  if (error.code === 'EADDRINUSE') { console.error(`${bind} is already in use.`); process.exit(1) }
  throw error
})

process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection:', reason))
process.on('uncaughtException',  (error) => { console.error('Uncaught Exception:', error); process.exit(1) })

// ── Boot ──────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`PulseOS server running on port ${PORT}`)
  console.log('GROQ Key:', process.env.GROQ_API_KEY ? 'YES ✓' : 'NO ✗')
  console.log('Stripe:', process.env.STRIPE_SECRET_KEY ? 'YES ✓' : 'NO ✗')
  console.log('Socket.io: ENABLED ✓')
  try {
    console.log('Starting cron jobs...')
    startBriefingCron()
    console.log('✅ Cron jobs started successfully')
  } catch (err) {
    console.error('Failed to start cron jobs:', err)
  }
})
