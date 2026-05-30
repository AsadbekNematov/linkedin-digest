import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Category =
  | "job_opportunity"
  | "congratulations"
  | "industry_news"
  | "thought_leadership"
  | "personal_update"
  | "other"

interface RawPost {
  id: string
  author: string
  authorTitle: string
  originalText: string
  linkedinUrl: string
  reactions: number
  comments: number
  timestamp: string
}

interface ProcessedPost extends RawPost {
  category: Category
  summary: string
  avatarInitials: string
  avatarColor: string
}

const AVATAR_COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
  "#ec4899", "#0077b5", "#ef4444", "#06b6d4",
]

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

function getColor(name: string) {
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

async function processPostBatch(posts: RawPost[]): Promise<ProcessedPost[]> {
  const postsJson = posts.map((p, i) => `[${i}] ${p.author}: "${p.originalText.slice(0, 400)}"`).join("\n\n")

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Categorize and summarize each LinkedIn post. Return a JSON array with one object per post (same order).

Categories: job_opportunity, congratulations, industry_news, thought_leadership, personal_update, other

For each post return:
- index: number
- category: one of the categories above
- summary: 1-2 sentence plain-English summary (no fluff, just the key point)

Posts:
${postsJson}

Return ONLY valid JSON array, no markdown, no explanation.`,
      },
    ],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]"
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim()
  const results: { index: number; category: Category; summary: string }[] = JSON.parse(cleaned)

  return posts.map((post, i) => {
    const result = results.find((r) => r.index === i) ?? { category: "other" as Category, summary: post.originalText.slice(0, 120) }
    return {
      ...post,
      category: result.category,
      summary: result.summary,
      avatarInitials: getInitials(post.author),
      avatarColor: getColor(post.author),
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const { posts }: { posts: RawPost[] } = await req.json()

    if (!posts?.length) {
      return NextResponse.json({ error: "No posts provided" }, { status: 400 })
    }

    // Process in batches of 8
    const BATCH_SIZE = 8
    const batches: RawPost[][] = []
    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      batches.push(posts.slice(i, i + BATCH_SIZE))
    }

    const results = await Promise.all(batches.map(processPostBatch))
    const processed = results.flat()

    return NextResponse.json({ posts: processed })
  } catch (err) {
    console.error("Refresh API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
