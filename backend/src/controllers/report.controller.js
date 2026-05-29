import { prisma } from '../lib/prisma.js'
import { getGroq } from '../lib/groq.js'

const groq = getGroq()

async function generateReportForUser(userId) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [user, allTasks, weekTasks, goals, weekJournals, memories] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.task.findMany({ where: { userId } }),
    prisma.task.findMany({
      where: { userId, createdAt: { gte: weekStart, lte: weekEnd } }
    }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.journal.findMany({
      where: { userId, createdAt: { gte: weekStart, lte: weekEnd } },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.memory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })
  ])

  const tasksCompleted = allTasks.filter(t => t.done).length
  const tasksCreated = weekTasks.length
  const journalEntries = weekJournals.length

  const moodMap = { '😊': 5, '🤩': 5, '😐': 3, '😴': 2, '😔': 1, '😤': 1 }
  const moodCounts = {}
  weekJournals.forEach(j => {
    if (j.mood) moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1
  })
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const avgGoalProgress = goals.length
    ? goals.reduce((a, g) => a + g.progress, 0) / goals.length
    : 0
  const taskScore = allTasks.length > 0 ? (tasksCompleted / allTasks.length) * 40 : 0
  const goalScore = (avgGoalProgress / 100) * 35
  const journalScore = Math.min(journalEntries * 5, 25)
  const productivityScore = Math.round(taskScore + goalScore + journalScore)

  const weekData = `
User: ${user.name}
Week: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}

TASKS:
- Created this week: ${tasksCreated}
- Total completed: ${tasksCompleted} of ${allTasks.length}
- Pending: ${allTasks.filter(t => !t.done).map(t => `"${t.title}" [${t.priority}]`).join(', ') || 'none'}

GOALS (${goals.length} total):
${goals.map(g => `- "${g.title}": ${g.progress}%`).join('\n') || 'No goals'}

JOURNAL THIS WEEK:
- Entries: ${journalEntries}
- Dominant mood: ${dominantMood || 'not tracked'}
${weekJournals.map(j => `- ${new Date(j.createdAt).toLocaleDateString()}: mood=${j.mood || 'none'} "${j.content.slice(0, 100)}"`).join('\n')}

PRODUCTIVITY SCORE: ${productivityScore}/100

WHAT I KNOW ABOUT THIS USER:
${memories.map(m => `- ${m.fact}`).join('\n') || 'None yet'}
`

  const prompt = `You are PulseOS generating a personalized weekly life intelligence report for ${user.name}.

${weekData}

Generate a weekly report in this EXACT JSON format (no markdown, no extra text):
{
  "wins": "2-3 specific wins or achievements from this week based on their data",
  "challenges": "1-2 honest challenges or areas that need attention",
  "nextWeekFocus": "3 specific, actionable priorities for next week based on their goals and pending tasks",
  "aiNarrative": "A warm, personal 3-4 sentence narrative about their week — like a coach speaking to them directly. Reference their actual data. Be honest but encouraging."
}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.7
  })

  const raw = completion.choices[0].message.content.trim()
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
  const parsed = JSON.parse(cleaned)

  const report = await prisma.weeklyReport.create({
    data: {
      userId,
      weekStart,
      weekEnd,
      productivityScore,
      tasksCompleted,
      tasksCreated,
      goalsUpdated: goals.length,
      journalEntries,
      dominantMood,
      wins: parsed.wins,
      challenges: parsed.challenges,
      nextWeekFocus: parsed.nextWeekFocus,
      aiNarrative: parsed.aiNarrative
    }
  })

  return report
}

export const getLatestReport = async (req, res) => {
  try {
    const report = await prisma.weeklyReport.findFirst({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    if (!report) return res.json(null)
    res.json(report)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const generateReport = async (req, res) => {
  try {
    console.log('📊 Generating weekly report for user:', req.userId)
    const report = await generateReportForUser(req.userId)
    res.json(report)
  } catch (err) {
    console.error('REPORT ERROR:', err.message)
    res.status(500).json({ message: 'Failed to generate report', error: err.message })
  }
}

export const getAllReports = async (req, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(reports)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export { generateReportForUser }