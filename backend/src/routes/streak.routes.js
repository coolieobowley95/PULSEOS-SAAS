// backend/src/routes/streak.routes.js
import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { getStreaks } from '../controllers/streak.controller.js'

const router = express.Router()

router.get('/', protect, getStreaks)

export default router