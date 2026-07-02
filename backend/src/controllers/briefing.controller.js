import { getGroqClient } from '../lib/groq.js'
import { prisma } from '../lib/prisma.js'

const startOfToday = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

const endOfToday = () => {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  return now
}

const stripCodeFences = (text) => {
  if (!text) return ''
  return String(text).replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
}

const safeJsonParse = (text) => {
  const cleaned = stripCodeFences(String(text || ''))
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('AI response did not contain valid JSON')
  }
  const payload = cleaned.slice(start, end + 1)
  return JSON.parse(payload)
}

const topTaskNotesFromTasks = (tasks) => {
  const openTasks = tasks.filter((task) => !task.done).slice(0, 3)
  if (!openTasks.length) {
    return tasks.slice(0, 3).map((task) => task.title).join(' | ') || 'No top tasks for today.'
  }
  return openTasks.map((task) => task.title).join(' | ')
}

/* ─────────────────────────────────────────────────────────────
   UPDATED: added calendarEvents
───────────────────────────────────────────────────────────── */
const buildBriefingPrompt = ({ user, tasks, goals, journals, calendarEvents }) => {
  const taskList = tasks.length
    ? tasks
        .slice(0, 8)
        .map(
          (task) =>
            `- ${task.done ? '[done]' : '[open]'} ${task.title}${
              task.dueDate ? ` (due ${new Date(task.dueDate).toLocaleDateString()})` : ''
            }`,
        )
        .join('\n')
    : '- No tasks available yet.'

  const goalList = goals.length
    ? goals
        .slice(0, 6)
        .map((goal) => `- ${goal.title}: ${goal.progress}/${goal.target}`)
        .join('\n')
    : '- No goals found yet.'

  const journalSummary = journals.length
    ? journals
        .slice(0, 5)
        .map(
          (entry) =>
            `- ${entry.mood ?? 'unknown mood'}${
              entry.summary ? ` — ${entry.summary}` : ''
            }`,
        )
        .join('\n')
    : '- No recent journal entries.'

  /* ─── NEW: Calendar section ─── */
  const calendarSection = calendarEvents?.length
    ? calendarEvents
        .slice(0, 5)
        .map(
          (e) =>
            `- ${e.title} at ${new Date(e.start).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`,
        )
        .join('\n')
    : '- No calendar events synced.'

  return `You are PulseOS, a personal morning briefing engine. Generate one concise and inspiring morning briefing for this user using the data provided.

User:
- Name: ${user.name}

Tasks:
${taskList}

Goals:
${goalList}

Recent journal moods and reflections:
${journalSummary}

Today's calendar events:
${calendarSection}

Use these rules:
- Return ONLY valid JSON.
- The JSON must contain exactly these keys: plan, motivation, topTasks, focusTip.
- topTasks must be one string with the top 3 tasks separated by "|".
- Do not include markdown, code fences, extra commentary, or any explanation outside the JSON object.
- Keep the tone motivating, practical, and upbeat for a morning briefing.

Example output shape:
{
  "plan": "...",
  "motivation": "...",
  "topTasks": "Task 1 | Task 2 | Task 3",
  "focusTip": "..."
}`
}

export const generateBriefingForUser = async (userId, forceRefresh = false) => {
  if (!process.env.QWEN_API_KEY) {
    throw new Error('Missing QWEN_API_KEY environment variable')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const todayStart = startOfToday()
  const todayEnd = endOfToday()

  const existingBriefing = await prisma.dailyBriefing.findFirst({
    where: {
      userId,
      date: { gte: todayStart, lt: todayEnd },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existingBriefing && !forceRefresh) {
    return existingBriefing
  }

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ done: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const journals = await prisma.journal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  /* ─── NEW: fetch calendar events ─── */
  let calendarEvents = []
  try {
    const tokenRow = await prisma.calendarToken.findUnique({
      where: { userId },
    })

    if (tokenRow) {
      const { google } = await import('googleapis')

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
      )

      oauth2Client.setCredentials({
        access_token: tokenRow.accessToken,
        refresh_token: tokenRow.refreshToken,
        expiry_date: tokenRow.expiryDate.getTime(),
      })

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      const now = new Date()
      const todayEnd = endOfToday()

      const eventsRes = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: todayEnd.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      })

      calendarEvents = (eventsRes.data.items || []).map((e) => ({
        title: e.summary || '(No title)',
        start: e.start?.dateTime || e.start?.date,
      }))
    }
  } catch (err) {
    console.warn('Briefing: calendar fetch skipped:', err.message)
  }

  const prompt = buildBriefingPrompt({
    user,
    tasks,
    goals,
    journals,
    calendarEvents, // ✅ ADDED
  })

  const groq = getGroqClient()

  const aiResponse = await groq.chat.completions.create({
    model: 'qwen-plus',
    messages: [
      {
        role: 'system',
        content:
          'You are a task and reflection-aware assistant that returns only valid JSON for a daily briefing.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 400,
  })

  const rawText =
    aiResponse?.choices?.[0]?.message?.content ||
    aiResponse?.choices?.[0]?.text ||
    JSON.stringify(aiResponse)

  let parsed
  try {
    parsed = safeJsonParse(String(rawText))
  } catch (err) {
    console.error('Failed to parse briefing JSON:', String(rawText))
    throw new Error('AI did not return valid briefing JSON')
  }

  const plan = String(parsed.plan ?? '').trim()
  const motivation = String(parsed.motivation ?? '').trim()
  const topTasks = String(parsed.topTasks ?? topTaskNotesFromTasks(tasks)).trim()
  const focusTip = String(parsed.focusTip ?? '').trim()

  const briefingPayload = {
    userId,
    plan,
    motivation,
    topTasks,
    focusTip,
    date: new Date(),
  }

  if (existingBriefing) {
    return prisma.dailyBriefing.update({
      where: { id: existingBriefing.id },
      data: briefingPayload,
    })
  }

  return prisma.dailyBriefing.create({ data: briefingPayload })
}

export const getTodayBriefing = async (req, res) => {
  try {
    const briefing = await generateBriefingForUser(req.userId)
    res.json(briefing)
  } catch (err) {
    console.error('getTodayBriefing failed:', err)
    res.status(500).json({ message: err.message || 'Unable to load today briefing' })
  }
}

export const refreshBriefing = async (req, res) => {
  try {
    const briefing = await generateBriefingForUser(req.userId, true)
    res.json(briefing)
  } catch (err) {
    console.error('refreshBriefing failed:', err)
    res.status(500).json({ message: err.message || 'Unable to refresh briefing' })
  }
}