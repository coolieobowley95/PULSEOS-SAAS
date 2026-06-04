import { Router } from 'express'
import { getLatestReport, generateReport, getAllReports } from '../controllers/report.controller.js'
import { protect, requirePro } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)

router.get('/latest', getLatestReport)
router.get('/all', getAllReports)
router.post('/generate', requirePro, generateReport)  // AI call — Pro only

export default router
