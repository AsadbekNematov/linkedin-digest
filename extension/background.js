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

    if (tabs.length > 0) {
      tab = tabs[0]
      await chrome.tabs.update(tab.id, { active: true })
    } else {
      tab = await chrome.tabs.create({ url: LINKEDIN_FEED_URL, active: true })
      // Wait for page to load
      await waitForTabLoad(tab.id)
      await new Promise((r) => setTimeout(r, 2500))
    }

    // Inject content script if not already there
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      })
    } catch (_) {
      // Already injected, fine
    }

    // Trigger scraping
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "SCRAPE_FEED",
      count,
    })

    if (!response?.success || !response.posts?.length) {
      return { success: false, error: "No posts scraped" }
    }

    // Send posts to dashboard API
    const apiResponse = await fetch(`${DASHBOARD_URL}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: response.posts }),
    })

    if (!apiResponse.ok) {
      return { success: false, error: "Dashboard API error" }
    }

    const result = await apiResponse.json()
    return { success: true, count: result.posts?.length || 0 }
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
