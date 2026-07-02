import { Router } from 'express'
import {
  getChats, createChat, getMessages, sendMessage, deleteChat
} from '../controllers/chat.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)

router.get('/', getChats)
router.post('/', createChat)
router.get('/:id/messages', getMessages)
router.post('/:id/messages', sendMessage)  // AI call — open to all users for now (was Pro-only)
router.delete('/:id', deleteChat)

export default router