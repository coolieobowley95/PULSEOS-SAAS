import { Router } from 'express'
import { runAgent } from '../controllers/agent.controller.js'
import { protect, requirePro } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)

router.post('/run', requirePro, runAgent)

export default router
