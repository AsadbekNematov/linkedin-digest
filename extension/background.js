// Service worker — orchestrates scraping and sending to dashboard

const DASHBOARD_URL = "http://localhost:3000"
const LINKEDIN_FEED_URL = "https://www.linkedin.com/feed/"

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "START_REFRESH") {
    startRefresh(msg.count || 30).then(sendResponse)
    return true
  }
})

async function startRefresh(count) {
  try {
    // Find or open LinkedIn feed tab
    const tabs = await chrome.tabs.query({ url: "https://www.linkedin.com/feed/*" })
    let tab
    let wasExisting = tabs.length > 0

    if (wasExisting) {
      tab = tabs[0]
      await chrome.tabs.update(tab.id, { active: true })
      // Give the page a moment to be ready
      await new Promise((r) => setTimeout(r, 800))
    } else {
      tab = await chrome.tabs.create({ url: LINKEDIN_FEED_URL, active: true })
      await waitForTabLoad(tab.id)
      // Wait for LinkedIn's JS to render the feed
      await new Promise((r) => setTimeout(r, 4000))
    }

    // Always inject fresh — executeScript handles duplicates fine
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    })

    // Small delay to ensure injection settled
    await new Promise((r) => setTimeout(r, 500))

    // Trigger scraping
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "SCRAPE_FEED",
      count,
    })

    if (!response?.success || !response.posts?.length) {
      return { success: false, error: "No posts found — make sure you're logged into LinkedIn" }
    }

    // Send posts to dashboard API
    const apiResponse = await fetch(`${DASHBOARD_URL}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: response.posts }),
    })

    if (!apiResponse.ok) {
      const text = await apiResponse.text()
      return { success: false, error: `Dashboard API error: ${text.slice(0, 100)}` }
    }

    const result = await apiResponse.json()

    // Write processed posts to localStorage so dashboard picks them up
    const processed = result.posts || []
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // Inject a tiny script into the dashboard tab to update localStorage
    const dashTabs = await chrome.tabs.query({ url: "http://localhost:3000/*" })
    if (dashTabs.length > 0) {
      await chrome.scripting.executeScript({
        target: { tabId: dashTabs[0].id },
        func: (posts, time) => {
          localStorage.setItem("linkedin-digest-posts", JSON.stringify(posts))
          localStorage.setItem("linkedin-digest-refresh", time)
          window.dispatchEvent(new StorageEvent("storage", {
            key: "linkedin-digest-posts",
            newValue: JSON.stringify(posts),
          }))
        },
        args: [processed, now],
      })
    }

    return { success: true, count: processed.length }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }
    chrome.tabs.onUpdated.addListener(listener)
  })
}
