// backend/src/routes/profile.routes.js
import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import {
  getProfile,
  updateProfile,
  updateEmail,
  updatePassword,
} from '../controllers/profile.controller.js'

const router = express.Router()

router.get('/',           protect, getProfile)
router.patch('/',         protect, updateProfile)
router.patch('/email',    protect, updateEmail)
router.patch('/password', protect, updatePassword)

export default router