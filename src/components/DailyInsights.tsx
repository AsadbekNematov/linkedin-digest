"use client"

import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Users, Zap, Rocket, BookOpen } from "lucide-react"
import { type Post } from "@/lib/mockData"

interface DailyInsightsProps { posts: Post[] }

export function DailyInsights({ posts }: DailyInsightsProps) {
  const jobCount       = posts.filter((p) => p.category === "job_opportunity").length
  const milestoneCount = posts.filter((p) => p.category === "career_milestone").length
  const newsCount      = posts.filter((p) => p.category === "industry_news").length
  const startupCount   = posts.filter((p) => p.category === "startup_funding").length
  const learningCount  = posts.filter((p) => p.category === "learning_growth").length
  const launchCount    = posts.filter((p) => p.category === "product_launch").length

  const chips = [
    jobCount       > 0 && { icon: TrendingUp, text: `${jobCount} open role${jobCount > 1 ? "s" : ""}`,          color: "#3b82f6" },
    milestoneCount > 0 && { icon: Users,      text: `${milestoneCount} career win${milestoneCount > 1 ? "s" : ""}`, color: "#10b981" },
    newsCount      > 0 && { icon: Zap,        text: `${newsCount} industry update${newsCount > 1 ? "s" : ""}`,   color: "#f59e0b" },
    startupCount   > 0 && { icon: Rocket,     text: `${startupCount} startup highlight${startupCount > 1 ? "s" : ""}`, color: "#06b6d4" },
    learningCount  > 0 && { icon: BookOpen,   text: `${learningCount} learning insight${learningCount > 1 ? "s" : ""}`, color: "#a855f7" },
    launchCount    > 0 && { icon: Zap,        text: `${launchCount} product launch${launchCount > 1 ? "es" : ""}`, color: "#f97316" },
  ].filter(Boolean) as { icon: typeof TrendingUp; text: string; color: string }[]

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(600px circle at 30% 50%, rgba(59,130,246,0.06), transparent 60%)",
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(400px circle at 70% 50%, rgba(139,92,246,0.06), transparent 60%)",
      }} />

      <div className="relative flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "rgba(59,130,246,0.15)" }}>
          <Sparkles size={14} style={{ color: "#3b82f6" }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "#9ca3af" }}>
          Today&apos;s Digest — {posts.length} post{posts.length !== 1 ? "s" : ""} captured
        </span>
      </div>

      <div className="relative flex flex-wrap gap-2">
        {chips.map((chip, i) => {
          const Icon = chip.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm"
              style={{
                color: chip.color,
                background: `${chip.color}12`,
                border: `1px solid ${chip.color}25`,
              }}
            >
              <Icon size={13} strokeWidth={2.5} />
              {chip.text}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
