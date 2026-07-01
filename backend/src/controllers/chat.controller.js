import { getGroqClient } from '../lib/groq.js'
import { prisma } from '../lib/prisma.js'
import { extractMemoriesFromChat } from './memory.controller.js'

let groq

export const getChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } }
    })
    res.json(chats)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

export const createChat = async (req, res) => {
  try {
    const chat = await prisma.chat.create({ data: { userId: req.userId } })
    res.status(201).json(chat)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

export const getMessages = async (req, res) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!chat) return res.status(404).json({ message: 'Chat not found' })
    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      orderBy: { createdAt: 'asc' }
    })
    res.json(messages)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ message: 'Message required' })

    console.log('=== GROQ DEBUG ===')
    console.log('Key loaded:', process.env.GROQ_API_KEY ? `YES (${process.env.GROQ_API_KEY.slice(0, 8)}...)` : 'NO ✗')
    console.log('User message:', content)

    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!chat) return res.status(404).json({ message: 'Chat not found' })

    await prisma.message.create({
      data: { role: 'user', content, chatId: chat.id }
    })

    const history = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
      take: 20
    })

    const userContext = await getUserContext(req.userId)

    const messages = [
      {
        role: 'system',
        content: buildSystemPrompt(userContext)
      },
      ...history.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content }
    ]

    console.log('Calling Groq API...')
    groq = groq || getGroqClient()
    const completion = await groq.chat.completions.create({
      model: 'qwen-plus',
      messages,
      max_tokens: 1024,
      temperature: 0.7
    })

    console.log('Groq response received:', completion.choices[0].message.content.slice(0, 60))

    const aiText = completion.choices[0].message.content

    const aiMessage = await prisma.message.create({
      data: { role: 'assistant', content: aiText, chatId: chat.id }
    })

    extractMemoriesFromChat(req.userId, [...history, { role: 'assistant', content: aiText }]).catch(console.error)

    if (chat.title === 'New Chat') {
      await prisma.chat.update({
        where: { id: chat.id },
        data: { title: content.slice(0, 50) }
      })
    }

    res.json(aiMessage)
  } catch (err) {
    console.error('GROQ ERROR:', err.message)
    console.error('GROQ ERROR STATUS:', err.status)
    console.error('GROQ ERROR TYPE:', err.constructor.name)
    res.status(500).json({ message: 'AI error', error: err.message })
  }
}

export const deleteChat = async (req, res) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!chat) return res.status(404).json({ message: 'Chat not found' })
    await prisma.chat.delete({ where: { id: req.params.id } })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

async function getUserContext(userId) {
  const [tasks, goals, journals, memories] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.journal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.memory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50
    })
  ])
  return { tasks, goals, journals, memories }
}

function buildSystemPrompt({ tasks, goals, journals, memories }) {
  const pendingTasks = tasks.filter(t => !t.done)
  const doneTasks = tasks.filter(t => t.done)
  const recentMoods = journals.map(j => j.mood).filter(Boolean)
  const memoryLines = (Array.isArray(memories) ? memories : [])
    .map(m => {
      const cat = String(m?.category || 'general')
      const fact = String(m?.fact || '').trim()
      if (!fact) return null
      return `* [${cat}] ${fact}`
    })
    .filter(Boolean)

  return `You are PulseOS, an intelligent AI life assistant. You help users manage their tasks, goals, journal, and overall life direction.

You have real-time context about this user:

TASKS:
- Pending (${pendingTasks.length}): ${pendingTasks.map(t => `"${t.title}" [${t.priority}]`).join(', ') || 'none'}
- Completed (${doneTasks.length}): ${doneTasks.map(t => `"${t.title}"`).join(', ') || 'none'}

GOALS:
${goals.map(g => `- "${g.title}": ${g.progress}% of ${g.target}%`).join('\n') || '- No goals set yet'}

RECENT JOURNAL MOODS:
${recentMoods.length ? recentMoods.join(', ') : 'No journal entries yet'}

RECENT JOURNAL ENTRIES:
${journals.slice(0, 3).map(j => `- ${new Date(j.createdAt).toLocaleDateString()}: "${j.content.slice(0, 100)}"`).join('\n') || 'None'}

WHAT YOU REMEMBER ABOUT THIS USER:
${memoryLines.length ? memoryLines.join('\n') : '* [general] (No saved memories yet)'}

Your personality:
- Concise, personal, intelligent, motivational
- Reference the user's actual data when relevant
- Reference remembered facts naturally when relevant (don’t force it)
- Give actionable advice, not generic tips
- Help with planning, prioritization, reflection, and motivation
- If asked to generate a daily plan, use their actual tasks and goals
- Keep responses under 300 words unless asked for detail`
}