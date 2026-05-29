import { Router } from 'express'
import { runAgent } from '../controllers/agent.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)

router.post('/run', runAgent)

export default router