"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { type Post, categoryConfig } from "@/lib/mockData"

interface ActivityTickerProps {
  posts: Post[]
}

function tickerText(post: Post): string {
  const config = categoryConfig[post.category]
  switch (post.category) {
    case "job_opportunity":   return `${post.author} is hiring · `
    case "career_milestone":  return `${post.author} hit a milestone · `
    case "industry_news":     return `${post.author} shared industry news · `
    case "thought_leadership":return `${post.author} shared an insight · `
    case "startup_funding":   return `${post.author} announced funding · `
    case "product_launch":    return `${post.author} launched something · `
    case "learning_growth":   return `${post.author} shared a lesson · `
    case "event_conference":  return `${post.author} posted about an event · `
    case "congratulations":   return `${post.author} shared a congrats · `
    default: return `${post.author} posted · `
  }
}

export function ActivityTicker({ posts }: ActivityTickerProps) {
  if (!posts.length) return null

  // Duplicate for seamless loop
  const items = [...posts, ...posts].map((p, i) => ({ post: p, key: i }))

  return (
    <div
      className="w-full overflow-hidden border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center">
        {/* Live badge */}
        <div
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-r z-10"
          style={{
            background: "rgba(7,7,15,0.9)",
            borderColor: "rgba(255,255,255,0.07)",
            color: "#10b981",
          }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          LIVE
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: posts.length * 4, repeat: Infinity, ease: "linear" }}
          >
            {items.map(({ post, key }) => {
              const config = categoryConfig[post.category]
              return (
                <span key={key} className="inline-flex items-center text-xs px-1" style={{ color: "#4b5563" }}>
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-2 shrink-0"
                    style={{ background: config?.color ?? "#4b5563" }}
                  />
                  <span style={{ color: "#9ca3af" }}>{tickerText(post)}</span>
                </span>
              )
            })}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
