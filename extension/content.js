// Runs on linkedin.com/feed — scrapes visible posts from the DOM

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const TARGET_COUNT_KEY = "linkedin-digest-target-count"
const DEBUG = true
const PRIMARY_POST_SELECTORS = ".feed-shared-update-v2, .occludable-update, [data-urn], article, [role='article']"
const POST_LINK_SELECTORS = "a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']"

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

  while (node && depth < 8) {
    const text = node.innerText?.trim() || ""
    const hasUsefulText = text.length > 120
    const hasStructure =
      node.matches?.("[data-urn], article, [role='article'], .feed-shared-update-v2, .occludable-update") ||
      node.querySelector?.(".feed-shared-actor__name, .update-components-actor__name, .feed-shared-text, .update-components-text, [data-test-id='post-text'], [data-test-id='feed-shared-text-view']")

    if (hasUsefulText && hasStructure) return node
    if (hasUsefulText && !bestNode) bestNode = node
    node = node.parentElement
    depth++
  }

  return bestNode
}

function collectCandidateArticles() {
  const primary = Array.from(document.querySelectorAll(PRIMARY_POST_SELECTORS))
  if (primary.length > 0) return { source: "primary", articles: primary }

  const anchors = Array.from(document.querySelectorAll(POST_LINK_SELECTORS))
  const seen = new Set()
  const fallback = []

  for (const anchor of anchors.slice(0, 200)) {
    const seed = anchor.closest("[data-urn], article, [role='article']") || anchor.parentElement || anchor
    const container = findFallbackContainer(seed)
    if (!container || seen.has(container)) continue
    seen.add(container)
    fallback.push(container)
  }

  return { source: "fallback-links", articles: fallback, anchorsFound: anchors.length }
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
    // Author name
    const authorEl = article.querySelector(
      ".update-components-actor__name span[aria-hidden='true'], .feed-shared-actor__name span[aria-hidden='true']"
    )
    const author = authorEl?.innerText?.trim() || "Unknown"

    // Author title/headline
    const titleEl = article.querySelector(
      ".update-components-actor__description span[aria-hidden='true'], .feed-shared-actor__description span[aria-hidden='true']"
    )
    const authorTitle = titleEl?.innerText?.trim() || ""

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
        articlePreview: article.innerText?.slice(0, 200) || "",
      })
      return null
    }

    // Post URL — try to find the permalink
    const linkEl = article.querySelector("a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']")
    const linkedinUrl = linkEl?.href || "https://www.linkedin.com/feed/"

    // Reactions count
    const reactionsEl = article.querySelector(
      ".social-details-social-counts__reactions-count, .feed-shared-social-action-bar__action-count"
    )
    const reactionsText = reactionsEl?.innerText?.trim() || "0"
    const reactions = parseInt(reactionsText.replace(/[^0-9]/g, "")) || 0

    // Comments count
    const commentsEl = article.querySelector(
      ".social-details-social-counts__comments, .feed-shared-social-action-bar__action-count:last-child"
    )
    const commentsText = commentsEl?.innerText?.trim() || "0"
    const comments = parseInt(commentsText.replace(/[^0-9]/g, "")) || 0

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
