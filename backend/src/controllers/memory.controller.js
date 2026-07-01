import { prisma } from '../lib/prisma.js'
import { getGroqClient } from '../lib/groq.js'

const ALLOWED_CATEGORIES = new Set([
  'project',
  'habit',
  'goal',
  'struggle',
  'preference',
  'personal',
  'work',
  'general'
])

const DEFAULT_TIMEOUT_MS = 12_000

function stripCodeFences(text) {
  if (!text) return ''
  return String(text).replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
}

function safeJsonParse(raw) {
  if (!raw) return null
  const cleaned = stripCodeFences(raw)
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('[')
    const end = cleaned.lastIndexOf(']')
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function normalizeFact(fact) {
  return String(fact || '').replace(/\s+/g, ' ').trim()
}

function isValidFact(fact) {
  const f = normalizeFact(fact)
  if (!f) return false
  if (f.length < 6) return false
  if (f.length > 220) return false
  if (/^i can'?t|^sorry|^as an ai/i.test(f)) return false
  return true
}

function buildTranscript(chatHistory) {
  const items = Array.isArray(chatHistory) ? chatHistory : []
  const lines = []
  for (const m of items) {
    const role = String(m?.role || '').toLowerCase()
    const content = normalizeFact(m?.content ?? m?.text ?? '')
    if (!content) continue
    if (role === 'assistant') lines.push(`Assistant: ${content}`)
    else lines.push(`User: ${content}`)
  }
  return lines.join('\n')
}

async function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT_MS) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Groq call timed out')), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

function getGroqSafe() {
  try {
    return getGroqClient()
  } catch {
    return null
  }
}

export const getMemories = async (req, res) => {
  try {
    const memories = await prisma.memory.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' }
    })
    res.json(memories)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteMemory = async (req, res) => {
  try {
    const memory = await prisma.memory.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!memory) return res.status(404).json({ message: 'Memory not found' })
    await prisma.memory.delete({ where: { id: req.params.id } })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const extractMemoriesFromChat = async (userId, chatHistory) => {
  try {
    if (!userId) return 0
    const transcript = buildTranscript(chatHistory)
    if (!transcript) return 0

    const existing = await prisma.memory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 200
    })
    const existingSet = new Set(existing.map(m => normalizeFact(m.fact).toLowerCase()).filter(Boolean))

    const groq = getGroqSafe()
    if (!groq) {
      console.warn('[memory] GROQ_API_KEY missing; skipping extraction')
      return 0
    }

    const prompt = `You are extracting long-term memory facts about a user from a conversation transcript.

RULES:
- ONLY extract NEW, useful, stable facts that will help personalize future chats.
- Do NOT repeat facts that already exist.
- Do NOT include one-off/time-sensitive details unless they are a durable preference/goal/struggle.
- Return STRICT JSON ONLY. No markdown. No commentary.
- Output must be a JSON array. Each item: {"fact": string, "category": one of ${Array.from(ALLOWED_CATEGORIES).join(', ')}}.
- Keep "fact" short (6-220 chars), concrete, and user-specific.

EXISTING MEMORIES (do not repeat):
${existing.map(m => `- [${m.category}] ${m.fact}`).join('\n') || '(none)'}

TRANSCRIPT:
${transcript}
`

    const completion = await withTimeout(
      groq.chat.completions.create({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 700
      }),
      DEFAULT_TIMEOUT_MS
    )

    const raw = completion?.choices?.[0]?.message?.content
    const parsed = safeJsonParse(raw)
    const items = Array.isArray(parsed) ? parsed : []

    const toCreate = []
    for (const item of items) {
      const fact = normalizeFact(item?.fact)
      const categoryRaw = String(item?.category || 'general').toLowerCase().trim()
      const category = ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : 'general'

      if (!isValidFact(fact)) continue
      const key = fact.toLowerCase()
      if (existingSet.has(key)) continue

      existingSet.add(key)
      toCreate.push({ fact, category, userId })
    }

    if (!toCreate.length) return 0

    const created = await prisma.memory.createMany({ data: toCreate })
    const count = Number(created?.count || 0)
    if (count) console.log(`[memory] extracted ${count} new memories for user ${userId}`)
    return count
  } catch (err) {
    console.error('[memory] extraction failed:', err?.message || err)
    return 0
  }
}

