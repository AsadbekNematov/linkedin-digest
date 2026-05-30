"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
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
import { mockPosts, type Post, type Category } from "@/lib/mockData"

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

function readDigestState() {
  if (typeof window === "undefined") {
    return { posts: mockPosts, lastRefresh: "just now (demo)" }
  }

  const saved = localStorage.getItem("linkedin-digest-posts")
  if (saved) {
    return {
      posts: JSON.parse(saved) as Post[],
      lastRefresh: localStorage.getItem("linkedin-digest-refresh") || null,
    }
  }

  return { posts: mockPosts, lastRefresh: "just now (demo)" }
}

function subscribeToDigestState(callback: () => void) {
  if (typeof window === "undefined") return () => {}

  const handler = () => callback()
  window.addEventListener("storage", handler)
  window.addEventListener("linkedin-digest-sync", handler)

  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener("linkedin-digest-sync", handler)
  }
}

function getDigestSnapshot() {
  return JSON.stringify(readDigestState())
}

export default function Home() {
  const digestSnapshot = useSyncExternalStore(subscribeToDigestState, getDigestSnapshot, getDigestSnapshot)
  const { posts, lastRefresh } = JSON.parse(digestSnapshot) as {
    posts: Post[]
    lastRefresh: string | null
  }

  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [targetCount, setTargetCount] = useState(() => {
    if (typeof window === "undefined") return 30
    return Number(localStorage.getItem("linkedin-digest-target-count")) || 30
  })

  useEffect(() => {
    const handleCountSync = (event: Event) => {
      const detail = (event as CustomEvent<{ count?: number }>).detail
      const nextCount = Number(detail?.count) || 30
      setTargetCount(nextCount)
      localStorage.setItem("linkedin-digest-target-count", String(nextCount))
    }

    window.addEventListener("linkedin-digest-target-count-sync", handleCountSync)
    return () => window.removeEventListener("linkedin-digest-target-count-sync", handleCountSync)
  }, [])

  useEffect(() => {
    const handleComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ success?: boolean; count?: number; error?: string }>).detail

      if (!detail) return

      setPhase("idle")

      if (detail.success) {
        const capturedCount = detail.count ?? posts.length
        fireConfetti()
        setPhase("idle")
        toast.success(`${capturedCount} posts captured & summarized`, {
          style: {
            background: "rgba(16,16,28,0.95)",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "#6ee7b7",
            backdropFilter: "blur(12px)",
            fontSize: "13px",
          },
          iconTheme: { primary: "#10b981", secondary: "#07070f" },
        })
      } else {
        setPhase("idle")
        toast.error(detail.error || "Refresh failed", {
          style: {
            background: "rgba(16,16,28,0.95)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            backdropFilter: "blur(12px)",
            fontSize: "13px",
          },
        })
      }
    }

    window.addEventListener("linkedin-digest-refresh-complete", handleComplete)
    return () => window.removeEventListener("linkedin-digest-refresh-complete", handleComplete)
  }, [posts.length])

  const handleRefresh = async () => {
    setPhase("fetching")
    window.dispatchEvent(
      new CustomEvent("linkedin-digest-start-refresh", {
        detail: { count: targetCount },
      })
    )
    setPhase("summarizing")
  }

  const filtered = activeCategory ? posts.filter((p) => p.category === activeCategory) : posts
  const timeGroups = groupByTime(filtered)

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
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "#374151" }}>
                      Posts to collect
                    </span>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={targetCount}
                      onChange={(event) => {
                        const nextCount = Number(event.target.value) || 30
                        setTargetCount(nextCount)
                        localStorage.setItem("linkedin-digest-target-count", String(nextCount))
                        window.dispatchEvent(new CustomEvent("linkedin-digest-target-count-change", {
                          detail: { count: nextCount },
                        }))
                      }}
                      className="w-24 rounded-xl px-3 py-2 text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f0f0ff",
                      }}
                    />
                  </div>
                  <RefreshButton phase={phase} onClick={handleRefresh} lastRefresh={lastRefresh} />
                </div>
                {phase !== "idle" && (
                  <span className="text-xs" style={{ color: "#6b7280" }}>
                    {phase === "fetching" && "Handing request to the extension..."}
                    {phase === "summarizing" && "Waiting for LinkedIn scrape and AI summary..."}
                  </span>
                )}
              </div>
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
              <StatsRings posts={posts} activeCategory={activeCategory} onSelect={setActiveCategory} />
            </div>
          )}

          {/* Time-grouped masonry */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory ?? "all"}
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
