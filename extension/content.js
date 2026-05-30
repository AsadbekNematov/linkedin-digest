// Runs on linkedin.com/feed — scrapes visible posts from the DOM

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const TARGET_COUNT_KEY = "linkedin-digest-target-count"
const DEBUG = true
const PRIMARY_POST_SELECTORS = ".feed-shared-update-v2, .occludable-update, [data-urn], article, [role='article']"
const POST_LINK_SELECTORS = "a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']"
const FALLBACK_CONTAINER_SELECTORS = "[data-urn], article, [role='article'], .feed-shared-update-v2, .occludable-update"

function log(...args) {
  if (DEBUG) console.log("[LinkedIn Digest][content]", ...args)
}

function logGroup(label, details) {
  if (!DEBUG) return
  console.groupCollapsed(`[LinkedIn Digest][content] ${label}`)
  if (typeof details !== "undefined") console.log(details)
  console.groupEnd()
}

function getFeedRoot() {
  return document.querySelector("main") || document.body
}

function findFallbackContainer(anchor) {
  let node = anchor
  let depth = 0
  let bestNode = null
  let bestScore = -1

  while (node && depth < 8) {
    const text = node.innerText?.trim() || ""
    const hasStructure = node.matches?.(FALLBACK_CONTAINER_SELECTORS) ||
      node.querySelector?.(".feed-shared-actor__name, .update-components-actor__name, .feed-shared-text, .update-components-text, [data-test-id='post-text'], [data-test-id='feed-shared-text-view']")
    const hasUsefulText = text.length > 30

    let score = 0
    if (hasUsefulText) score += Math.min(text.length, 600)
    if (hasStructure) score += 250
    if (node.querySelector?.("a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']")) score += 100
    if (node.matches?.("main, section, div")) score += 10

    if (score > bestScore) {
      bestScore = score
      bestNode = node
    }

    if (hasStructure && hasUsefulText && text.length > 60) return node
    node = node.parentElement
    depth++
  }

  return bestNode
}

function collectCandidateArticles() {
  const primary = Array.from(document.querySelectorAll(PRIMARY_POST_SELECTORS))
  if (primary.length > 0) return { source: "primary", articles: primary }

  const anchors = Array.from(document.querySelectorAll(POST_LINK_SELECTORS))
  const anchorsDetails = anchors.slice(0, 8).map((a) => ({ href: a.href, outerHTML: (a.outerHTML || "").slice(0, 800) }))
  const seen = new Set()
  const fallback = []

  for (const anchor of anchors.slice(0, 200)) {
    const seed = anchor.closest("[data-urn], article, [role='article']") || anchor.parentElement || anchor
    const container = findFallbackContainer(seed)
    if (!container || seen.has(container)) continue
    seen.add(container)
    fallback.push(container)
  }

  return { source: "fallback-links", articles: fallback, anchorsFound: anchors.length, anchorsDetails }
}

function scrapePostKey(article) {
  const firstLink = article.querySelector("a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']")?.href
  return (
    article.getAttribute("data-urn") ||
    firstLink ||
    article.innerText?.trim().slice(0, 160) ||
    null
  )
}

function cleanPostText(rawText) {
  const lines = (rawText || "")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const noisePatterns = [
    /^follow$/i,
    /^promoted$/i,
    /^suggested$/i,
    /^likes this$/i,
    /^commented on this$/i,
    /^reposted this$/i,
    /^loves this$/i,
    /^celebrates this$/i,
    /^\d+[hmwd]$/i,
    /^\d+[hmwd] ago$/i,
    /^edited$/i,
    /^see more$/i,
  ]

  const filtered = lines.filter((line) => !noisePatterns.some((pattern) => pattern.test(line)))
  return filtered.join("\n").trim()
}

