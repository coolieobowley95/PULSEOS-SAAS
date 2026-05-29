// backend/src/controllers/calendar.controller.js
// Handles Google Calendar OAuth flow, event fetching, and AI-powered event creation.
// Tokens are stored per-user in CalendarToken table — never exposed to frontend.

import { google } from 'googleapis'
import { prisma } from '../lib/prisma.js'
import { getGroq } from '../lib/groq.js'

// ─── OAuth client factory ─────────────────────────────────────────────────────
// Creates a fresh OAuth2 client using env vars.
// Called on every request so credentials are always fresh.
function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

// ─── GET /api/calendar/auth/url ───────────────────────────────────────────────
// Returns the Google consent screen URL.
// Frontend redirects user to this URL to begin OAuth.
export const getAuthUrl = (req, res) => {
  const oauth2Client = getOAuthClient()

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',   // offline = get refresh token
    prompt: 'consent',        // always show consent so refresh token is returned
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    state: req.userId,        // pass userId through OAuth so callback knows who connected
  })

  res.json({ url })
}

// ─── GET /api/calendar/auth/callback ─────────────────────────────────────────
// Google redirects here after user grants permission.
// Exchanges the code for tokens and saves them to DB.
export const handleCallback = async (req, res) => {
  const { code, state: userId } = req.query

  if (!code || !userId) {
    return res.status(400).send('Missing code or state')
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    // tokens.expiry_date is a unix ms timestamp
    await prisma.calendarToken.upsert({
      where: { userId },
      update: {
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token ?? '',
        expiryDate:   new Date(tokens.expiry_date),
      },
      create: {
        userId,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token ?? '',
        expiryDate:   new Date(tokens.expiry_date),
      },
    })

    // Redirect back to the frontend Calendar page after successful connect
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar?connected=true`)
  } catch (err) {
    console.error('Calendar callback error:', err.message)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar?error=true`)
  }
}

// ─── Helper: build authenticated calendar client for a user ──────────────────
// Loads stored tokens, auto-refreshes if expired, returns a ready calendar client.
async function getCalendarClient(userId) {
  const tokenRow = await prisma.calendarToken.findUnique({ where: { userId } })
  if (!tokenRow) return null

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token:  tokenRow.accessToken,
    refresh_token: tokenRow.refreshToken,
    expiry_date:   tokenRow.expiryDate.getTime(),
  })

  // Auto-refresh if token is expired or expires within 5 minutes
  const expiresIn = tokenRow.expiryDate.getTime() - Date.now()
  if (expiresIn < 5 * 60 * 1000) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    await prisma.calendarToken.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token,
        expiryDate:  new Date(credentials.expiry_date),
      },
    })
    oauth2Client.setCredentials(credentials)
  }

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

// ─── GET /api/calendar/status ─────────────────────────────────────────────────
// Returns whether the user has connected Google Calendar.
export const getStatus = async (req, res) => {
  const token = await prisma.calendarToken.findUnique({
    where: { userId: req.userId },
  })
  res.json({ connected: !!token })
}

// ─── GET /api/calendar/events ─────────────────────────────────────────────────
// Returns upcoming events for the next 7 days.
export const getEvents = async (req, res) => {
  try {
    const calendar = await getCalendarClient(req.userId)
    if (!calendar) {
      return res.status(403).json({ error: 'Calendar not connected' })
    }

    const now = new Date()
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin:    now.toISOString(),
      timeMax:    weekLater.toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = (response.data.items || []).map(e => ({
      id:       e.id,
      title:    e.summary || '(No title)',
      start:    e.start?.dateTime || e.start?.date,
      end:      e.end?.dateTime   || e.end?.date,
      location: e.location || null,
      isAllDay: !e.start?.dateTime,
    }))

    res.json({ events })
  } catch (err) {
    console.error('getEvents error:', err.message)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
}

// ─── POST /api/calendar/events ────────────────────────────────────────────────
// Creates a calendar event from natural language using Groq to parse intent.
// Body: { text: "schedule standup tomorrow at 10am for 30 minutes" }
export const createEvent = async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) {
    return res.status(400).json({ error: 'No event description provided' })
  }

  try {
    const calendar = await getCalendarClient(req.userId)
    if (!calendar) {
      return res.status(403).json({ error: 'Calendar not connected' })
    }

    // Use Groq to parse natural language into a structured event
    const groq = getGroq()
    const now = new Date()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You parse natural language into calendar event JSON. Return ONLY valid JSON, no markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Current date and time: ${now.toISOString()}
User request: "${text}"

Return JSON with exactly these keys:
{
  "title": "event title",
  "startDateTime": "ISO 8601 datetime string",
  "endDateTime": "ISO 8601 datetime string",
  "description": "optional description or empty string"
}

Rules:
- If no duration mentioned, default to 1 hour
- If no date mentioned, assume today
- If time is ambiguous (e.g. "morning"), pick 9:00 AM
- Always return full ISO datetime strings with timezone offset`,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    })

    const raw = completion.choices[0]?.message?.content?.trim() || ''
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary:     parsed.title,
        description: parsed.description || '',
        start: { dateTime: parsed.startDateTime },
        end:   { dateTime: parsed.endDateTime },
      },
    })

    res.json({
      success: true,
      event: {
        id:    event.data.id,
        title: event.data.summary,
        start: event.data.start?.dateTime,
        end:   event.data.end?.dateTime,
        link:  event.data.htmlLink,
      },
    })
  } catch (err) {
    console.error('createEvent error:', err.message)
    res.status(500).json({ error: 'Failed to create event' })
  }
}

// ─── DELETE /api/calendar/disconnect ─────────────────────────────────────────
// Revokes Google token and removes it from DB.
export const disconnect = async (req, res) => {
  try {
    const token = await prisma.calendarToken.findUnique({
      where: { userId: req.userId },
    })

    if (token) {
      // Try to revoke the token with Google (best effort)
      try {
        const oauth2Client = getOAuthClient()
        await oauth2Client.revokeToken(token.accessToken)
      } catch (_) {
        // Ignore revoke errors — still delete from DB
      }

      await prisma.calendarToken.delete({ where: { userId: req.userId } })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('disconnect error:', err.message)
    res.status(500).json({ error: 'Failed to disconnect' })
  }
}