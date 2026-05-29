import { prisma } from '../lib/prisma.js'
import { getGroq } from '../lib/groq.js'

const groq = getGroq()

export const runAgent = async (req, res) => {
  try {
    const { instruction } = req.body
    if (!instruction) return res.status(400).json({ message: 'Instruction required' })

    console.log('🤖 Agent instruction:', instruction)

    const [tasks, goals, journals, memories] = await Promise.all([
      prisma.task.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.goal.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } }),
      prisma.journal.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.memory.findMany({ where: { userId: req.userId }, orderBy: { updatedAt: 'desc' }, take: 15 })
    ])

    const context = buildContext({ tasks, goals, journals, memories })

    const prompt = `You are PulseOS Agent — an AI that can take real actions in a user's life management system.

USER CONTEXT:
${context}

USER INSTRUCTION:
"${instruction}"

You can perform these actions by returning a JSON plan:

AVAILABLE ACTIONS:
- create_task: { title, priority ("low"|"medium"|"high"), dueDate (ISO string or null) }
- complete_task: { taskId }
- create_goal: { title, target (number 1-100) }
- update_goal_progress: { goalId, progress (number 0-100) }
- create_journal: { content, mood ("😊"|"😐"|"😔"|"😤"|"😴"|"🤩") }
- send_message: { content } — send a message back to the user

RULES:
- Only perform actions that match the user's instruction
- Always include at least one send_message action to explain what you did
- For "plan my week" — create 3-5 realistic tasks based on their goals and existing context
- For "review my progress" — send a detailed message, optionally update goal progress
- For "morning routine" — create tasks for the day
- Be specific and personal using their actual data
- Maximum 8 actions per response

Return ONLY valid JSON, no markdown:
{
  "actions": [
    { "type": "create_task", "data": { "title": "...", "priority": "high", "dueDate": null } },
    { "type": "send_message", "data": { "content": "Here is what I did for you..." } }
  ],
  "summary": "Brief summary of what the agent did"
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.5
    })

    const raw = completion.choices[0].message.content.trim()
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const plan = JSON.parse(cleaned)

    console.log('🤖 Agent plan:', plan.summary)
    console.log('🤖 Actions:', plan.actions.length)

    const results = []
    const messages = []

    for (const action of plan.actions) {
      try {
        const result = await executeAction(action, req.userId, { tasks, goals })
        results.push({ action: action.type, success: true, result })
        if (action.type === 'send_message') {
          messages.push(action.data.content)
        }
      } catch (err) {
        console.error(`Action ${action.type} failed:`, err.message)
        results.push({ action: action.type, success: false, error: err.message })
      }
    }

    res.json({
      summary: plan.summary,
      messages,
      results,
      actionsCompleted: results.filter(r => r.success).length,
      actionsFailed: results.filter(r => !r.success).length
    })
  } catch (err) {
    console.error('AGENT ERROR:', err.message)
    res.status(500).json({ message: 'Agent error', error: err.message })
  }
}

async function executeAction(action, userId, { tasks, goals }) {
  switch (action.type) {
    case 'create_task':
      return await prisma.task.create({
        data: {
          title: action.data.title,
          priority: action.data.priority || 'medium',
          dueDate: action.data.dueDate ? new Date(action.data.dueDate) : null,
          userId
        }
      })

    case 'complete_task': {
      const task = tasks.find(t => t.id === action.data.taskId)
      if (!task) throw new Error('Task not found')
      return await prisma.task.update({
        where: { id: action.data.taskId },
        data: { done: true }
      })
    }

    case 'create_goal':
      return await prisma.goal.create({
        data: {
          title: action.data.title,
          target: action.data.target || 100,
          userId
        }
      })

    case 'update_goal_progress': {
      const goal = goals.find(g => g.id === action.data.goalId)
      if (!goal) throw new Error('Goal not found')
      return await prisma.goal.update({
        where: { id: action.data.goalId },
        data: { progress: Math.min(Math.max(action.data.progress, 0), 100) }
      })
    }

    case 'create_journal':
      return await prisma.journal.create({
        data: {
          content: action.data.content,
          mood: action.data.mood || null,
          userId
        }
      })

    case 'send_message':
      return { delivered: true, content: action.data.content }

    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}

function buildContext({ tasks, goals, journals, memories }) {
  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return `
MEMORIES:
${memories.map(m => `- [${m.category}] ${m.fact}`).join('\n') || 'None'}

PENDING TASKS (${pending.length}):
${pending.map(t => `- ID:${t.id} "${t.title}" [${t.priority}]`).join('\n') || 'None'}

COMPLETED TASKS (${done.length}):
${done.slice(0, 5).map(t => `- "${t.title}"`).join('\n') || 'None'}

GOALS:
${goals.map(g => `- ID:${g.id} "${g.title}": ${g.progress}/${g.target}`).join('\n') || 'None'}

RECENT JOURNAL:
${journals.slice(0, 3).map(j => `- ${new Date(j.createdAt).toLocaleDateString()}: mood=${j.mood || 'none'} "${j.content.slice(0, 80)}"`).join('\n') || 'None'}
`
}