function normalizeLinkedInUrl(rawUrl) {
  if (!rawUrl) return "https://www.linkedin.com/feed/"

  try {
    const url = new URL(rawUrl, "https://www.linkedin.com")
    url.hash = ""
    url.search = ""

    const reactionMatch = url.pathname.match(/^(\/feed\/update\/[^/]+)(?:\/(?:reactions|comments)\/?.*)?$/)
    if (reactionMatch) {
      url.pathname = `${reactionMatch[1]}/`
      return url.toString()
    }

    url.pathname = url.pathname.replace(/\/(?:reactions|comments)\/?.*$/i, "/")
    return url.toString()
  } catch {
    return String(rawUrl).replace(/\/(?:reactions|comments)\/?.*$/i, "/")
  }
}

function normalizeCountText(rawText) {
  const text = (rawText || "").trim().toLowerCase()
  if (!text) return 0
  if (text === "like" || text === "likes" || text === "reaction" || text === "reactions") return 0

  const compactMatch = text.match(/(\d+(?:[.,]\d+)?)([kmb])?/) 
  if (!compactMatch) return 0

  const value = Number.parseFloat(compactMatch[1].replace(/,/g, ""))
  if (Number.isNaN(value)) return 0

  const suffix = compactMatch[2]
  if (suffix === "k") return Math.round(value * 1000)
  if (suffix === "m") return Math.round(value * 1000000)
  if (suffix === "b") return Math.round(value * 1000000000)
  return Math.round(value)
}

function inferAuthorAndTitle(article, rawText) {
  const selectors = [
    ".update-components-actor__name span[aria-hidden='true']",
    ".feed-shared-actor__name span[aria-hidden='true']",
    ".update-components-actor__name",
    ".feed-shared-actor__name",
    "[data-test-id='actor-name']",
    "[data-test-id='feed-shared-actor-name']",
  ]

  for (const selector of selectors) {
    const node = article.querySelector(selector)
    const text = cleanPostText(node?.innerText || node?.textContent || "")
    if (text) {
      const name = text.split(/\n+/)[0].replace(/\s+/g, " ").trim()
      if (name && name.length <= 80) return { author: name, authorTitle: "" }
    }
  }

  const lines = (rawText || "")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const noisePatterns = [
    /^follow$/i,
    /^promoted$/i,
    /^suggested$/i,
    /^likes this$/i,
    /^commented on this$/i,
    /^reposted this$/i,
    /^loves this$/i,
    /^celebrates this$/i,
    /^\d+[hmwd]$/i,
    /^\d+[hmwd] ago$/i,
    /^edited$/i,
    /^see more$/i,
  ]

  const bodyIndex = lines.findIndex((line) => !noisePatterns.some((pattern) => pattern.test(line)))
  const author = bodyIndex >= 0 ? lines[bodyIndex] : "Unknown"
  const authorTitle = bodyIndex >= 0 ? lines[bodyIndex + 1] || "" : ""

  return {
    author: author || "Unknown",
    authorTitle,
  }
}

function inferSocialCounts(article, rawText) {
  const selectorCandidates = [
    ".social-details-social-counts__reactions-count",
    ".social-details-social-counts__comments",
    ".feed-shared-social-action-bar__action-count",
    "[data-test-id='social-actions-reactions-count']",
    "[data-test-id='social-actions-comments-count']",
    "[aria-label*='reactions']",
    "[aria-label*='reaction']",
    "[aria-label*='comment']",
  ]

  const textCandidates = Array.from(article.querySelectorAll(selectorCandidates.join(",")))
    .map((node) => cleanPostText(node.innerText || node.textContent || node.getAttribute("aria-label") || ""))
    .filter(Boolean)

  let reactions = 0
  let comments = 0

  for (const text of textCandidates) {
    const lower = text.toLowerCase()
    if (!reactions && /(reaction|reactions|like|likes)/.test(lower)) reactions = normalizeCountText(lower)
    if (!comments && /comment/.test(lower)) comments = normalizeCountText(lower)
  }

  const bodyText = (rawText || "").toLowerCase()
  if (!reactions) {
    const match = bodyText.match(/(?:^|\n|\b)(\d+(?:[.,]\d+)?[kmb]?)\s+(?:reactions?|likes?)\b/)
    reactions = match ? normalizeCountText(match[1]) : 0
  }
  if (!comments) {
    const match = bodyText.match(/(?:^|\n|\b)(\d+(?:[.,]\d+)?[kmb]?)\s+comments?\b/)
    comments = match ? normalizeCountText(match[1]) : 0
  }

  return { reactions, comments }
}

