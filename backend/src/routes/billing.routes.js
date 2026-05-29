import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
  handleWebhook
} from '../controllers/billing.controller.js'

const router = Router()

// Webhook must use raw body — no auth middleware
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)

// Protected routes
router.get('/status', protect, getBillingStatus)
router.post('/checkout', protect, createCheckoutSession)
router.post('/portal', protect, createPortalSession)

export default router