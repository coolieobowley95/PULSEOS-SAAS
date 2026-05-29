import { Router } from 'express'
import { getLatestReport, generateReport, getAllReports } from '../controllers/report.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)

router.get('/latest', getLatestReport)
router.get('/all', getAllReports)
router.post('/generate', generateReport)

export default router

