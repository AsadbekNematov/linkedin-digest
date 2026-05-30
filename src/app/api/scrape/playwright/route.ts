import { NextRequest, NextResponse } from "next/server"
import { chromium, type Browser, type Page } from "playwright"
import fs from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PROFILE_DIR = path.join(process.cwd(), ".playwright-profile")
const TARGET_URL = "https://www.linkedin.com/feed/"
const DEFAULT_TARGET_COUNT = 15
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS === "1"
const LOGIN_WAIT_MS = Number(process.env.PLAYWRIGHT_LOGIN_WAIT_MS || "45000")
const CHROME_CDP_URL = process.env.PLAYWRIGHT_CDP_URL || ""

async function getBrowserContext() {
  if (CHROME_CDP_URL) {
    const browser = await chromium.connectOverCDP(CHROME_CDP_URL)
    const context = browser.contexts()[0] || await browser.newContext()

    return {
      browser,
      context,
      cleanup: async () => {},
      mode: "cdp" as const,
    }
  }

  await fs.mkdir(PROFILE_DIR, { recursive: true })
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chrome",
    headless: HEADLESS,
    viewport: { width: 1440, height: 1600 },
    args: ["--disable-blink-features=AutomationControlled"],
  })

  return {
    browser: null as Browser | null,
    context,
    cleanup: async () => {
      await context.close().catch(() => {})
    },
    mode: "persistent" as const,
  }
}

type Category =
  | "job_opportunity"
  | "career_milestone"
  | "industry_news"
  | "thought_leadership"
  | "startup_funding"
  | "product_launch"
  | "learning_growth"
  | "event_conference"
  | "congratulations"
  | "personal_story"

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

function normalizeLinkedInUrl(rawUrl: string) {
  if (!rawUrl) return ""
  try {
    const url = new URL(rawUrl, "https://www.linkedin.com")
    url.hash = ""
    url.search = ""
    url.pathname = url.pathname.replace(/\/(?:reactions|comments)\/?.*$/i, "/")
    return url.toString()
  } catch {
    return String(rawUrl).replace(/\/(?:reactions|comments)\/?.*$/i, "/")
  }
}

async function waitForLoginIfNeeded(page: Page, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const currentUrl = page.url()
    const loginInputCount = await page.locator('input[name="session_key"]').count().catch(() => 0)
    const looksLikeLogin = /login/i.test(currentUrl) || loginInputCount > 0
    if (!looksLikeLogin) return
    await page.waitForTimeout(2000)
  }

  throw new Error(
    "LinkedIn login is required for Playwright scraping. Log in once in the opened browser window, then try again."
  )
}

