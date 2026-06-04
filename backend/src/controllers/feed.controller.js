import { prisma } from '../lib/prisma.js'
import { getGroq } from '../lib/groq.js'

const postInclude = {
  user: { select: { id: true, name: true, email: true } },
  likes: { select: { userId: true } },
  comments: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' }
  }
}

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const following = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true }
    })
    const followingIds = following.map(f => f.followingId)

    const posts = await prisma.post.findMany({
      where: {
        isPublic: true,
        OR: [
          { userId: { in: followingIds } },
          { userId: req.userId }
        ]
      },
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const total = await prisma.post.count({
      where: { isPublic: true }
    })

    res.json({
      posts: posts.map(p => formatPost(p, req.userId)),
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total
    })
  } catch (err) {
    console.error('Feed error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getExploreFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      where: { isPublic: true },
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const total = await prisma.post.count({ where: { isPublic: true } })

    res.json({
      posts: posts.map(p => formatPost(p, req.userId)),
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createPost = async (req, res) => {
  try {
    const { content, type, isPublic } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' })

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        type: type || 'win',
        isPublic: isPublic !== false,
        userId: req.userId
      },
      include: postInclude
    })

    // Generate AI summary in background
    generateAISummary(post.id, content).catch(console.error)

    const formatted = formatPost(post, req.userId)
    req.io?.emit('new_post', formatted)

    res.status(201).json(formatted)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deletePost = async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!post) return res.status(404).json({ message: 'Post not found' })
    await prisma.post.delete({ where: { id: req.params.id } })
    req.io?.emit('delete_post', { postId: req.params.id })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const toggleLike = async (req, res) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.userId, postId: req.params.id } }
    })

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
    } else {
      await prisma.like.create({ data: { userId: req.userId, postId: req.params.id } })
    }

    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: postInclude
    })

    const formatted = formatPost(post, req.userId)
    req.io?.emit('update_post', formatted)

    res.json({ liked: !existing, likeCount: post.likes.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const addComment = async (req, res) => {
  try {
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' })

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: req.userId,
        postId: req.params.id
      },
      include: { user: { select: { id: true, name: true } } }
    })

    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: postInclude
    })

    const formatted = formatPost(post, req.userId)
    req.io?.emit('update_post', formatted)

    res.status(201).json(comment)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteComment = async (req, res) => {
  try {
    const comment = await prisma.comment.findFirst({
      where: { id: req.params.commentId, userId: req.userId }
    })
    if (!comment) return res.status(404).json({ message: 'Comment not found' })
    await prisma.comment.delete({ where: { id: req.params.commentId } })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const followUser = async (req, res) => {
  try {
    const targetId = req.params.userId
    if (targetId === req.userId) return res.status(400).json({ message: 'Cannot follow yourself' })

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.userId, followingId: targetId } }
    })

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } })
      res.json({ following: false })
    } else {
      await prisma.follow.create({ data: { followerId: req.userId, followingId: targetId } })
      res.json({ following: true })
    }
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const targetId = req.params.userId
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, createdAt: true }
    })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const [posts, followerCount, followingCount, isFollowing] = await Promise.all([
      prisma.post.findMany({
        where: { userId: targetId, isPublic: true },
        include: postInclude,
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.follow.count({ where: { followingId: targetId } }),
      prisma.follow.count({ where: { followerId: targetId } }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: req.userId, followingId: targetId } }
      })
    ])

    res.json({
      user,
      posts: posts.map(p => formatPost(p, req.userId)),
      followerCount,
      followingCount,
      isFollowing: !!isFollowing,
      isOwnProfile: targetId === req.userId
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getMyPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.userId },
      include: postInclude,
      orderBy: { createdAt: 'desc' }
    })
    res.json(posts.map(p => formatPost(p, req.userId)))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

async function generateAISummary(postId, content) {
  try {
    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Generate a short, encouraging 1-sentence AI insight or reaction to this productivity update. Be warm and specific. Return only the sentence:\n\n"${content}"`
      }],
      max_tokens: 80,
      temperature: 0.8
    })
    const summary = completion.choices[0].message.content.trim()
    await prisma.post.update({ where: { id: postId }, data: { aiSummary: summary } })
  } catch (err) {
    console.error('AI summary error:', err.message)
  }
}

function formatPost(post, currentUserId) {
  return {
    ...post,
    likeCount: post.likes.length,
    commentCount: post.comments.length,
    isLiked: post.likes.some(l => l.userId === currentUserId),
    isOwnPost: post.userId === currentUserId
  }
}