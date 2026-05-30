#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline/promises')
const { stdin: input, stdout: output } = require('node:process')
const { chromium } = require('playwright')

const ROOT = process.cwd()
const PROFILE_DIR = path.join(ROOT, '.playwright-profile')
const TARGET_URL = getArgValue('--url') || 'https://www.linkedin.com/feed/'
const TARGET_COUNT = Number(getArgValue('--count') || '15')
const HEADLESS = process.argv.includes('--headless') || process.env.HEADLESS === '1'
const POST_TO_API = !process.argv.includes('--no-post')
const API_URL = process.env.REFRESH_API_URL || 'http://localhost:3000/api/refresh'
const WAIT_AFTER_LOGIN_MS = Number(process.env.WAIT_AFTER_LOGIN_MS || '0')
const CHROME_CDP_URL = getArgValue('--cdp-url') || process.env.PLAYWRIGHT_CDP_URL || ''

async function getBrowserContext() {
  if (CHROME_CDP_URL) {
    const browser = await chromium.connectOverCDP(CHROME_CDP_URL)
    const context = browser.contexts()[0] || await browser.newContext()

    return {
      context,
      cleanup: async () => browser.disconnect(),
      mode: 'cdp',
    }
  }

  fs.mkdirSync(PROFILE_DIR, { recursive: true })
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chrome',
    headless: HEADLESS,
    viewport: { width: 1440, height: 1600 },
    args: ['--disable-blink-features=AutomationControlled'],
  })

  return {
    context,
    cleanup: async () => context.close(),
    mode: 'persistent',
  }
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return ''
  return process.argv[index + 1] || ''
}

