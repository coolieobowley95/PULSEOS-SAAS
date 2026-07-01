// backend/src/controllers/github.controller.js
// Fetches GitHub activity using the user's Personal Access Token.
// Token is stored server-side on the User model — never exposed to frontend.
// Uses the GitHub REST API v3 — no SDK needed, just fetch.

import { prisma } from '../lib/prisma.js'
import { getGroq } from '../lib/groq.js'

const GH_API = 'https://api.github.com'

// ─── Helper: authenticated GitHub fetch ──────────────────────────────────────
async function ghFetch(path, token) {
  const res = await fetch(`${GH_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `GitHub API error: ${res.status}`)
  }
  return res.json()
}

// ─── POST /api/github/connect ─────────────────────────────────────────────────
// Validates the token, fetches the username, saves both to DB.
export const connectGitHub = async (req, res) => {
  const { token } = req.body
  if (!token?.trim()) {
    return res.status(400).json({ error: 'GitHub token required' })
  }

  try {
    // Validate token by fetching the authenticated user
    const ghUser = await ghFetch('/user', token)

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        githubToken:    token.trim(),
        githubUsername: ghUser.login,
      },
    })

    res.json({ success: true, username: ghUser.login })
  } catch (err) {
    console.error('connectGitHub error:', err.message)
    res.status(400).json({ error: 'Invalid token or GitHub API error' })
  }
}

// ─── DELETE /api/github/disconnect ───────────────────────────────────────────
export const disconnectGitHub = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { githubToken: null, githubUsername: null },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect' })
  }
}

// ─── GET /api/github/status ───────────────────────────────────────────────────
export const getStatus = async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.userId },
    select: { githubUsername: true, githubToken: true },
  })
  res.json({
    connected: !!user?.githubToken,
    username:  user?.githubUsername || null,
  })
}

// ─── GET /api/github/activity ─────────────────────────────────────────────────
// Returns repos + recent commits + contribution summary.
export const getActivity = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.userId },
      select: { githubToken: true, githubUsername: true },
    })

    if (!user?.githubToken) {
      return res.status(403).json({ error: 'GitHub not connected' })
    }

    const { githubToken: token, githubUsername: username } = user

    // Fetch repos (sorted by recent push)
    const repos = await ghFetch(
      `/user/repos?sort=pushed&per_page=10&type=owner`,
      token
    )

    // Fetch recent events (commits, PRs, etc.)
    const events = await ghFetch(
      `/users/${username}/events?per_page=30`,
      token
    )

    // Filter to push events only and extract commits
    const pushEvents = events.filter(e => e.type === 'PushEvent')
    const recentCommits = pushEvents.flatMap(e =>
      (e.payload.commits || []).map(c => ({
        repo:    e.repo.name,
        message: c.message.split('\n')[0].slice(0, 80), // first line, max 80 chars
        sha:     c.sha.slice(0, 7),
        date:    e.created_at,
      }))
    ).slice(0, 20)

    // Commit count per day for the last 7 days
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    const commitsByDay = last7.map(day => ({
      day: day.slice(5), // MM-DD
      count: recentCommits.filter(c => c.date.startsWith(day)).length,
    }))

    // Top repos by stars
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map(r => ({
        name:     r.name,
        fullName: r.full_name,
        stars:    r.stargazers_count,
        language: r.language,
        url:      r.html_url,
        pushedAt: r.pushed_at,
      }))

    res.json({
      username,
      recentCommits,
      commitsByDay,
      topRepos,
      totalCommits7d: recentCommits.length,
    })
  } catch (err) {
    console.error('getActivity error:', err.message)
    res.status(500).json({ error: 'Failed to fetch GitHub activity' })
  }
}

// ─── GET /api/github/summary ──────────────────────────────────────────────────
// AI-generated summary of coding activity — used in briefing.
export const getAISummary = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.userId },
      select: { githubToken: true, githubUsername: true },
    })
    if (!user?.githubToken) {
      return res.status(403).json({ error: 'GitHub not connected' })
    }

    const events = await ghFetch(
      `/users/${user.githubUsername}/events?per_page=20`,
      user.githubToken
    )

    const pushEvents = events.filter(e => e.type === 'PushEvent')
    const commits = pushEvents.flatMap(e =>
      (e.payload.commits || []).map(c => ({
        repo:    e.repo.name,
        message: c.message.split('\n')[0].slice(0, 60),
      }))
    ).slice(0, 10)

    if (!commits.length) {
      return res.json({ summary: 'No recent commits found.' })
    }

    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: 'You summarize a developer\'s recent GitHub activity in 2 sentences. Be specific and encouraging.',
        },
        {
          role: 'user',
          content: `Recent commits:\n${commits.map(c => `- [${c.repo}] ${c.message}`).join('\n')}`,
        },
      ],
      temperature: 0.6,
      max_tokens:  120,
    })

    const summary = completion.choices[0]?.message?.content?.trim() || 'Active coding session detected.'
    res.json({ summary })
  } catch (err) {
    console.error('getAISummary error:', err.message)
    res.status(500).json({ error: 'Failed to generate summary' })
  }
}