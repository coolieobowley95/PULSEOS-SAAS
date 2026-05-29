import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import api from '../services/api'

const moodLabels = {
  '😊': 'Happy', '🤩': 'Excited', '😐': 'Neutral',
  '😴': 'Tired', '😔': 'Sad', '😤': 'Stressed'
}

const burnoutColors = {
  low: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#6EE7B7', label: 'Low — You are doing well' },
  medium: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D', label: 'Medium — Watch your energy levels' },
  high: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#FCA5A5', label: 'High — Consider rest and recovery' }
}

export default function Analytics() {
  const [mood, setMood] = useState(null)
  const [insight, setInsight] = useState(null)
  const [productivity, setProductivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [m, i, p] = await Promise.all([
        api.get(`/analytics/mood?days=${days}`),
        api.get('/analytics/mood/insight'),
        api.get('/analytics/productivity')
      ])
      setMood(m.data)
      setInsight(i.data.insight)
      setProductivity(p.data)
    } catch (err) {
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [days])

  const moodBarData = mood
    ? Object.entries(mood.moodCounts).map(([emoji, count]) => ({
        name: moodLabels[emoji] || emoji,
        emoji,
        count
      }))
    : []

  const scoreRing = productivity?.score || 0
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (scoreRing / 100) * circumference

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Life Analytics</h1>
          <p className="text-sm mt-1" style={{color:'#6B7280'}}>Your mood patterns and productivity intelligence</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          className="rounded-xl px-3 py-2 text-sm text-white outline-none"
          style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.08)'}}>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{borderColor:'rgba(59,130,246,0.3)',borderTopColor:'#3B82F6'}}/>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-6">

          {/* Top stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-xs mb-2" style={{color:'#6B7280'}}>Journal entries</p>
              <p className="text-3xl font-semibold text-white">{mood?.totalEntries || 0}</p>
              <p className="text-xs mt-1" style={{color:'#4B5563'}}>last {days} days</p>
            </div>
            <div className="rounded-2xl p-5" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-xs mb-2" style={{color:'#6B7280'}}>Journal streak</p>
              <p className="text-3xl font-semibold text-white">{mood?.journalStreak || 0}</p>
              <p className="text-xs mt-1" style={{color:'#4B5563'}}>days in a row</p>
            </div>
            <div className="rounded-2xl p-5" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-xs mb-2" style={{color:'#6B7280'}}>Avg mood score</p>
              <p className="text-3xl font-semibold text-white">{mood?.avgScore || '—'}</p>
              <p className="text-xs mt-1" style={{color:'#4B5563'}}>out of 5.0</p>
            </div>
            <div className="rounded-2xl p-5" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-xs mb-2" style={{color:'#6B7280'}}>Dominant mood</p>
              <p className="text-3xl">{mood?.dominantMood || '—'}</p>
              <p className="text-xs mt-1" style={{color:'#4B5563'}}>{moodLabels[mood?.dominantMood] || 'No data'}</p>
            </div>
          </div>

          {/* Productivity score + burnout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl p-6" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-sm font-medium text-white mb-6">Productivity Score</p>
              <div className="flex items-center gap-8">
                <div className="relative flex-shrink-0">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                    <circle cx="60" cy="60" r="54" fill="none"
                      stroke={productivity?.level?.color || '#3B82F6'}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      style={{transition:'stroke-dashoffset 1s ease'}}/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{scoreRing}</span>
                    <span className="text-xs" style={{color:'#6B7280'}}>/ 100</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <div>
                    <p className="text-xs mb-1" style={{color:'#6B7280'}}>Level</p>
                    <p className="text-sm font-medium" style={{color: productivity?.level?.color}}>
                      {productivity?.level?.label}
                    </p>
                  </div>
                  {productivity?.breakdown && Object.entries(productivity.breakdown).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs capitalize" style={{color:'#6B7280'}}>{key}</span>
                        <span className="text-xs text-white">{val.score}/{val.max}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{background:'rgba(255,255,255,0.06)'}}>
                        <div className="h-1 rounded-full" style={{width:`${(val.score/val.max)*100}%`,background:'linear-gradient(90deg,#3B82F6,#8B5CF6)'}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-sm font-medium text-white mb-4">Burnout Risk</p>
              {mood?.burnoutRisk && (
                <div className="rounded-xl p-4 mb-4" style={{
                  background: burnoutColors[mood.burnoutRisk].bg,
                  border: `1px solid ${burnoutColors[mood.burnoutRisk].border}`
                }}>
                  <p className="text-sm font-medium mb-1" style={{color: burnoutColors[mood.burnoutRisk].text}}>
                    {mood.burnoutRisk.toUpperCase()} RISK
                  </p>
                  <p className="text-xs" style={{color: burnoutColors[mood.burnoutRisk].text}}>
                    {burnoutColors[mood.burnoutRisk].label}
                  </p>
                </div>
              )}
              {insight && (
                <div className="rounded-xl p-4" style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)'}}>
                  <p className="text-xs font-medium mb-2" style={{color:'#C4B5FD'}}>✦ AI Mood Insight</p>
                  <p className="text-xs leading-relaxed" style={{color:'#DDD6FE'}}>{insight}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mood timeline chart */}
          {mood?.moodData?.length > 0 && (
            <div className="rounded-2xl p-6" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-sm font-medium text-white mb-6">Mood Timeline</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mood.moodData}>
                  <XAxis dataKey="date" tick={{fill:'#4B5563',fontSize:11}}
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'})}/>
                  <YAxis domain={[0,5]} tick={{fill:'#4B5563',fontSize:11}} ticks={[1,2,3,4,5]}/>
                  <Tooltip
                    contentStyle={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px'}}
                    labelStyle={{color:'#9CA3AF',fontSize:'11px'}}
                    formatter={(val, name, props) => [props.payload.mood + ' ' + props.payload.label, 'Mood']}/>
                  <Line type="monotone" dataKey="score" stroke="#8B5CF6"
                    strokeWidth={2} dot={{fill:'#8B5CF6',r:4}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Mood distribution */}
          {moodBarData.length > 0 && (
            <div className="rounded-2xl p-6" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-sm font-medium text-white mb-6">Mood Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={moodBarData}>
                  <XAxis dataKey="name" tick={{fill:'#4B5563',fontSize:11}}/>
                  <YAxis tick={{fill:'#4B5563',fontSize:11}}/>
                  <Tooltip
                    contentStyle={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px'}}
                    labelStyle={{color:'#9CA3AF',fontSize:'11px'}}/>
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {moodBarData.map((_, i) => (
                      <Cell key={i} fill={['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899'][i % 6]}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* No data state */}
          {mood?.totalEntries === 0 && (
            <div className="rounded-2xl p-10 text-center" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-3xl mb-3">📓</p>
              <p className="text-white font-medium mb-2">No journal data yet</p>
              <p className="text-sm" style={{color:'#6B7280'}}>Start writing journal entries with mood tags to see your patterns here</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}