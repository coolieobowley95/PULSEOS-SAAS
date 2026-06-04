import express from 'express'
import { generateStartup } from '../controllers/startup.controller.js'
import { protect, requirePro } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/generate', protect, requirePro, generateStartup)  // AI call — Pro only

export default router
