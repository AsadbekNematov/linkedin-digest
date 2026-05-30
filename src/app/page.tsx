"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link2 } from "lucide-react"
import { PostCard } from "@/components/PostCard"
import { StatsBar } from "@/components/StatsBar"
import { DailyInsights } from "@/components/DailyInsights"
import { RefreshButton, type Phase } from "@/components/RefreshButton"
import { ParticlesBackground } from "@/components/ParticlesBackground"
import { mockPosts, categoryConfig, type Post, type Category } from "@/lib/mockData"

const ALL_CATEGORIES = Object.keys(categoryConfig) as Category[]

const TABS = [
  { id: "all" as const, label: "All" },
  ...ALL_CATEGORIES.map((c) => ({ id: c, label: categoryConfig[c].label })),
]

type TabId = "all" | Category

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<TabId>("all")
  const [phase, setPhase] = useState<Phase>("idle")
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)

  useEffect(() => {
    // Clear stale data from old category schema
    const version = localStorage.getItem("linkedin-digest-version")
    if (version !== "2") {
      localStorage.removeItem("linkedin-digest-posts")
      localStorage.removeItem("linkedin-digest-refresh")
      localStorage.setItem("linkedin-digest-version", "2")
    }

    const saved = localStorage.getItem("linkedin-digest-posts")
    if (saved) {
      setPosts(JSON.parse(saved))
      setLastRefresh(localStorage.getItem("linkedin-digest-refresh") || null)
    } else {
      setPosts(mockPosts)
      setLastRefresh("just now (demo)")
    }

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
    setPhase("fetching")
    await new Promise((r) => setTimeout(r, 1800))
    setPhase("summarizing")
    await new Promise((r) => setTimeout(r, 1400))
    const shuffled = [...mockPosts].sort(() => Math.random() - 0.5)
    setPosts(shuffled)
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    setLastRefresh(now)
    localStorage.setItem("linkedin-digest-posts", JSON.stringify(shuffled))
    localStorage.setItem("linkedin-digest-refresh", now)
    setPhase("idle")
  }

  const filtered =
    activeTab === "all" ? posts : posts.filter((p) => p.category === activeTab)

  const visibleTabs = TABS.filter(
    (t) => t.id === "all" || posts.some((p) => p.category === t.id)
  )

  return (
    <>
      <ParticlesBackground />

      <main className="relative min-h-screen">
        {/* Header */}
        <div
          className="sticky top-0 z-50 border-b"
          style={{
            background: "rgba(7,7,15,0.75)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(0,119,181,0.3), rgba(59,130,246,0.2))",
                  border: "1px solid rgba(0,119,181,0.4)",
                  boxShadow: "0 0 16px rgba(0,119,181,0.2)",
                }}
              >
                <Link2 size={16} style={{ color: "#60a5fa" }} />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-none">LinkedIn Digest</h1>
                <p className="text-xs mt-0.5" style={{ color: "#374151" }}>Your feed, summarized</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <RefreshButton phase={phase} onClick={handleRefresh} lastRefresh={lastRefresh} />
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">

          {/* Hero section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center py-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              <span className="text-white">Your network,</span>{" "}
              <span style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                at a glance
              </span>
            </h2>
            <p className="text-base" style={{ color: "#4b5563" }}>
              AI-powered summaries of everything happening in your LinkedIn feed
            </p>
          </motion.div>

          {/* Daily Insights */}
          {posts.length > 0 && <DailyInsights posts={posts} />}

          {/* Stats */}
          <StatsBar posts={posts} />

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {visibleTabs.map((tab) => {
              const count = tab.id === "all"
                ? posts.length
                : posts.filter((p) => p.category === tab.id).length
              const isActive = activeTab === tab.id
              const color = tab.id !== "all" ? categoryConfig[tab.id as Category]?.color : "#f0f0ff"

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer overflow-hidden"
                  style={{
                    color: isActive ? (tab.id === "all" ? "#fff" : color) : "#4b5563",
                    background: isActive
                      ? tab.id === "all" ? "rgba(240,240,255,0.1)" : `${color}15`
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? (tab.id === "all" ? "rgba(255,255,255,0.2)" : `${color}40`) : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                      style={{
                        background: isActive ? `${color}25` : "rgba(255,255,255,0.05)",
                        color: isActive ? color : "#374151",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Posts grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filtered.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-20" style={{ color: "#374151" }}>
              <p className="text-lg font-medium">No posts in this category</p>
              <p className="text-sm mt-1">Try refreshing your feed</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
