"use client"

import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Users, Zap } from "lucide-react"
import { type Post } from "@/lib/mockData"

interface DailyInsightsProps {
  posts: Post[]
}

export function DailyInsights({ posts }: DailyInsightsProps) {
  const jobCount = posts.filter((p) => p.category === "job_opportunity").length
  const congratsCount = posts.filter((p) => p.category === "congratulations").length
  const newsCount = posts.filter((p) => p.category === "industry_news").length

  const insights = [
    jobCount > 0 && { icon: TrendingUp, text: `${jobCount} hiring post${jobCount > 1 ? "s" : ""} in your network`, color: "#3b82f6" },
    congratsCount > 0 && { icon: Users, text: `${congratsCount} milestone${congratsCount > 1 ? "s" : ""} to celebrate`, color: "#10b981" },
    newsCount > 0 && { icon: Zap, text: `${newsCount} industry update${newsCount > 1 ? "s" : ""} worth reading`, color: "#f59e0b" },
  ].filter(Boolean) as { icon: typeof TrendingUp; text: string; color: string }[]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl p-5 border"
      style={{
        background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)",
        borderColor: "rgba(59,130,246,0.2)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} style={{ color: "#3b82f6" }} />
        <span className="text-sm font-semibold" style={{ color: "#a0a0c0" }}>Today&apos;s Digest</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Icon size={14} style={{ color: insight.color }} />
              <span className="text-sm" style={{ color: "#c0c0e0" }}>{insight.text}</span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
