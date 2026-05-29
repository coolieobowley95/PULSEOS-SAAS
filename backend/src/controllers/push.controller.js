// backend/src/controllers/push.controller.js
// Handles Web Push subscriptions and sending push notifications.
// Uses VAPID keys from .env — never exposed to frontend.

import webpush from 'web-push'
import { prisma } from '../lib/prisma.js'

const isPushConfigured = Boolean(
  process.env.VAPID_MAILTO &&
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
)

if (isPushConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
} else {
  console.warn(
    'Web Push is not configured. Set VAPID_MAILTO, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY in .env to enable push notifications.'
  )
}

// ─── POST /api/push/subscribe ─────────────────────────────────────────────────
// Saves the browser's push subscription to DB.
// Called once when user grants notification permission.
export const subscribe = async (req, res) => {
  const { endpoint, keys } = req.body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription object' })
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.userId },
      create: {
        userId:   req.userId,
        endpoint,
        p256dh:   keys.p256dh,
        auth:     keys.auth,
      },
    })
    res.json({ success: true })
  } catch (err) {
    console.error('subscribe error:', err.message)
    res.status(500).json({ error: 'Failed to save subscription' })
  }
}

// ─── DELETE /api/push/unsubscribe ─────────────────────────────────────────────
export const unsubscribe = async (req, res) => {
  const { endpoint } = req.body
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove subscription' })
  }
}

// ─── Utility: send push to all subscriptions for a user ──────────────────────
// Used by cron jobs and other controllers to trigger notifications.
export async function sendPushToUser(userId, payload) {
  if (!isPushConfigured) {
    console.warn('Skipping push send because VAPID keys are not configured.')
    return
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return

  const message = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        )
      } catch (err) {
        // 410 Gone = subscription expired, clean it up
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
        }
      }
    })
  )
}

// ─── POST /api/push/test ──────────────────────────────────────────────────────
// Sends a test notification to the authenticated user.
export const sendTestNotification = async (req, res) => {
  try {
    await sendPushToUser(req.userId, {
      title: '⚡ PulseOS',
      body:  'Push notifications are working!',
      icon:  '/favicon.svg',
    })
    res.json({ success: true })
  } catch (err) {
    console.error('test push error:', err.message)
    res.status(500).json({ error: 'Failed to send test notification' })
  }
}