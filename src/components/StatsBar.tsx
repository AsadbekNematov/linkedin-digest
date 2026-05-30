"use client"

import { motion } from "framer-motion"
import {
  LayoutGrid, Briefcase, TrendingUp, Newspaper, Lightbulb,
  Rocket, Zap, BookOpen, Calendar, Trophy, Heart,
} from "lucide-react"
import { type Post, type Category, categoryConfig } from "@/lib/mockData"

const iconMap = { LayoutGrid, Briefcase, TrendingUp, Newspaper, Lightbulb, Rocket, Zap, BookOpen, Calendar, Trophy, Heart }

const STATS: { label: string; category: Category | null; icon: string; color: string }[] = [
  { label: "All Posts", category: null, icon: "LayoutGrid", color: "#f0f0ff" },
  { label: "Jobs",      category: "job_opportunity",   icon: "Briefcase",  color: "#3b82f6" },
  { label: "Milestones",category: "career_milestone",  icon: "TrendingUp", color: "#10b981" },
  { label: "News",      category: "industry_news",     icon: "Newspaper",  color: "#f59e0b" },
  { label: "Insights",  category: "thought_leadership",icon: "Lightbulb",  color: "#8b5cf6" },
  { label: "Startups",  category: "startup_funding",   icon: "Rocket",     color: "#06b6d4" },
  { label: "Launches",  category: "product_launch",    icon: "Zap",        color: "#f97316" },
  { label: "Learning",  category: "learning_growth",   icon: "BookOpen",   color: "#a855f7" },
  { label: "Events",    category: "event_conference",  icon: "Calendar",   color: "#eab308" },
  { label: "Congrats",  category: "congratulations",   icon: "Trophy",     color: "#ec4899" },
]

interface StatsBarProps { posts: Post[] }

export function StatsBar({ posts }: StatsBarProps) {
  const getCount = (cat: Category | null) =>
    cat ? posts.filter((p) => p.category === cat).length : posts.length

  const visibleStats = STATS.filter((s) => s.category === null || getCount(s.category) > 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-3">
      {visibleStats.map((stat, i) => {
        const count = getCount(stat.category)
        const Icon = iconMap[stat.icon as keyof typeof iconMap]
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            whileHover={{ scale: 1.05 }}
            className="relative flex flex-col gap-2 p-4 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: `radial-gradient(circle at 0% 0%, ${stat.color}30, transparent 70%)` }}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-medium truncate" style={{ color: "#4b5563" }}>{stat.label}</span>
              <Icon size={13} style={{ color: stat.color }} />
            </div>
            <span className="relative text-2xl font-bold tracking-tight" style={{ color: stat.color }}>
              {count}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
