import { Router } from 'express'
import { register, login, getMe } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate, registerSchema, loginSchema } from '../middleware/validate.middleware.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login',    validate(loginSchema),    login)
router.get('/me',        protect,                  getMe)

export default router
