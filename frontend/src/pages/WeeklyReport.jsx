import { useState, useEffect } from 'react'
import api from '../services/api'

const levelColors = {
  85: { color: '#10B981', label: 'Peak Performance' },
  70: { color: '#3B82F6', label: 'On Track' },
  50: { color: '#F59E0B', label: 'Building Momentum' },
  30: { color: '#8B5CF6', label: 'Getting Started' },
  0:  { color: '#6B7280', label: 'Just Beginning' }
}

function getLevel(score) {
  if (score >= 85) return levelColors[85]
  if (score >= 70) return levelColors[70]
  if (score >= 50) return levelColors[50]
  if (score >= 30) return levelColors[30]
  return levelColors[0]
}

export default function WeeklyReport() {
  const [report, setReport] = useState(null)
  const [allReports, setAllReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [view, setView] = useState('latest')

  useEffect(() => {
    fetchLatest()
    fetchAll()
  }, [])

  const fetchLatest = async () => {
    try {
      const res = await api.get('/report/latest')
      setReport(res.data)
    } finally {
      setLoading(false)
    }
  }

  const fetchAll = async () => {
    try {
      const res = await api.get('/report/all')
      setAllReports(res.data)
    } catch {}
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/report/generate')
      setReport(res.data)
      setAllReports(prev => [res.data, ...prev])
    } catch (err) {
      alert('Failed to generate report: ' + (err.response?.data?.message || err.message))
    } finally {
      setGenerating(false)
    }
  }

  const circumference = 2 * Math.PI * 54
  const score = report?.productivityScore || 0
  const offset = circumference - (score / 100) * circumference
  const level = getLevel(score)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Weekly Report</h1>
          <p className="text-sm mt-1" style={{color:'#6B7280'}}>
            Your AI-generated life intelligence report
          </p>
        </div>
        <button onClick={generateReport} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
          style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
          {generating
            ? <><span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                style={{borderColor:'rgba(255,255,255,0.3)',borderTopColor:'white'}}/>Generating...</>
            : '📊 Generate Report'}
        </button>
      </div>

      {/* Tab toggle */}
      {allReports.length > 1 && (
        <div className="flex gap-2 mb-6">
          {['latest', 'history'].map(t => (
            <button key={t} onClick={() => setView(t)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
              style={{
                background: view === t ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: view === t ? '#93C5FD' : '#6B7280',
                border: `1px solid ${view === t ? 'rgba(59,130,246,0.3)' : 'transparent'}`
              }}>
              {t === 'latest' ? 'Latest Report' : `History (${allReports.length})`}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{borderColor:'rgba(59,130,246,0.3)',borderTopColor:'#3B82F6'}}/>
        </div>
      )}

      {!loading && !report && (
        <div className="rounded-2xl p-12 text-center" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
          <p className="text-4xl mb-4">📊</p>
          <p className="text-white font-medium mb-2">No report yet</p>
          <p className="text-sm mb-6" style={{color:'#6B7280'}}>
            Generate your first weekly life intelligence report
          </p>
          <button onClick={generateReport} disabled={generating}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
            style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
            {generating ? 'Generating...' : 'Generate First Report'}
          </button>
        </div>
      )}

      {!loading && report && view === 'latest' && (
        <div className="flex flex-col gap-6">

          {/* Week range */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"/>
            <p className="text-sm" style={{color:'#6B7280'}}>
              Week of {new Date(report.weekStart).toLocaleDateString('en-US',{month:'long',day:'numeric'})} —{' '}
              {new Date(report.weekEnd).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
            </p>
          </div>

          {/* Score + stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl p-6 flex flex-col items-center justify-center"
              style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="relative mb-3">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                  <circle cx="60" cy="60" r="54" fill="none"
                    stroke={level.color} strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{transition:'stroke-dashoffset 1s ease'}}/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{score}</span>
                  <span className="text-xs" style={{color:'#6B7280'}}>/100</span>
                </div>
              </div>
              <p className="text-sm font-medium" style={{color: level.color}}>{level.label}</p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {[
                { label: 'Tasks completed', value: report.tasksCompleted, icon: '✓', color: '#10B981' },
                { label: 'Tasks created', value: report.tasksCreated, icon: '➕', color: '#3B82F6' },
                { label: 'Journal entries', value: report.journalEntries, icon: '📓', color: '#8B5CF6' },
                { label: 'Dominant mood', value: report.dominantMood || '—', icon: '😊', color: '#F59E0B' }
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4"
                  style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <p className="text-xs mb-2" style={{color:'#6B7280'}}>{s.label}</p>
                  <p className="text-2xl font-semibold" style={{color: s.color}}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Narrative */}
          <div className="rounded-2xl p-6"
            style={{background:'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))',border:'1px solid rgba(139,92,246,0.2)'}}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✦</span>
              <p className="text-sm font-medium" style={{color:'#C4B5FD'}}>AI Weekly Narrative</p>
            </div>
            <p className="text-sm leading-relaxed" style={{color:'#DDD6FE'}}>{report.aiNarrative}</p>
          </div>

          {/* Wins + Challenges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl p-6"
              style={{background:'#0D1117',border:'1px solid rgba(16,185,129,0.2)'}}>
              <div className="flex items-center gap-2 mb-4">
                <span>🏆</span>
                <p className="text-sm font-medium" style={{color:'#6EE7B7'}}>Wins this week</p>
              </div>
              <p className="text-sm leading-relaxed" style={{color:'#D1D5DB'}}>{report.wins}</p>
            </div>

            <div className="rounded-2xl p-6"
              style={{background:'#0D1117',border:'1px solid rgba(245,158,11,0.2)'}}>
              <div className="flex items-center gap-2 mb-4">
                <span>⚠️</span>
                <p className="text-sm font-medium" style={{color:'#FCD34D'}}>Challenges</p>
              </div>
              <p className="text-sm leading-relaxed" style={{color:'#D1D5DB'}}>{report.challenges}</p>
            </div>
          </div>

          {/* Next week focus */}
          <div className="rounded-2xl p-6"
            style={{background:'#0D1117',border:'1px solid rgba(59,130,246,0.2)'}}>
            <div className="flex items-center gap-2 mb-4">
              <span>🎯</span>
              <p className="text-sm font-medium" style={{color:'#93C5FD'}}>Next week focus</p>
            </div>
            <p className="text-sm leading-relaxed" style={{color:'#D1D5DB'}}>{report.nextWeekFocus}</p>
          </div>

        </div>
      )}

      {/* History view */}
      {view === 'history' && (
        <div className="flex flex-col gap-4">
          {allReports.map(r => {
            const lvl = getLevel(r.productivityScore)
            return (
              <div key={r.id} className="rounded-2xl p-5"
                style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">
                    Week of {new Date(r.weekStart).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{background:`${lvl.color}20`,color:lvl.color}}>
                      {r.productivityScore}/100
                    </span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{color:'#6B7280'}}>
                  {r.aiNarrative}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
