import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { socket, connectSocket } from '../services/socket'

const POST_TYPES = [
  { value: 'win',      label: '🏆 Win',        color: '#10B981' },
  { value: 'progress', label: '📈 Progress',   color: '#3B82F6' },
  { value: 'goal',     label: '🎯 Goal',        color: '#8B5CF6' },
  { value: 'learning', label: '📚 Learning',   color: '#F59E0B' },
  { value: 'struggle', label: '💪 Struggle',   color: '#EF4444' },
  { value: 'idea',     label: '💡 Idea',        color: '#EC4899' },
]

const typeColor = Object.fromEntries(POST_TYPES.map(t => [t.value, t.color]))
const typeLabel = Object.fromEntries(POST_TYPES.map(t => [t.value, t.label]))

function PostCard({ post, currentUserId, onLike, onComment, onDelete }) {
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    await onComment(post.id, comment)
    setComment('')
    setSubmitting(false)
  }

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="rounded-2xl p-5 transition-all"
      style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
            style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
            {post.user.name[0].toUpperCase()}
          </div>
          <div>
            <Link to={`/feed/users/${post.user.id}`}
              className="text-sm font-medium text-white hover:underline">
              {post.user.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{background:`${typeColor[post.type]}20`,color:typeColor[post.type]}}>
                {typeLabel[post.type]}
              </span>
              <span className="text-xs" style={{color:'#4B5563'}}>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
        {post.isOwnPost && (
          <button onClick={() => onDelete(post.id)}
            className="text-xs px-2 py-1 rounded-lg transition-all opacity-0 hover:opacity-100"
            style={{color:'#EF4444',background:'rgba(239,68,68,0.1)'}}>
            Delete
          </button>
        )}
      </div>

      <p className="text-sm leading-relaxed mb-3" style={{color:'#D1D5DB'}}>{post.content}</p>

      {post.aiSummary && (
        <div className="rounded-xl px-3 py-2 mb-3"
          style={{background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.15)'}}>
          <p className="text-xs" style={{color:'#C4B5FD'}}>✦ {post.aiSummary}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{color: post.isLiked ? '#EF4444' : '#6B7280'}}>
          <span>{post.isLiked ? '❤️' : '🤍'}</span>
          {post.likeCount}
        </button>

        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{color: showComments ? '#3B82F6' : '#6B7280'}}>
          <span>💬</span>
          {post.commentCount}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t" style={{borderColor:'rgba(255,255,255,0.04)'}}>
          {post.comments.map(c => (
            <div key={c.id} className="flex gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
                {c.user.name[0].toUpperCase()}
              </div>
              <div className="rounded-xl px-3 py-2 flex-1"
                style={{background:'rgba(255,255,255,0.03)'}}>
                <p className="text-xs font-medium text-white mb-0.5">{c.user.name}</p>
                <p className="text-xs" style={{color:'#9CA3AF'}}>{c.content}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2 mt-3">
            <input value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-xl px-3 py-2 text-xs text-white outline-none"
              style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}/>
            <button type="submit" disabled={submitting || !comment.trim()}
              className="px-3 py-2 rounded-xl text-xs font-medium text-white disabled:opacity-40"
              style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('win')
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState('feed')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    fetchPosts()
    connectSocket()

    socket.on('new_post', (post) => {
      setPosts(prev => [post, ...prev])
    })
    socket.on('update_post', (updatedPost) => {
      setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p))
    })
    socket.on('delete_post', ({ postId }) => {
      setPosts(prev => prev.filter(p => p.id !== postId))
    })

    return () => {
      socket.off('new_post')
      socket.off('update_post')
      socket.off('delete_post')
    }
  }, [tab])

  const fetchPosts = async (pg = 1) => {
    setLoading(true)
    try {
      const endpoint = tab === 'explore' ? '/feed/explore' : '/feed'
      const res = await api.get(`${endpoint}?page=${pg}&limit=20`)
      if (pg === 1) setPosts(res.data.posts)
      else setPosts(prev => [...prev, ...res.data.posts])
      setHasMore(res.data.hasMore)
      setPage(pg)
    } catch (err) {
      console.error('Feed error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await api.post('/feed', { content, type: postType })
      setContent('')
      setPostType('win')
    } finally {
      setSubmitting(false) }
  }

  const handleLike = async (postId) => {
    await api.post(`/feed/${postId}/like`)
  }

  const handleComment = async (postId, text) => {
    await api.post(`/feed/${postId}/comments`, { content: text })
  }

  const handleDelete = async (postId) => {
    await api.delete(`/feed/${postId}`)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Community Feed</h1>
          <p className="text-sm mt-1" style={{color:'#6B7280'}}>Share your wins and progress with the PulseOS community</p>
        </div>
      </div>

      {/* Create post */}
      <div className="rounded-2xl p-5 mb-6" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
            style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex gap-2 flex-wrap">
            {POST_TYPES.map(t => (
              <button key={t.value} onClick={() => setPostType(t.value)}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  background: postType === t.value ? `${t.color}25` : 'rgba(255,255,255,0.04)',
                  color: postType === t.value ? t.color : '#6B7280',
                  border: `1px solid ${postType === t.value ? `${t.color}50` : 'transparent'}`
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handlePost}>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder={`Share a ${postType === 'win' ? 'win 🏆' : postType === 'progress' ? 'progress update 📈' : 'thought 💭'}...`}
            rows={3}
            className="w-full bg-transparent outline-none resize-none text-sm text-white placeholder-gray-700 mb-4"/>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting || !content.trim()}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
              style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['feed', 'explore'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
            style={{
              background: tab === t ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: tab === t ? '#93C5FD' : '#6B7280',
              border: `1px solid ${tab === t ? 'rgba(59,130,246,0.3)' : 'transparent'}`
            }}>
            {t === 'feed' ? '🏠 My Feed' : '🌐 Explore'}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading && page === 1 && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{borderColor:'rgba(59,130,246,0.3)',borderTopColor:'#3B82F6'}}/>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-16 rounded-2xl" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
          <p className="text-3xl mb-3">🌱</p>
          <p className="text-white font-medium mb-2">No posts yet</p>
          <p className="text-sm" style={{color:'#6B7280'}}>
            {tab === 'feed' ? 'Follow people or post your first win above' : 'Be the first to post something'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post}
            currentUserId={user?.id}
            onLike={handleLike}
            onComment={handleComment}
            onDelete={handleDelete}/>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button onClick={() => fetchPosts(page + 1)}
            className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{background:'rgba(255,255,255,0.05)',color:'#9CA3AF',border:'1px solid rgba(255,255,255,0.08)'}}>
            Load more
          </button>
        </div>
      )}
    </div>
  )
}