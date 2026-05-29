// backend/src/controllers/profile.controller.js
// Handles user profile reads, stats aggregation, and settings updates.
// Passwords use bcrypt matching the existing auth.controller.js pattern.

import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

// ─── GET /api/profile ─────────────────────────────────────────────────────────
// Returns user info + aggregated stats + streaks + memories
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId

    const [user, taskStats, goalCount, journalCount, memories, streaks] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, bio: true, avatar: true, createdAt: true, plan: true },
      }),
      prisma.task.aggregate({
        where: { userId },
        _count: { _all: true },
      }),
      prisma.goal.count({ where: { userId } }),
      prisma.journal.count({ where: { userId } }),
      prisma.memory.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.streak.findMany({ where: { userId } }),
    ])

    const tasksDone  = await prisma.task.count({ where: { userId, done: true } })
    const tasksTotal = taskStats._count._all

    // Shape streaks into keyed object
    const streakMap = {}
    for (const s of streaks) {
      streakMap[s.type] = { current: s.current, longest: s.longest }
    }

    res.json({
      user,
      stats: {
        tasksTotal,
        tasksDone,
        goalCount,
        journalCount,
        memoriesCount: memories.length,
      },
      streaks: streakMap,
      memories,
    })
  } catch (err) {
    console.error('getProfile error:', err.message)
    res.status(500).json({ error: 'Failed to load profile' })
  }
}

// ─── PATCH /api/profile ───────────────────────────────────────────────────────
// Updates name and/or bio
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body

    const data = {}
    if (name?.trim())   data.name   = name.trim()
    if (bio !== undefined) data.bio = bio.trim()
    if (avatar?.trim()) data.avatar = avatar.trim()

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, name: true, email: true, bio: true, avatar: true },
    })

    res.json({ success: true, user })
  } catch (err) {
    console.error('updateProfile error:', err.message)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

// ─── PATCH /api/profile/email ─────────────────────────────────────────────────
// Changes email — requires password confirmation
export const updateEmail = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Incorrect password' })

    const taken = await prisma.user.findUnique({ where: { email: email.trim() } })
    if (taken && taken.id !== req.userId) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { email: email.trim() },
      select: { id: true, name: true, email: true },
    })

    res.json({ success: true, user: updated })
  } catch (err) {
    console.error('updateEmail error:', err.message)
    res.status(500).json({ error: 'Failed to update email' })
  }
}

// ─── PATCH /api/profile/password ──────────────────────────────────────────────
// Changes password — requires current password confirmation
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashed },
    })

    res.json({ success: true })
  } catch (err) {
    console.error('updatePassword error:', err.message)
    res.status(500).json({ error: 'Failed to update password' })
  }
}