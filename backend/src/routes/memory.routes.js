import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { deleteMemory, getMemories } from '../controllers/memory.controller.js'

const router = Router()
router.use(protect)

router.get('/', getMemories)
router.delete('/:id', deleteMemory)

export default router