async function extractPosts(page: Page, targetCount: number): Promise<RawPost[]> {
  const seen = new Set<string>()
  const posts: RawPost[] = []
  let stagnantRounds = 0
  let scrollAttempts = 0
  const maxRounds = Math.max(targetCount * 5, 25)

  while (posts.length < targetCount && scrollAttempts < maxRounds && stagnantRounds < 6) {
    const roundPosts = await page.evaluate((seenKeys) => {
      const cardSelectors = [
        ".feed-shared-update-v2",
        ".occludable-update",
        "[data-urn]",
        "article",
        "[role='article']",
      ]
      const candidateAnchors = Array.from(document.querySelectorAll("a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']"))
      const cards = Array.from(document.querySelectorAll(cardSelectors.join(",")))
      const fallbackCards = candidateAnchors.map((anchor) => {
        const seed = anchor.closest("[data-urn], article, [role='article']") || anchor.parentElement || anchor
        let node: Element | null = seed
        let depth = 0
        let best: Element | null = null
        let bestScore = -1

        while (node && depth < 8) {
          const text = (node as HTMLElement).innerText?.trim() || ""
          let score = 0
          if (text.length > 30) score += Math.min(text.length, 600)
          if (node.matches?.("[data-urn], article, [role='article'], .feed-shared-update-v2, .occludable-update")) score += 250
          if (node.querySelector?.("a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']")) score += 100
          if (score > bestScore) {
            bestScore = score
            best = node
          }
          node = node.parentElement
          depth += 1
        }
        return best
      }).filter(Boolean) as Element[]

      const candidates = cards.length > 0 ? cards : fallbackCards
      const result: RawPost[] = []
      const seen = new Set(seenKeys)

      const authorSelectors = [
        ".update-components-actor__name span[aria-hidden='true']",
        ".feed-shared-actor__name span[aria-hidden='true']",
        ".update-components-actor__name",
        ".feed-shared-actor__name",
        "[data-test-id='actor-name']",
        "[data-test-id='feed-shared-actor-name']",
      ]
      const textSelectors = [
        ".feed-shared-update-v2__description",
        ".update-components-text",
        ".feed-shared-text",
        ".update-components-update-v2__commentary",
        "[data-test-id='main-feed-activity-card__commentary']",
        "[data-test-id='feed-shared-text-view']",
        "[data-test-id='post-text']",
      ]
      const reactionSelectors = [
        ".social-details-social-counts__reactions-count",
        ".feed-shared-social-action-bar__action-count",
        "[data-test-id='social-actions-reactions-count']",
        "[aria-label*='reactions']",
        "[aria-label*='reaction']",
      ]
      const commentSelectors = [
        ".social-details-social-counts__comments",
        "[data-test-id='social-actions-comments-count']",
        "[aria-label*='comment']",
      ]
        const canonicalUrlFromUrn = (rawUrn: string) => {
          const urn = String(rawUrn || '').trim()
          if (!urn) return ''

          const normalized = urn.replace(/^urn:li:/i, '')
          const match = normalized.match(/^(activity|share):([^/?#]+)/i)
          if (!match) return ''
          return `https://www.linkedin.com/feed/update/${match[1].toLowerCase()}:${match[2]}/`
        }
        const normalizeLinkedInUrl = (rawUrl: string) => {
          if (!rawUrl) return ''
          try {
            const url = new URL(rawUrl, 'https://www.linkedin.com')
            url.hash = ''
            url.search = ''
            url.pathname = url.pathname.replace(/\/(?:reactions|comments)\/?.*$/i, '/')
            return url.toString()
          } catch {
            return String(rawUrl).replace(/\/(?:reactions|comments)\/?.*$/i, '/')
          }
        }
        const parseCount = (rawValue: string | undefined) => {
          if (!rawValue) return 0
          const value = String(rawValue).trim().toLowerCase()
          const numeric = Number.parseFloat(value.replace(/,/g, ''))
          if (Number.isNaN(numeric)) return 0
          if (value.endsWith('k')) return Math.round(numeric * 1000)
          if (value.endsWith('m')) return Math.round(numeric * 1000000)
          if (value.endsWith('b')) return Math.round(numeric * 1000000000)
          return Math.round(numeric)
        }

      for (const card of candidates) {
        const rawText = (card as HTMLElement).innerText || card.textContent || ""
        const firstLine = rawText.split(/\n+/)[0]?.trim().toLowerCase() || ""
        if (/^start a post$|^create a post$|^start a conversation$|^write article$|^share a photo$/.test(firstLine)) continue

        const dataUrn =
          card.getAttribute("data-urn") ||
          card.querySelector("[data-urn]")?.getAttribute("data-urn") ||
          card.querySelector("[data-urn]")?.getAttribute("data-urn") ||
          ""
        const linkHref = Array.from(card.querySelectorAll("a[href]"))
          .map((node) => (node as HTMLAnchorElement).href)
          .find((href) => /linkedin\.com\/(feed\/update\/(activity|share):|posts|pulse)\//i.test(href)) || ""
        const key = dataUrn || linkHref || rawText.slice(0, 160)
        if (!key || seen.has(key)) continue
        seen.add(key)

        let author = "Unknown"
        let authorTitle = ""
        for (const selector of authorSelectors) {
          const node = card.querySelector(selector)
          const text = (node?.textContent || "").trim()
          if (text) {
            author = text.split(/\n+/)[0].replace(/\s+/g, " ").trim()
            break
          }
        }

        const lines = rawText.split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean)
        if (lines.length > 1) authorTitle = lines[1] || ""

        let originalText = ""
        for (const selector of textSelectors) {
          const node = card.querySelector(selector)
          const text = (node?.textContent || "").trim()
          if (text.length > 30) {
            originalText = text
            break
          }
        }
        if (!originalText) {
          const bodyText = rawText.trim()
          if (bodyText.length > 30) originalText = bodyText
        }
        if (!originalText || originalText.length < 20) continue

        let linkedinUrl = canonicalUrlFromUrn(dataUrn)
        if (!linkedinUrl && linkHref) linkedinUrl = normalizeLinkedInUrl(linkHref)
        if (!linkedinUrl) linkedinUrl = "https://www.linkedin.com/feed/"

        const reactionsText = Array.from(card.querySelectorAll(reactionSelectors.join(",")))
          .map((node) => (node.textContent || node.getAttribute("aria-label") || "").trim())
          .find(Boolean)
        const commentsText = Array.from(card.querySelectorAll(commentSelectors.join(",")))
          .map((node) => (node.textContent || node.getAttribute("aria-label") || "").trim())
          .find(Boolean)

        const body = rawText.toLowerCase()
        const reactionMatch = body.match(/(?:^|\n|\b)(\d+(?:[.,]\d+)?[kmb]?)\s+(?:reactions?|likes?)\b/)
        const commentMatch = body.match(/(?:^|\n|\b)(\d+(?:[.,]\d+)?[kmb]?)\s+comments?\b/)

        result.push({
          id: Math.random().toString(36).slice(2),
          author,
          authorTitle,
          originalText,
          linkedinUrl,
          reactions: parseCount(reactionsText || reactionMatch?.[1]),
          comments: parseCount(commentsText || commentMatch?.[1]),
          timestamp: "",
        })
      }

      return result
    }, Array.from(seen))

    let added = 0
    for (const post of roundPosts) {
      if (posts.length >= targetCount) break
      posts.push({
        ...post,
        linkedinUrl: normalizeLinkedInUrl(post.linkedinUrl),
      })
      seen.add(post.linkedinUrl || post.id)
      added += 1
    }

    console.log(`[playwright-route] round ${scrollAttempts + 1}: found ${roundPosts.length}, added ${added}, total ${posts.length}`)

    stagnantRounds = added === 0 ? stagnantRounds + 1 : 0
    await page.mouse.wheel(0, 1800)
    await page.waitForTimeout(stagnantRounds > 0 ? 1800 : 900)
    scrollAttempts += 1
  }

  return posts.slice(0, targetCount)
}

async function processViaRefreshApi(req: NextRequest, posts: RawPost[]) {
  const apiUrl = new URL("/api/refresh", req.nextUrl.origin)
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ posts }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Refresh API failed (${response.status}): ${text.slice(0, 200)}`)
  }

  return response.json() as Promise<{ posts: ProcessedPost[] }>
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { count?: number }
  const targetCount = Number(body.count) || DEFAULT_TARGET_COUNT

  const { context, cleanup, mode } = await getBrowserContext()

  try {
    const page = context.pages()[0] || await context.newPage()
    console.log(`[playwright-route] using ${mode === "cdp" ? "attached Chrome" : "persistent Chrome"}`)
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const loginDetected = /login/i.test(page.url()) || await page.locator('input[name="session_key"]').count().catch(() => 0)
    if (loginDetected) {
      await waitForLoginIfNeeded(page, LOGIN_WAIT_MS)
    }

    const rawPosts = await extractPosts(page, targetCount)
    const result = await processViaRefreshApi(req, rawPosts)

    return NextResponse.json({
      success: true,
      scrapedCount: rawPosts.length,
      posts: result.posts,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Playwright scrape route failed:", error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  } finally {
    await cleanup().catch(() => {})
  }
}
