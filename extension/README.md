# LinkedIn Digest — Chrome Extension

## Setup

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select this `extension/` folder

## Usage

1. Make sure the dashboard is running: `npm run dev` in the project root
2. Add your Anthropic API key to `.env.local`
3. Click the extension icon in Chrome
4. Set how many posts to collect (default: 30)
5. Click **Refresh Feed Now**
   - Extension opens your LinkedIn feed
   - Scrolls and collects posts automatically
   - Sends them to Claude for summarization
   - Redirects you to the dashboard with results

## How it works

```
Popup click
  → background.js opens linkedin.com/feed
  → content.js scrolls + scrapes posts
  → background.js POSTs raw posts to localhost:3000/api/refresh
  → API calls Claude Haiku to categorize + summarize
  → Dashboard updates via localStorage
```
