import cron from 'node-cron'

import { prisma } from '../lib/prisma.js'

import { generateBriefingForUser } from '../controllers/briefing.controller.js'
import { generateReportForUser } from '../controllers/report.controller.js'
import { sendPushToUser } from '../controllers/push.controller.js'

// ─────────────────────────────────────────────────────────────
// Start Cron Jobs
// ─────────────────────────────────────────────────────────────

export const startBriefingCron = () => {

  // ───────────────────────────────────────────────────────────
  // Daily briefing — 7:00 AM
  // ───────────────────────────────────────────────────────────

  cron.schedule('0 7 * * *', async () => {
    console.log('🌅 Running daily briefing generation...')

    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
        },
      })

      for (const user of users) {
        try {
          await generateBriefingForUser(user.id)

          console.log(`✓ Briefing generated for ${user.name}`)
        } catch (err) {
          console.error(
            `✗ Briefing failed for ${user.name}:`,
            err.message
          )
        }
      }

      console.log('✅ Daily briefings complete')
    } catch (err) {
      console.error(
        'Daily briefing cron error:',
        err.message
      )
    }
  })

  // ───────────────────────────────────────────────────────────
  // Weekly report — Sunday 9:00 PM
  // ───────────────────────────────────────────────────────────

  cron.schedule('0 21 * * 0', async () => {
    console.log('📊 Running weekly report generation...')

    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
        },
      })

      for (const user of users) {
        try {
          await generateReportForUser(user.id)

          console.log(
            `✓ Weekly report generated for ${user.name}`
          )
        } catch (err) {
          console.error(
            `✗ Report failed for ${user.name}:`,
            err.message
          )
        }
      }

      console.log('✅ Weekly reports complete')
    } catch (err) {
      console.error(
        'Weekly report cron error:',
        err.message
      )
    }
  })

  // ───────────────────────────────────────────────────────────
  // Evening task reminder — 8:00 PM
  // ───────────────────────────────────────────────────────────

  cron.schedule('0 20 * * *', async () => {
    console.log('🔔 Running evening task reminder push...')

    try {
      const users = await prisma.user.findMany({
        include: {
          pushSubscriptions: true,
        },
      })

      for (const user of users) {

        // Skip users without push subscriptions
        if (!user.pushSubscriptions.length) {
          continue
        }

        const incomplete = await prisma.task.count({
          where: {
            userId: user.id,
            done: false,
          },
        })

        if (incomplete > 0) {
          await sendPushToUser(user.id, {
            title: '📋 Tasks pending',
            body: `You have ${incomplete} task${
              incomplete > 1 ? 's' : ''
            } left today. Keep the streak alive!`,
            icon: '/favicon.svg',
          })

          console.log(
            `✓ Task reminder sent to ${user.name}`
          )
        }
      }
    } catch (err) {
      console.error(
        'Task reminder cron error:',
        err.message
      )
    }
  })

  // ───────────────────────────────────────────────────────────
  // Journal reminder — 9:00 PM
  // ───────────────────────────────────────────────────────────

  cron.schedule('0 21 * * *', async () => {
    console.log('📓 Running journal reminder push...')

    try {
      const today = new Date()

      today.setHours(0, 0, 0, 0)

      const users = await prisma.user.findMany({
        include: {
          pushSubscriptions: true,
        },
      })

      for (const user of users) {

        // Skip users without push subscriptions
        if (!user.pushSubscriptions.length) {
          continue
        }

        const journalToday = await prisma.journal.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: today,
            },
          },
        })

        if (journalToday === 0) {
          await sendPushToUser(user.id, {
            title: '📓 Journal reminder',
            body: "You haven't journaled today. 2 minutes is all it takes.",
            icon: '/favicon.svg',
          })

          console.log(
            `✓ Journal reminder sent to ${user.name}`
          )
        }
      }
    } catch (err) {
      console.error(
        'Journal reminder cron error:',
        err.message
      )
    }
  })

  // ───────────────────────────────────────────────────────────
  // Startup logs
  // ───────────────────────────────────────────────────────────

  console.log('⏰ Daily briefing cron scheduled for 7:00 AM')

  console.log(
    '📊 Weekly report cron scheduled for Sunday 9:00 PM'
  )

  console.log(
    '🔔 Evening task reminder cron scheduled for 8:00 PM'
  )

  console.log(
    '📓 Journal reminder cron scheduled for 9:00 PM'
  )
}
