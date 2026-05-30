"use client"

import { motion } from "framer-motion"
import { Briefcase, Trophy, Newspaper, Lightbulb, User, Hash, LayoutGrid } from "lucide-react"
import { type Post, type Category } from "@/lib/mockData"

interface StatsBarProps {
  posts: Post[]
}

const stats = [
  { label: "Total", category: null as Category | null, icon: LayoutGrid, color: "#f0f0ff" },
  { label: "Jobs", category: "job_opportunity" as Category, icon: Briefcase, color: "#3b82f6" },
  { label: "Congrats", category: "congratulations" as Category, icon: Trophy, color: "#10b981" },
  { label: "News", category: "industry_news" as Category, icon: Newspaper, color: "#f59e0b" },
  { label: "Insights", category: "thought_leadership" as Category, icon: Lightbulb, color: "#8b5cf6" },
  { label: "Personal", category: "personal_update" as Category, icon: User, color: "#ec4899" },
]

export function StatsBar({ posts }: StatsBarProps) {
  const getCount = (cat: Category | null) =>
    cat ? posts.filter((p) => p.category === cat).length : posts.length

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {stats.map((stat, i) => {
        const count = getCount(stat.category)
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="card-dark p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: "#6b7280" }}>{stat.label}</span>
              <Icon size={14} style={{ color: stat.color }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: stat.color }}>{count}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
