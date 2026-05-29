import { Router } from 'express'
import {
  getMoodAnalytics,
  getMoodInsight,
  getProductivityScore
} from '../controllers/analytics.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)

router.get('/mood', getMoodAnalytics)
router.get('/mood/insight', getMoodInsight)
router.get('/productivity', getProductivityScore)

export default router