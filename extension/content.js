// Runs on linkedin.com/feed — scrapes visible posts from the DOM

function scrapePost(article) {
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
    if (seeMoreBtn) seeMoreBtn.click()

    const textEl = article.querySelector(
      ".feed-shared-update-v2__description span[dir='ltr'], .update-components-text span[dir='ltr'], .feed-shared-text span[dir='ltr']"
    )
    const originalText = textEl?.innerText?.trim() || ""
    if (!originalText || originalText.length < 20) return null

    // Post URL — try to find the permalink
    const linkEl = article.querySelector(
      "a[href*='/feed/update/'], a[href*='/posts/'], a[href*='/pulse/']"
    )
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
  } catch (e) {
    return null
  }
}

async function scrollAndCollect(targetCount = 30) {
  const seen = new Set()
  const posts = []
  let scrollAttempts = 0
  const maxScrolls = 20

  while (posts.length < targetCount && scrollAttempts < maxScrolls) {
    const articles = document.querySelectorAll(
      ".feed-shared-update-v2, .occludable-update, [data-urn]"
    )

    for (const article of articles) {
      const key = article.getAttribute("data-urn") || article.innerText?.slice(0, 80)
      if (!key || seen.has(key)) continue
      seen.add(key)

      const post = scrapePost(article)
      if (post && post.originalText.length > 30) {
        posts.push(post)
      }
    }

    if (posts.length >= targetCount) break

    window.scrollBy(0, 1200)
    await new Promise((r) => setTimeout(r, 1800))
    scrollAttempts++
  }

  return posts.slice(0, targetCount)
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "SCRAPE_FEED") {
    scrollAndCollect(msg.count || 30).then((posts) => {
      sendResponse({ success: true, posts })
    })
    return true // keep channel open for async
  }
})
