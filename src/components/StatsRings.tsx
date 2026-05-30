"use client"

import { motion } from "framer-motion"
import { type Post, type Category, categoryConfig } from "@/lib/mockData"

const SHOW: Category[] = [
  "job_opportunity", "career_milestone", "industry_news",
  "thought_leadership", "startup_funding", "product_launch",
  "learning_growth", "event_conference", "congratulations", "personal_story",
]

const SIZE = 200
const STROKE = 22
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R
const GAP = 3 // degrees gap between segments

interface StatsRingsProps { posts: Post[] }

function degreesToOffset(degrees: number) {
  return (degrees / 360) * CIRC
}

export function StatsRings({ posts }: StatsRingsProps) {
  const total = posts.length
  if (!total) return null

  const segments = SHOW
    .map((cat) => ({ cat, count: posts.filter((p) => p.category === cat).length }))
    .filter((s) => s.count > 0)

  // Build arc segments
  let cumDeg = 0
  const arcs = segments.map((s) => {
    const deg = (s.count / total) * 360 - GAP
    const offset = CIRC - degreesToOffset(deg)
    const rotation = cumDeg
    cumDeg += (s.count / total) * 360
    return { ...s, deg, offset, rotation }
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      {/* Donut chart */}
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ display: "block" }}>
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={STROKE}
          />
          {/* Segments */}
          {arcs.map((arc, i) => {
            const config = categoryConfig[arc.cat]
            return (
              <motion.circle
                key={arc.cat}
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                stroke={config.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: arc.offset }}
                transition={{ delay: i * 0.07 + 0.1, duration: 0.9, ease: "easeOut" }}
                style={{
                  transformOrigin: `${SIZE / 2}px ${SIZE / 2}px`,
                  transform: `rotate(${arc.rotation - 90}deg)`,
                  filter: `drop-shadow(0 0 5px ${config.color}70)`,
                }}
              />
            )
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-xs mt-0.5" style={{ color: "#4b5563" }}>posts</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
        {arcs.map((arc, i) => {
          const config = categoryConfig[arc.cat]
          const pct = Math.round((arc.count / total) * 100)
          return (
            <motion.div
              key={arc.cat}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 + 0.2 }}
              className="flex items-center gap-2.5"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: config.color,
                  boxShadow: `0 0 6px ${config.color}80`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate" style={{ color: "#9ca3af" }}>
                    {config.label}
                  </span>
                  <span className="text-xs font-bold shrink-0" style={{ color: config.color }}>
                    {arc.count}
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="mt-1 h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: config.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.06 + 0.4, duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
