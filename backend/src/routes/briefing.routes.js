import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { getTodayBriefing, refreshBriefing } from '../controllers/briefing.controller.js'

const router = Router()
router.use(protect)
router.get('/today', getTodayBriefing)
router.post('/refresh', refreshBriefing)

export default router
