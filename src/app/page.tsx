"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link2 } from "lucide-react"
import { PostCard } from "@/components/PostCard"
import { StatsBar } from "@/components/StatsBar"
import { DailyInsights } from "@/components/DailyInsights"
import { RefreshButton } from "@/components/RefreshButton"
import { mockPosts, type Post, type Category } from "@/lib/mockData"

const TABS = [
  { id: "all", label: "All" },
  { id: "job_opportunity", label: "Jobs" },
  { id: "congratulations", label: "Congrats" },
  { id: "industry_news", label: "News" },
  { id: "thought_leadership", label: "Insights" },
  { id: "personal_update", label: "Personal" },
  { id: "other", label: "Other" },
] as const

type TabId = (typeof TABS)[number]["id"]
type Phase = "idle" | "fetching" | "summarizing"

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<TabId>("all")
  const [phase, setPhase] = useState<Phase>("idle")
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("linkedin-digest-posts")
    if (saved) {
      setPosts(JSON.parse(saved))
      setLastRefresh(localStorage.getItem("linkedin-digest-refresh") || null)
    } else {
      setPosts(mockPosts)
      setLastRefresh("just now (demo)")
    }

    // Listen for extension writing new posts via storage event
    const onStorage = (e: StorageEvent) => {
      if (e.key === "linkedin-digest-posts" && e.newValue) {
        setPosts(JSON.parse(e.newValue))
        setLastRefresh(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const handleRefresh = async () => {
    // If Chrome extension is installed, it handles the refresh itself via popup.
    // This button simulates the flow in demo mode (no extension).
    setPhase("fetching")
    await new Promise((r) => setTimeout(r, 1800))
    setPhase("summarizing")
    await new Promise((r) => setTimeout(r, 1500))
    const shuffled = [...mockPosts].sort(() => Math.random() - 0.5)
    setPosts(shuffled)
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    setLastRefresh(now)
    localStorage.setItem("linkedin-digest-posts", JSON.stringify(shuffled))
    localStorage.setItem("linkedin-digest-refresh", now)
    setPhase("idle")
  }

  const filtered =
    activeTab === "all" ? posts : posts.filter((p) => p.category === (activeTab as Category))

  return (
    <main className="min-h-screen" style={{ background: "var(--app-bg)" }}>
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,119,181,0.15)", border: "1px solid rgba(0,119,181,0.3)" }}
            >
              <Link2 size={20} style={{ color: "#0077b5" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LinkedIn Digest</h1>
              <p className="text-xs" style={{ color: "#4a4a6a" }}>Your feed, summarized</p>
            </div>
          </div>
          <RefreshButton phase={phase} onClick={handleRefresh} lastRefresh={lastRefresh} />
        </div>

        {/* Daily Insights */}
        {posts.length > 0 && <DailyInsights posts={posts} />}

        {/* Stats */}
        <StatsBar posts={posts} />

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => {
            const count = tab.id === "all"
              ? posts.length
              : posts.filter((p) => p.category === tab.id).length
            if (tab.id !== "all" && count === 0) return null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{
                  color: activeTab === tab.id ? "#fff" : "#6b7280",
                  background: activeTab === tab.id ? "rgba(59,130,246,0.2)" : "transparent",
                  border: activeTab === tab.id ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: activeTab === tab.id ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)",
                      color: activeTab === tab.id ? "#93c5fd" : "#4a4a6a",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Posts grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filtered.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: "#4a4a6a" }}>
            <p className="text-lg">No posts in this category</p>
          </div>
        )}

      </div>
    </main>
  )
}