function canonicalUrlFromUrn(rawUrn) {
  const urn = String(rawUrn || '').trim()
  if (!urn) return ''

  const normalized = urn.replace(/^urn:li:/i, '')
  const match = normalized.match(/^(activity|share):([^/?#]+)/i)
  if (!match) return ''
  return `https://www.linkedin.com/feed/update/${match[1].toLowerCase()}:${match[2]}/`
}

function normalizeLinkedInUrl(rawUrl) {
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

async function waitForEnter(message) {
  const rl = readline.createInterface({ input, output })
  try {
    await rl.question(`${message}\nPress Enter to continue... `)
  } finally {
    rl.close()
  }
}

async function extractPosts(page, targetCount) {
  const seen = new Set()
  const posts = []
  let stagnantRounds = 0
  let scrollAttempts = 0
  const maxRounds = Math.max(targetCount * 5, 25)

  while (posts.length < targetCount && scrollAttempts < maxRounds && stagnantRounds < 6) {
    const result = await page.evaluate((seenKeys) => {
      const postSelectors = [
        '.feed-shared-update-v2',
        '.occludable-update',
        '[data-urn]',
        'article',
        '[role="article"]',
      ]

      const primary = Array.from(document.querySelectorAll(postSelectors.join(',')))
      const cards = primary.length > 0 ? primary : Array.from(document.querySelectorAll("a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']")).map((anchor) => {
        const seed = anchor.closest('[data-urn], article, [role="article"]') || anchor.parentElement || anchor
        let node = seed
        let depth = 0
        let best = null
        let bestScore = -1

        while (node && depth < 8) {
          const text = (node.innerText || '').trim()
          let score = 0
          if (text.length > 30) score += Math.min(text.length, 600)
          if (node.matches?.('[data-urn], article, [role="article"], .feed-shared-update-v2, .occludable-update')) score += 250
          if (node.querySelector?.("a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']")) score += 100
          if (score > bestScore) {
            bestScore = score
            best = node
          }
          node = node.parentElement
          depth++
        }
        return best
      }).filter(Boolean)

      const compact = []
      const seen = new Set(seenKeys)

      const firstLinkSelectors = "a[href*='/feed/update/activity:'], a[href*='/feed/update/share:'], a[href*='/posts/'], a[href*='/pulse/']"
      const authorSelectors = [
        '.update-components-actor__name span[aria-hidden="true"]',
        '.feed-shared-actor__name span[aria-hidden="true"]',
        '.update-components-actor__name',
        '.feed-shared-actor__name',
        '[data-test-id="actor-name"]',
        '[data-test-id="feed-shared-actor-name"]',
      ]
      const textSelectors = [
        '.feed-shared-update-v2__description',
        '.update-components-text',
        '.feed-shared-text',
        '.update-components-update-v2__commentary',
        '[data-test-id="main-feed-activity-card__commentary"]',
        '[data-test-id="feed-shared-text-view"]',
        '[data-test-id="post-text"]',
      ]

      for (const card of cards) {
        if (!card) continue
        const rawText = card.innerText || card.textContent || ''
        const firstLine = rawText.split(/\n+/)[0]?.trim().toLowerCase() || ''
        if (/^start a post$|^create a post$|^start a conversation$|^write article$|^share a photo$/.test(firstLine)) continue

        const dataUrn = card.getAttribute('data-urn') || card.dataset?.urn || card.querySelector('[data-urn]')?.getAttribute('data-urn') || card.querySelector('[data-urn]')?.dataset?.urn || ''
        const linkEl = Array.from(card.querySelectorAll(firstLinkSelectors)).find(Boolean)
        const linkHref = linkEl?.href || ''
        const key = dataUrn || linkHref || rawText.slice(0, 160)
        if (!key || seen.has(key)) continue
        seen.add(key)

        let author = 'Unknown'
        let authorTitle = ''
        for (const selector of authorSelectors) {
          const node = card.querySelector(selector)
          const text = (node?.innerText || node?.textContent || '').trim()
          if (text) {
            author = text.split(/\n+/)[0].replace(/\s+/g, ' ').trim()
            break
          }
        }
        const lines = rawText.split(/\n+/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
        if (lines.length > 1) authorTitle = lines[1] || ''

        let originalText = ''
        for (const selector of textSelectors) {
          const node = card.querySelector(selector)
          const text = (node?.innerText || node?.textContent || '').trim()
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

        let linkedinUrl = ''
        if (dataUrn) {
          const normalized = dataUrn.replace(/^urn:li:/i, '')
          const match = normalized.match(/^(activity|share):([^/?#]+)/i)
          if (match) linkedinUrl = `https://www.linkedin.com/feed/update/${match[1].toLowerCase()}:${match[2]}/`
        }
        if (!linkedinUrl && linkHref) {
          linkedinUrl = linkHref.replace(/\/(?:reactions|comments)\/?.*$/i, '/')
        }
        if (!linkedinUrl) linkedinUrl = 'https://www.linkedin.com/feed/'

        const text = rawText.toLowerCase()
        const reactionMatch = text.match(/(?:^|\n|\b)(\d+(?:[.,]\d+)?[kmb]?)\s+(?:reactions?|likes?)\b/)
        const commentMatch = text.match(/(?:^|\n|\b)(\d+(?:[.,]\d+)?[kmb]?)\s+comments?\b/)
        const parseCount = (value) => {
          if (!value) return 0
          const normalized = value.toLowerCase()
          const num = Number.parseFloat(normalized.replace(/,/g, ''))
          if (Number.isNaN(num)) return 0
          if (normalized.endsWith('k')) return Math.round(num * 1000)
          if (normalized.endsWith('m')) return Math.round(num * 1000000)
          if (normalized.endsWith('b')) return Math.round(num * 1000000000)
          return Math.round(num)
        }

        compact.push({
          id: Math.random().toString(36).slice(2),
          author,
          authorTitle,
          originalText,
          linkedinUrl,
          reactions: parseCount(reactionMatch?.[1]),
          comments: parseCount(commentMatch?.[1]),
          timestamp: '',
        })
      }

      return { posts: compact }
    }, Array.from(seen))

    const freshPosts = result.posts || []
    let added = 0
    for (const post of freshPosts) {
      if (posts.length >= targetCount) break
      if (!post.linkedinUrl || !post.originalText) continue
      posts.push({
        ...post,
        linkedinUrl: normalizeLinkedInUrl(post.linkedinUrl),
      })
      added += 1
    }

    console.log(`[playwright] round ${scrollAttempts + 1}: found ${freshPosts.length}, added ${added}, total ${posts.length}`)

    if (added === 0) stagnantRounds += 1
    else stagnantRounds = 0

    await page.mouse.wheel(0, 1800)
    await page.waitForTimeout(stagnantRounds > 0 ? 1800 : 900)
    scrollAttempts += 1
  }

  return posts.slice(0, targetCount)
}

async function maybePostToApi(posts) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Refresh API failed (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json()
}

async function main() {
  const { context, cleanup, mode } = await getBrowserContext()

  try {
    const page = context.pages()[0] || await context.newPage()
    console.log(`[playwright] using ${mode === 'cdp' ? 'attached Chrome' : 'persistent Chrome'}`)
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    if (/login/i.test(page.url()) || await page.locator('input[name="session_key"]').count()) {
      console.log('[playwright] LinkedIn login detected. Log in in the opened browser window first.')
      if (WAIT_AFTER_LOGIN_MS > 0) {
        await page.waitForTimeout(WAIT_AFTER_LOGIN_MS)
      } else {
        await waitForEnter('Log into LinkedIn in the browser window, then come back here')
      }
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)
    }

    const posts = await extractPosts(page, TARGET_COUNT)
    console.log(`[playwright] captured ${posts.length} posts`)

    if (process.argv.includes('--dump-json')) {
      console.log(JSON.stringify(posts, null, 2))
    }

    if (POST_TO_API) {
      const processed = await maybePostToApi(posts)
      console.log(`[playwright] summarizer returned ${processed.posts?.length || 0} posts`)
    }
  } finally {
    await cleanup()
  }
}

main().catch((err) => {
  console.error('[playwright] scraper failed:', err)
  process.exitCode = 1
})
