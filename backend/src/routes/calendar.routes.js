import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import {
  getAuthUrl,
  handleCallback,
  getStatus,
  getEvents,
  createEvent,
  disconnect,
} from '../controllers/calendar.controller.js'

const router = Router()

router.get('/auth/url', protect, getAuthUrl)
router.get('/auth/callback', handleCallback)
router.get('/status', protect, getStatus)
router.get('/events', protect, getEvents)
router.post('/events', protect, createEvent)
router.delete('/disconnect', protect, disconnect)

export default router
