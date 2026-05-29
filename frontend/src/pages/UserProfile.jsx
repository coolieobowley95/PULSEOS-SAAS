import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function UserProfile() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    api.get(`/feed/users/${userId}`)
      .then(r => setProfile(r.data))
      .finally(() => setLoading(false))
  }, [userId])

  const handleFollow = async () => {
    setToggling(true)
    try {
      const res = await api.post(`/feed/users/${userId}/follow`)
      setProfile(prev => ({
        ...prev,
        isFollowing: res.data.following,
        followerCount: prev.followerCount + (res.data.following ? 1 : -1)
      }))
    } finally { setToggling(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{borderColor:'rgba(59,130,246,0.3)',borderTopColor:'#3B82F6'}}/>
    </div>
  )

  if (!profile) return <div className="p-8 text-white">User not found</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link to="/feed" className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{color:'#6B7280'}}>
        ← Back to feed
      </Link>

      <div className="rounded-2xl p-6 mb-6" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
              {profile.user.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{profile.user.name}</h1>
              <p className="text-sm mt-1" style={{color:'#6B7280'}}>
                Joined {new Date(profile.user.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'})}
              </p>
            </div>
          </div>

          {!profile.isOwnProfile && (
            <button onClick={handleFollow} disabled={toggling}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{
                background: profile.isFollowing ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                color: 'white',
                border: profile.isFollowing ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}>
              {toggling ? '...' : profile.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="flex gap-6 mt-5">
          {[
            { label: 'Posts', value: profile.posts.length },
            { label: 'Followers', value: profile.followerCount },
            { label: 'Following', value: profile.followingCount }
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-semibold text-white">{s.value}</p>
              <p className="text-xs" style={{color:'#6B7280'}}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {profile.posts.length === 0 && (
          <div className="text-center py-10 rounded-2xl" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
            <p className="text-sm" style={{color:'#6B7280'}}>No public posts yet</p>
          </div>
        )}
        {profile.posts.map(post => (
          <div key={post.id} className="rounded-2xl p-5"
            style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
            <p className="text-sm leading-relaxed text-white mb-2">{post.content}</p>
            {post.aiSummary && (
              <p className="text-xs" style={{color:'#8B5CF6'}}>✦ {post.aiSummary}</p>
            )}
            <div className="flex gap-4 mt-3">
              <span className="text-xs" style={{color:'#4B5563'}}>❤️ {post.likeCount}</span>
              <span className="text-xs" style={{color:'#4B5563'}}>💬 {post.commentCount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}