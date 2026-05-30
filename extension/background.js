// Service worker — orchestrates scraping and sending to dashboard

const DASHBOARD_URL = "http://localhost:3000"
const LINKEDIN_FEED_URL = "https://www.linkedin.com/feed/"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const DEBUG = true

function log(...args) {
  if (DEBUG) console.log("[LinkedIn Digest][background]", ...args)
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "START_REFRESH") {
    startRefresh(msg.count || 30).then(sendResponse)
    return true
  }
})

async function startRefresh(count) {
  try {
    log("START_REFRESH received", { count })
    const tab = await openLinkedInFeedTab()
    await ensureFeedScraperReady(tab.id)

    // Trigger scraping
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "SCRAPE_FEED",
      count,
    })

    log("Scraper returned", {
      success: response?.success,
      count: response?.posts?.length || 0,
      firstPost: response?.posts?.[0]?.author,
    })

    if (!response?.success || !response.posts?.length) {
      log("No posts captured")
      return { success: false, error: "No posts found — make sure you're logged into LinkedIn" }
    }

    // Send posts to dashboard API
    const apiResponse = await fetch(`${DASHBOARD_URL}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: response.posts }),
    })

    log("Refresh API response", { ok: apiResponse.ok, status: apiResponse.status })

    if (!apiResponse.ok) {
      const text = await apiResponse.text()
      log("Refresh API error body", text)
      return { success: false, error: `Dashboard API error: ${text.slice(0, 100)}` }
    }

    const result = await apiResponse.json()

    const processed = result.posts || []
    const dashboardTab = await openOrFocusDashboardTab()
    await syncDashboardTab(dashboardTab.id, processed)

    log("Dashboard synced", { count: processed.length, dashboardTabId: dashboardTab.id })

    return { success: true, count: processed.length }
  } catch (err) {
    log("Refresh failed", err)
    return { success: false, error: err?.message || String(err) }
  }
}

async function openLinkedInFeedTab() {
  const tabs = await chrome.tabs.query({ url: "https://www.linkedin.com/feed/*" })

  if (tabs.length > 0) {
    const tab = tabs[0]
    await chrome.tabs.update(tab.id, { active: true })
    await sleep(800)
    log("Using existing LinkedIn feed tab", { tabId: tab.id })
    return tab
  }

  const tab = await chrome.tabs.create({ url: LINKEDIN_FEED_URL, active: true })
  await waitForTabLoad(tab.id)
  await sleep(4000)
  log("Opened new LinkedIn feed tab", { tabId: tab.id })
  return tab
}

async function ensureFeedScraperReady(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "PING" })
    log("Scraper already active", { tabId })
    return
  } catch {
    // If the tab existed before the extension content script was injected, load it once here.
  }

  log("Injecting scraper into LinkedIn tab", { tabId })
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  })

  await sleep(500)
}

async function openOrFocusDashboardTab() {
  const tabs = await chrome.tabs.query({ url: "http://localhost:3000/*" })

  if (tabs.length > 0) {
    const tab = tabs[0]
    await chrome.tabs.update(tab.id, { active: true })
    log("Using existing dashboard tab", { tabId: tab.id })
    return tab
  }

  const tab = await chrome.tabs.create({ url: DASHBOARD_URL, active: true })
  await waitForTabLoad(tab.id)
  await sleep(250)
  log("Opened new dashboard tab", { tabId: tab.id })
  return tab
}

async function syncDashboardTab(tabId, posts) {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (capturedPosts, refreshTime) => {
      localStorage.setItem("linkedin-digest-version", "2")
      localStorage.setItem("linkedin-digest-posts", JSON.stringify(capturedPosts))
      localStorage.setItem("linkedin-digest-refresh", refreshTime)
      window.dispatchEvent(new CustomEvent("linkedin-digest-sync", {
        detail: {
          posts: capturedPosts,
          refreshTime,
        },
      }))
    },
    args: [posts, now],
  })

  log("Dashboard storage updated", { tabId, count: posts.length, now })
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
