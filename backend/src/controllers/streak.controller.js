// backend/src/controllers/streak.controller.js
// Handles streak calculation and retrieval.
// A streak increments when a user completes an activity on consecutive days.
// If they miss a day, the current streak resets to 0 (longest is preserved).

import { prisma } from '../lib/prisma.js'

// ─── Helper: update a single streak type for a user ──────────────────────────
// Called internally after task completion, journal save, goal update.
export async function updateStreak(userId, type) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Get or create the streak record
  let streak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type } },
  })

  if (!streak) {
    // First time — create with current = 1
    return prisma.streak.create({
      data: { userId, type, current: 1, longest: 1, lastDate: today },
    })
  }

  const last = streak.lastDate ? new Date(streak.lastDate) : null
  if (last) last.setHours(0, 0, 0, 0)

  // Already updated today — no change
  if (last && last.getTime() === today.getTime()) {
    return streak
  }

  let newCurrent
  if (last && last.getTime() === yesterday.getTime()) {
    // Consecutive day — increment
    newCurrent = streak.current + 1
  } else {
    // Missed a day — reset
    newCurrent = 1
  }

  const newLongest = Math.max(newCurrent, streak.longest)

  return prisma.streak.update({
    where: { userId_type: { userId, type } },
    data: { current: newCurrent, longest: newLongest, lastDate: today },
  })
}

// ─── GET /api/streaks ─────────────────────────────────────────────────────────
// Returns all three streak types for the authenticated user.
// Creates them with 0 if they don't exist yet.
export const getStreaks = async (req, res) => {
  try {
    const types = ['task', 'journal', 'goal']

    // Ensure all three streak rows exist
    await Promise.all(
      types.map(type =>
        prisma.streak.upsert({
          where: { userId_type: { userId: req.userId, type } },
          update: {},
          create: { userId: req.userId, type, current: 0, longest: 0 },
        })
      )
    )

    const streaks = await prisma.streak.findMany({
      where: { userId: req.userId },
    })

    // Return as a clean object keyed by type
    const result = {}
    for (const s of streaks) {
      result[s.type] = { current: s.current, longest: s.longest, lastDate: s.lastDate }
    }

    res.json(result)
  } catch (err) {
    console.error('getStreaks error:', err.message)
    res.status(500).json({ error: 'Failed to fetch streaks' })
  }
}