"use client"

import { motion } from "framer-motion"
import { type Post, type Category, categoryConfig } from "@/lib/mockData"

const SHOW: Category[] = [
  "job_opportunity", "career_milestone", "industry_news",
  "thought_leadership", "startup_funding", "product_launch",
  "learning_growth", "event_conference", "congratulations",
]

const SIZE = 72
const STROKE = 6
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

interface StatsRingsProps { posts: Post[] }

function Ring({ category, count, total, index }: { category: Category; count: number; total: number; index: number }) {
  const config = categoryConfig[category]
  const pct = total ? count / total : 0
  const dash = pct * CIRC

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "backOut" }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90" style={{ display: "block" }}>
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={STROKE}
          />
          {/* Fill */}
          <motion.circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={config.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: CIRC - dash }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.9, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${config.color}80)` }}
          />
        </svg>
        {/* Count in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.5 }}
            className="text-lg font-bold"
            style={{ color: config.color }}
          >
            {count}
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-center leading-tight" style={{ color: "#4b5563", maxWidth: 72 }}>
        {config.label}
      </span>
    </motion.div>
  )
}

export function StatsRings({ posts }: StatsRingsProps) {
  const total = posts.length
  const visible = SHOW.filter((c) => posts.some((p) => p.category === c))

  return (
    <div className="flex flex-wrap justify-center gap-6 py-2">
      {visible.map((cat, i) => (
        <Ring
          key={cat}
          category={cat}
          count={posts.filter((p) => p.category === cat).length}
          total={total}
          index={i}
        />
      ))}
    </div>
  )
}