function extractPostText(article) {
  const selectors = [
    ".feed-shared-update-v2__description",
    ".update-components-text",
    ".feed-shared-text",
    ".update-components-update-v2__commentary",
    "[data-test-id='main-feed-activity-card__commentary']",
    "[data-test-id='feed-shared-text-view']",
    "[data-test-id='post-text']",
  ]

  for (const selector of selectors) {
    const node = article.querySelector(selector)
    if (!node) continue

    const directText = cleanPostText(node.innerText || node.textContent || "")
    if (directText.length > 30) return directText
  }

  const fallbackText = cleanPostText(article.innerText || article.textContent || "")
  if (fallbackText.length > 30) return fallbackText

  return ""
}

async function scrapePost(article) {
  try {
    const rawArticleText = article.innerText || article.textContent || ""

    const { author, authorTitle } = inferAuthorAndTitle(article, rawArticleText)

    // Post text — expand "see more" if possible
    const seeMoreBtn = article.querySelector(".feed-shared-inline-show-more-text__see-more-less-toggle, .see-more")
    if (seeMoreBtn) {
      seeMoreBtn.click()
      await sleep(120)
    }

    const originalText = extractPostText(article)
    if (!originalText || originalText.length < 20) {
      log("No usable text extracted", {
        author,
        title: authorTitle,
        articlePreview: rawArticleText.slice(0, 200) || "",
      })
      return null
    }

    // Post URL — try to find the permalink
    const linkEl = article.querySelector("a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']")
    const linkedinUrl = normalizeLinkedInUrl(linkEl?.href || "https://www.linkedin.com/feed/")

    // Reactions count
    const { reactions, comments } = inferSocialCounts(article, rawArticleText)

    // Timestamp
    const timeEl = article.querySelector(
      ".update-components-actor__sub-description span[aria-hidden='true'], .feed-shared-actor__sub-description span[aria-hidden='true']"
    )
    const timestamp = timeEl?.innerText?.trim() || ""

    return {
      id: Math.random().toString(36).slice(2),
      author,
      authorTitle,
      originalText,
      linkedinUrl,
      reactions,
      comments,
      timestamp,
    }
  } catch {
    log("Failed to scrape a post node")
    return null
  }
}

