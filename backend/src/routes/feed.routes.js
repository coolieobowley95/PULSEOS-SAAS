import { Router } from 'express'
import {
  getFeed, getExploreFeed, createPost, deletePost,
  toggleLike, addComment, deleteComment,
  followUser, getUserProfile, getMyPosts
} from '../controllers/feed.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()
router.use(protect)

router.get('/', getFeed)
router.get('/explore', getExploreFeed)
router.get('/my-posts', getMyPosts)
router.post('/', createPost)
router.delete('/:id', deletePost)
router.post('/:id/like', toggleLike)
router.post('/:id/comments', addComment)
router.delete('/:id/comments/:commentId', deleteComment)
router.post('/users/:userId/follow', followUser)
router.get('/users/:userId', getUserProfile)

export default router