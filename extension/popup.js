const refreshBtn = document.getElementById("refreshBtn")
const openDashboard = document.getElementById("openDashboard")
const statusEl = document.getElementById("status")
const countInput = document.getElementById("countInput")

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

  setLoading("fetching")
  setStatus("Opening LinkedIn and collecting posts...", "info")

  const response = await chrome.runtime.sendMessage({
    action: "START_REFRESH",
    count,
  })

  if (response?.success) {
    setLoading(null)
    setStatus(`✓ Got ${response.count} posts! Dashboard updated.`, "success")
    // Auto-open dashboard after success
    setTimeout(() => {
      chrome.tabs.create({ url: "http://localhost:3000" })
    }, 800)
  } else {
    setLoading(null)
    setStatus(`Error: ${response?.error || "Something went wrong"}`, "error")
  }
})

openDashboard.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000" })
})
