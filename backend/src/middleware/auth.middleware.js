import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export const protect = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized' })

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' })
  }
}

export const requirePro = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true }
    })
    if (!user || user.plan !== 'pro') {
      return res.status(403).json({ message: 'Pro plan required to access this feature' })
    }
    next()
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}
