// backend/src/controllers/startup.controller.js

import { getGroq } from "../lib/groq.js";  // ← was: import groq from "../lib/groq.js"

export const generateStartup = async (req, res) => {
  try {
    const { idea, category = "SaaS" } = req.body;

    if (!idea || idea.trim().length < 10) {
      return res.status(400).json({ error: "Please provide a more detailed idea (min 10 chars)." });
    }

    const prompt = `You are an expert full-stack startup architect.
A user has this startup idea: "${idea.trim()}"
Category: ${category}

Generate a complete technical blueprint. Return ONLY a valid JSON object — no markdown, no backticks, no explanation.
Shape:
{
  "name": "startup name (2-3 words max)",
  "tagline": "one-line value proposition",
  "schema": "full Prisma schema with 4+ relevant models and relations",
  "api": "Express router code with key REST routes and inline comments",
  "folder": "ASCII folder tree showing backend/ and frontend/ structure",
  "frontend": "Markdown: list pages, key components, state management approach, auth strategy",
  "deploy": "Markdown: step-by-step Railway (backend) + Vercel (frontend) deploy guide with env vars and DB migration"
}

Rules:
- schema: use real Prisma syntax, @id, @default, @relation, createdAt, etc.
- api: use real Express router.get/post/put/delete with descriptive comments
- folder: keep it clean and realistic for a production app
- Be specific to the idea, not generic boilerplate`;

    const groq = getGroq();  // ← get the singleton instance

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a senior software architect. Always respond with pure JSON only. No markdown fences, no explanation, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let blueprint;
    try {
      blueprint = JSON.parse(cleaned);
    } catch {
      console.error("Groq returned non-JSON:", cleaned.slice(0, 300));
      return res.status(500).json({ error: "AI returned malformed response. Please try again." });
    }

    return res.json({ success: true, blueprint });

  } catch (err) {
    console.error("Startup generator error:", err.message);
    return res.status(500).json({ error: "Generation failed. Please try again." });
  }
};