const refreshBtn = document.getElementById("refreshBtn")
const openDashboard = document.getElementById("openDashboard")
const statusEl = document.getElementById("status")
const countInput = document.getElementById("countInput")
const TARGET_COUNT_KEY = "linkedin-digest-target-count"

function log(...args) {
  console.log("[LinkedIn Digest][popup]", ...args)
}

chrome.storage.local.get([TARGET_COUNT_KEY]).then((result) => {
  const savedCount = Number(result[TARGET_COUNT_KEY])
  if (savedCount) countInput.value = String(savedCount)
  log("Loaded saved target count", { savedCount: savedCount || 30 })
})

countInput.addEventListener("input", () => {
  const count = parseInt(countInput.value) || 30
  chrome.storage.local.set({ [TARGET_COUNT_KEY]: count })
  log("Target count changed", { count })
})

function setStatus(msg, type) {
  statusEl.textContent = msg
  statusEl.className = `status show ${type}`
}

function setLoading(phase) {
  if (!phase) {
    refreshBtn.disabled = false
    refreshBtn.innerHTML = "↻ &nbsp;Refresh Feed Now"
    return
  }
  refreshBtn.disabled = true
  const labels = {
    fetching: '<span class="spinner"></span> &nbsp;Fetching LinkedIn...',
    summarizing: '<span class="spinner"></span> &nbsp;Summarizing with AI...',
  }
  refreshBtn.innerHTML = labels[phase] || labels.fetching
}

refreshBtn.addEventListener("click", async () => {
  const count = parseInt(countInput.value) || 30
  chrome.storage.local.set({ [TARGET_COUNT_KEY]: count })

  setLoading("fetching")
  setStatus("Opening LinkedIn and collecting posts...", "info")
  log("Refresh clicked", { count })

  const response = await chrome.runtime.sendMessage({
    action: "START_REFRESH",
    count,
  })

  log("Refresh response", response)

  if (response?.success) {
    setLoading(null)
    setStatus(`✓ Got ${response.count} posts! Dashboard updated.`, "success")
  } else {
    setLoading(null)
    setStatus(`Error: ${response?.error || "Something went wrong"}`, "error")
  }
})

openDashboard.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000" })
})
