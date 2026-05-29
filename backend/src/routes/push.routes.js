// backend/src/routes/push.routes.js
import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { subscribe, unsubscribe, sendTestNotification } from '../controllers/push.controller.js'

const router = express.Router()

router.post('/subscribe',     protect, subscribe)
router.delete('/unsubscribe', protect, unsubscribe)
router.post('/test',          protect, sendTestNotification)

export default router