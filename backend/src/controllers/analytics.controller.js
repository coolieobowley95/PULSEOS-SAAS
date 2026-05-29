import { prisma } from '../lib/prisma.js'
import Groq from 'groq-sdk'
import { getGroq } from '../lib/groq.js'

const groq = getGroq()

export const getMoodAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30

    const since = new Date()
    since.setDate(since.getDate() - days)

    const journals = await prisma.journal.findMany({
      where: {
        userId: req.userId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'asc' },
      select: { mood: true, content: true, createdAt: true }
    })

    const moodMap = {
      '😊': { label: 'Happy',    score: 5 },
      '🤩': { label: 'Excited',  score: 5 },
      '😐': { label: 'Neutral',  score: 3 },
      '😴': { label: 'Tired',    score: 2 },
      '😔': { label: 'Sad',      score: 1 },
      '😤': { label: 'Stressed', score: 1 }
    }

    const moodData = journals
      .filter(j => j.mood && moodMap[j.mood])
      .map(j => ({
        date: j.createdAt.toISOString().split('T')[0],
        mood: j.mood,
        label: moodMap[j.mood].label,
        score: moodMap[j.mood].score
      }))

    const scores = moodData.map(m => m.score)
    const avgScore = scores.length
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null

    const moodCounts = {}
    moodData.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1
    })

    const dominantMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const recentScores = moodData.slice(-7).map(m => m.score)
    const recentAvg = recentScores.length
      ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      : null

    const burnoutRisk = recentAvg !== null && recentAvg < 2.5
      ? 'high'
      : recentAvg !== null && recentAvg < 3.5
        ? 'medium'
        : 'low'

    const streak = calculateJournalStreak(journals)

    res.json({
      moodData,
      moodCounts,
      avgScore: parseFloat(avgScore),
      dominantMood,
      burnoutRisk,
      journalStreak: streak,
      totalEntries: journals.length,
      days
    })
  } catch (err) {
    console.error('Analytics error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getMoodInsight = async (req, res) => {
  try {
    const journals = await prisma.journal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 14,
      select: { mood: true, content: true, createdAt: true }
    })

    if (journals.length < 2) {
      return res.json({
        insight: 'Write a few more journal entries and I will start detecting your mood patterns and give you personalized insights.'
      })
    }

    const summary = journals.map(j =>
      `${new Date(j.createdAt).toLocaleDateString()}: mood=${j.mood || 'none'}, entry="${j.content.slice(0, 80)}"`
    ).join('\n')

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Analyze this user's mood journal from the last 14 days and give a short, personal, actionable insight in 2-3 sentences. Be warm and specific, not generic.

Journal data:
${summary}

Return only the insight text, no labels or formatting.`
      }],
      max_tokens: 200,
      temperature: 0.7
    })

    res.json({ insight: completion.choices[0].message.content.trim() })
  } catch (err) {
    console.error('Mood insight error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getProductivityScore = async (req, res) => {
  try {
    const since = new Date()
    since.setDate(since.getDate() - 7)

    const [tasks, goals, journals] = await Promise.all([
      prisma.task.findMany({ where: { userId: req.userId } }),
      prisma.goal.findMany({ where: { userId: req.userId } }),
      prisma.journal.findMany({
        where: { userId: req.userId, createdAt: { gte: since } }
      })
    ])

    const totalTasks = tasks.length
    const doneTasks = tasks.filter(t => t.done).length
    const taskScore = totalTasks > 0 ? (doneTasks / totalTasks) * 40 : 0

    const avgGoalProgress = goals.length
      ? goals.reduce((a, g) => a + g.progress, 0) / goals.length
      : 0
    const goalScore = (avgGoalProgress / 100) * 35

    const journalScore = Math.min(journals.length * 5, 25)

    const total = Math.round(taskScore + goalScore + journalScore)

    const breakdown = {
      tasks: { score: Math.round(taskScore), max: 40, done: doneTasks, total: totalTasks },
      goals: { score: Math.round(goalScore), max: 35, avgProgress: Math.round(avgGoalProgress) },
      journal: { score: Math.round(journalScore), max: 25, entries: journals.length }
    }

    res.json({ score: total, breakdown, level: getLevel(total) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

function calculateJournalStreak(journals) {
  if (!journals.length) return 0
  const dates = [...new Set(
    journals.map(j => j.createdAt.toISOString().split('T')[0])
  )].sort().reverse()

  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const dateStr of dates) {
    const date = new Date(dateStr)
    const diff = Math.floor((current - date) / (1000 * 60 * 60 * 24))
    if (diff <= 1) {
      streak++
      current = date
    } else break
  }
  return streak
}

function getLevel(score) {
  if (score >= 85) return { label: 'Peak Performance', color: '#10B981' }
  if (score >= 70) return { label: 'On Track',         color: '#3B82F6' }
  if (score >= 50) return { label: 'Building Momentum',color: '#F59E0B' }
  if (score >= 30) return { label: 'Getting Started',  color: '#8B5CF6' }
  return              { label: 'Just Beginning',        color: '#6B7280' }
}