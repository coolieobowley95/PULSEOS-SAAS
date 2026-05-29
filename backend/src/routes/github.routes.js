// backend/src/routes/github.routes.js
import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import {
  connectGitHub,
  disconnectGitHub,
  getStatus,
  getActivity,
  getAISummary,
} from '../controllers/github.controller.js'

const router = express.Router()

router.get('/status',     protect, getStatus)
router.post('/connect',   protect, connectGitHub)
router.delete('/disconnect', protect, disconnectGitHub)
router.get('/activity',   protect, getActivity)
router.get('/summary',    protect, getAISummary)

export default router