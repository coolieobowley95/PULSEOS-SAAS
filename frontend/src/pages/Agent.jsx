import { useState } from 'react'
import api from '../services/api'

const suggestions = [
  { label: 'Plan my week', icon: '📅', instruction: 'Plan my week based on my current goals and create the most important tasks I should focus on' },
  { label: 'Morning routine', icon: '🌅', instruction: 'Create a productive morning routine as tasks for today' },
  { label: 'Review my progress', icon: '📊', instruction: 'Review my current goals and tasks, tell me how I am doing and what I should focus on next' },
  { label: 'Deep work session', icon: '🎯', instruction: 'Set up a deep work session by creating focused tasks for the next 3 hours' },
  { label: 'Weekly reset', icon: '🔄', instruction: 'Help me do a weekly reset — review what I completed, what is still pending, and create a fresh priority list' },
  { label: 'Motivate me', icon: '⚡', instruction: 'Look at my goals and progress and give me a personalized motivational plan with actionable next steps' },
]

const actionIcons = {
  create_task: '✓',
  complete_task: '✅',
  create_goal: '🎯',
  update_goal_progress: '📈',
  create_journal: '📓',
  send_message: '💬'
}

export default function Agent() {
  const [instruction, setInstruction] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const runAgent = async (text) => {
    const cmd = text || instruction
    if (!cmd.trim()) return
    setRunning(true)
    setResult(null)

    try {
      const res = await api.post('/agent/run', { instruction: cmd })
      setResult(res.data)
      setHistory(prev => [{ instruction: cmd, result: res.data, time: new Date() }, ...prev.slice(0, 4)])
      setInstruction('')
    } catch (err) {
      setResult({ error: err.response?.data?.message || 'Agent failed' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{background:'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(139,92,246,0.3))',border:'1px solid rgba(139,92,246,0.3)'}}>
            🤖
          </div>
          <h1 className="text-2xl font-semibold text-white">PulseOS Agent</h1>
        </div>
        <p className="text-sm" style={{color:'#6B7280'}}>
          Tell the agent what to do — it will create tasks, update goals, and take real actions in your life OS
        </p>
      </div>

      {/* Quick suggestions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {suggestions.map(s => (
          <button key={s.label} onClick={() => runAgent(s.instruction)}
            disabled={running}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-left transition-all disabled:opacity-40 hover:scale-[1.02]"
            style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
            <span className="text-lg flex-shrink-0">{s.icon}</span>
            <span className="text-white font-medium">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Custom instruction */}
      <div className="rounded-2xl p-5 mb-6" style={{background:'#0D1117',border:'1px solid rgba(255,255,255,0.06)'}}>
        <p className="text-xs font-medium mb-3" style={{color:'#6B7280'}}>Custom instruction</p>
        <textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="Tell PulseOS Agent what to do... e.g. 'Create tasks for launching my app this week' or 'Set up a study schedule for my exam'"
          rows={3}
          className="w-full bg-transparent outline-none resize-none text-sm mb-4 text-white"
          style={{caretColor:'#8B5CF6'}}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) runAgent() }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{color:'#4B5563'}}>⌘ + Enter to run</span>
          <button onClick={() => runAgent()}
            disabled={running || !instruction.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
            style={{background:'linear-gradient(135deg,#3B82F6,#8B5CF6)'}}>
            {running
              ? <><span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'rgba(255,255,255,0.3)',borderTopColor:'white'}}/>Running agent...</>
              : <>🤖 Run Agent</>}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && !result.error && (
        <div className="rounded-2xl p-6 mb-6" style={{background:'#0D1117',border:'1px solid rgba(59,130,246,0.2)'}}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <p className="text-sm font-medium text-white">Agent completed</p>
            <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
              style={{background:'rgba(16,185,129,0.15)',color:'#6EE7B7'}}>
              {result.actionsCompleted} actions done
            </span>
          </div>

          {result.messages?.map((msg, i) => (
            <div key={i} className="rounded-xl p-4 mb-4"
              style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)'}}>
              <p className="text-xs font-medium mb-2" style={{color:'#C4B5FD'}}>💬 Agent says</p>
              <p className="text-sm leading-relaxed" style={{color:'#DDD6FE'}}>{msg}</p>
            </div>
          ))}

          <div className="flex flex-col gap-2">
            {result.results?.filter(r => r.action !== 'send_message').map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{background: r.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'}}>
                <span className="text-sm">{actionIcons[r.action] || '⚡'}</span>
                <span className="text-xs flex-1" style={{color: r.success ? '#6EE7B7' : '#FCA5A5'}}>
                  {r.action.replace(/_/g, ' ')}
                  {r.result?.title ? `: "${r.result.title}"` : ''}
                </span>
                <span className="text-xs" style={{color: r.success ? '#10B981' : '#EF4444'}}>
                  {r.success ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>

          {result.actionsFailed > 0 && (
            <p className="text-xs mt-3" style={{color:'#EF4444'}}>
              {result.actionsFailed} action(s) failed — check your terminal for details
            </p>
          )}
        </div>
      )}

      {result?.error && (
        <div className="rounded-2xl p-5 mb-6" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)'}}>
          <p className="text-sm" style={{color:'#FCA5A5'}}>✗ {result.error}</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-3" style={{color:'#4B5563'}}>Recent agent runs</p>
          <div className="flex flex-col gap-2">
            {history.map((h, i) => (
              <button key={i} onClick={() => runAgent(h.instruction)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)'}}>
                <span className="text-sm">🔄</span>
                <span className="text-sm flex-1 truncate" style={{color:'#9CA3AF'}}>{h.instruction}</span>
                <span className="text-xs flex-shrink-0" style={{color:'#4B5563'}}>
                  {h.time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}