async function scrollAndCollect(targetCount = 30) {
  const seen = new Set()
  const posts = []
  let scrollAttempts = 0
  let stagnantRounds = 0
  const maxScrolls = Math.max(targetCount * 4, 24)

  log("Starting scrape", { targetCount, maxScrolls, url: location.href })

  while (posts.length < targetCount && scrollAttempts < maxScrolls && stagnantRounds < 5) {
    const { source, articles, anchorsFound } = collectCandidateArticles()
    let addedThisRound = 0

    log("Scan round", {
      round: scrollAttempts + 1,
      source,
      articlesFound: articles.length,
      anchorsFound: anchorsFound || 0,
      seenCount: seen.size,
      collectedCount: posts.length,
    })

    if (articles.length === 0) {
      const feedRoot = getFeedRoot()
      logGroup("No candidate nodes found", {
        feedRootTag: feedRoot?.tagName,
        feedRootChildren: feedRoot?.children?.length || 0,
        bodyChildren: document.body?.children?.length || 0,
        anchorsWithPostLinks: document.querySelectorAll(POST_LINK_SELECTORS).length,
        sampleBodyText: document.body?.innerText?.slice(0, 500) || "",
        anchorsSample: (typeof anchorsDetails !== 'undefined') ? anchorsDetails : undefined,
      })
    }

    for (const article of articles) {
      const key = scrapePostKey(article)
      if (!key) {
        log("Skipping candidate without key", {
          preview: article.innerText?.trim().slice(0, 120) || "",
        })
        continue
      }
      if (seen.has(key)) continue
      seen.add(key)

      const post = await scrapePost(article)
      if (post && post.originalText.length > 30) {
        posts.push(post)
        addedThisRound += 1
        log("Captured post", {
          author: post.author,
          authorTitle: post.authorTitle,
          textPreview: post.originalText.slice(0, 120),
          reactions: post.reactions,
          comments: post.comments,
          timestamp: post.timestamp,
        })
      } else {
        log("Skipped candidate after scrape", {
          keyPreview: String(key).slice(0, 120),
          textPreview: article.innerText?.trim().slice(0, 120) || "",
        })
      }
    }

    if (posts.length >= targetCount) break

    stagnantRounds = addedThisRound === 0 ? stagnantRounds + 1 : 0

    log("Scrolling", {
      addedThisRound,
      stagnantRounds,
      scrollAttempts: scrollAttempts + 1,
      collectedCount: posts.length,
    })

    window.scrollBy({ top: Math.max(window.innerHeight * 1.6, 1000), behavior: "instant" })
    await sleep(stagnantRounds > 0 ? 2200 : 1400)
    scrollAttempts++
  }

  logGroup("Scrape complete", {
    targetCount,
    actualCount: posts.length,
    source: posts.length > 0 ? "captured" : "empty",
    sample: posts.slice(0, 3),
  })

  return posts.slice(0, targetCount)
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "PING") {
    log("Ping received")
    sendResponse({ success: true })
    return false
  }

  if (msg.action === "SCRAPE_FEED") {
    log("SCRAPE_FEED received", { count: msg.count || 30 })
    scrollAndCollect(msg.count || 30).then((posts) => {
      log("SCRAPE_FEED resolved", { count: posts.length })
      sendResponse({ success: true, posts })
    })
    return true // keep channel open for async
  }
})

if (location.hostname === "localhost") {
  const syncTargetCountToPage = (count) => {
    const nextCount = Number(count) || 30
    localStorage.setItem(TARGET_COUNT_KEY, String(nextCount))
    window.dispatchEvent(new CustomEvent("linkedin-digest-target-count-sync", {
      detail: { count: nextCount },
    }))
    log("Synced target count to dashboard", { nextCount })
  }

  chrome.storage.local.get([TARGET_COUNT_KEY]).then((result) => {
    if (typeof result[TARGET_COUNT_KEY] !== "undefined") {
      syncTargetCountToPage(result[TARGET_COUNT_KEY])
    }
  })

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[TARGET_COUNT_KEY]) return
    syncTargetCountToPage(changes[TARGET_COUNT_KEY].newValue)
  })

  window.addEventListener("linkedin-digest-target-count-change", (event) => {
    const count = Number(event.detail?.count) || 30
    chrome.storage.local.set({ [TARGET_COUNT_KEY]: count })
    syncTargetCountToPage(count)
  })

  window.addEventListener("linkedin-digest-start-refresh", async (event) => {
    const count = event.detail?.count || 30
    log("Dashboard requested refresh", { count })

    try {
      const response = await chrome.runtime.sendMessage({
        action: "START_REFRESH",
        count,
      })

      log("Refresh completed", response)
      window.dispatchEvent(new CustomEvent("linkedin-digest-refresh-complete", {
        detail: response,
      }))
    } catch (error) {
      log("Refresh failed", error)
      window.dispatchEvent(new CustomEvent("linkedin-digest-refresh-complete", {
        detail: { success: false, error: error?.message || String(error) },
      }))
    }
  })
}
