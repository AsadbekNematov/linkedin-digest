"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Masonry from "react-masonry-css"
import { Toaster, toast } from "react-hot-toast"
import { Link2 } from "lucide-react"
import confetti from "canvas-confetti"

import { PostCard } from "@/components/PostCard"
import { StatsRings } from "@/components/StatsRings"
import { DailyInsights } from "@/components/DailyInsights"
import { RefreshButton, type Phase } from "@/components/RefreshButton"
import { ParticlesBackground } from "@/components/ParticlesBackground"
import { TypewriterHero } from "@/components/TypewriterHero"
import { ActivityTicker } from "@/components/ActivityTicker"
import { PostDetailPanel } from "@/components/PostDetailPanel"
import { mockPosts, categoryConfig, type Post, type Category } from "@/lib/mockData"

const ALL_CATEGORIES = Object.keys(categoryConfig) as Category[]
const TABS = [
  { id: "all" as const, label: "All" },
  ...ALL_CATEGORIES.map((c) => ({ id: c, label: categoryConfig[c].label })),
]
type TabId = "all" | Category

const MASONRY_COLS = { default: 3, 1280: 3, 1024: 2, 768: 2, 640: 1 }

function groupByTime(posts: Post[]): { label: string; posts: Post[] }[] {
  const groups: Record<string, Post[]> = {
    "Last 2 hours": [],
    "Today": [],
    "Yesterday": [],
    "Earlier": [],
  }
  for (const p of posts) {
    const t = p.timestamp
    if (t.includes("h ago") && parseInt(t) <= 2) groups["Last 2 hours"].push(p)
    else if (t.includes("h ago")) groups["Today"].push(p)
    else if (t === "1d ago") groups["Yesterday"].push(p)
    else groups["Earlier"].push(p)
  }
  return Object.entries(groups)
    .filter(([, ps]) => ps.length > 0)
    .map(([label, ps]) => ({ label, posts: ps }))
}

function fireConfetti() {
  const end = Date.now() + 1200
  const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<TabId>("all")
  const [phase, setPhase] = useState<Phase>("idle")
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
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
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        setLastRefresh(now)
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
    fireConfetti()
    toast.success(`${shuffled.length} posts captured & summarized`, {
      style: {
        background: "rgba(16,16,28,0.95)",
        border: "1px solid rgba(16,185,129,0.3)",
        color: "#6ee7b7",
        backdropFilter: "blur(12px)",
        fontSize: "13px",
      },
      iconTheme: { primary: "#10b981", secondary: "#07070f" },
    })
  }

  const filtered = activeTab === "all" ? posts : posts.filter((p) => p.category === activeTab)
  const timeGroups = groupByTime(filtered)
  const visibleTabs = TABS.filter((t) => t.id === "all" || posts.some((p) => p.category === t.id))

  return (
    <>
      <ParticlesBackground />
      <Toaster position="bottom-right" />
      <PostDetailPanel post={selectedPost} onClose={() => setSelectedPost(null)} />

      <main className="relative min-h-screen">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-40 border-b"
          style={{
            background: "rgba(7,7,15,0.8)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
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
                <h1 className="text-sm font-bold text-white leading-none">LinkedIn Digest</h1>
                <p className="text-xs mt-0.5" style={{ color: "#374151" }}>Your feed, summarized</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
              <RefreshButton phase={phase} onClick={handleRefresh} lastRefresh={lastRefresh} />
            </motion.div>
          </div>

          {/* Activity ticker */}
          {posts.length > 0 && <ActivityTicker posts={posts} />}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Hero */}
          <TypewriterHero />

          {/* Daily Insights */}
          {posts.length > 0 && <DailyInsights posts={posts} />}

          {/* Stats rings */}
          {posts.length > 0 && (
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
              }}
            >
              <p className="text-xs font-semibold mb-5 text-center uppercase tracking-widest" style={{ color: "#374151" }}>
                Feed Breakdown
              </p>
              <StatsRings posts={posts} />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {visibleTabs.map((tab) => {
              const count = tab.id === "all" ? posts.length : posts.filter((p) => p.category === tab.id).length
              const isActive = activeTab === tab.id
              const color = tab.id !== "all" ? categoryConfig[tab.id as Category]?.color : "#f0f0ff"
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                  style={{
                    color: isActive ? (tab.id === "all" ? "#fff" : color) : "#4b5563",
                    background: isActive ? (tab.id === "all" ? "rgba(240,240,255,0.1)" : `${color}15`) : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? (tab.id === "all" ? "rgba(255,255,255,0.2)" : `${color}40`) : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                      style={{ background: isActive ? `${color}25` : "rgba(255,255,255,0.05)", color: isActive ? color : "#374151" }}>
                      {count}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Time-grouped masonry */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {timeGroups.map((group, gi) => (
                <div key={group.label} className="mb-8">
                  {/* Section divider */}
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.1 }}
                    className="flex items-center gap-3 mb-5"
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#374151" }}>
                      {group.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.06), transparent)" }} />
                    <span className="text-xs tabular-nums" style={{ color: "#1f2937" }}>{group.posts.length}</span>
                  </motion.div>

                  <Masonry
                    breakpointCols={MASONRY_COLS}
                    className="flex gap-4"
                    columnClassName="flex flex-col"
                  >
                    {group.posts.map((post, i) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        index={gi * 10 + i}
                        onOpen={setSelectedPost}
                      />
                    ))}
                  </Masonry>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-20" style={{ color: "#374151" }}>
                  <p className="text-lg font-medium">No posts in this category</p>
                  <p className="text-sm mt-1">Try refreshing your feed</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  )
}
