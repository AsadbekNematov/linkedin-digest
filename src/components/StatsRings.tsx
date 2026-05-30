"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { type Post, type Category, categoryConfig } from "@/lib/mockData"

const SHOW: Category[] = [
  "job_opportunity", "career_milestone", "industry_news",
  "thought_leadership", "startup_funding", "product_launch",
  "learning_growth", "event_conference", "congratulations", "personal_story",
]

const SIZE = 220
const STROKE = 24
const STROKE_HOVER = 30
const R = (SIZE - STROKE_HOVER) / 2
const CIRC = 2 * Math.PI * R
const GAP = 2.5

interface StatsRingsProps { posts: Post[] }

function degreesToOffset(degrees: number) {
  return (degrees / 360) * CIRC
}

export function StatsRings({ posts }: StatsRingsProps) {
  const [hovered, setHovered] = useState<Category | null>(null)
  const total = posts.length
  if (!total) return null

  const segments = SHOW
    .map((cat) => ({ cat, count: posts.filter((p) => p.category === cat).length }))
    .filter((s) => s.count > 0)

  let cumDeg = 0
  const arcs = segments.map((s) => {
    const deg = (s.count / total) * 360 - GAP
    const offset = CIRC - degreesToOffset(deg)
    const rotation = cumDeg
    cumDeg += (s.count / total) * 360
    return { ...s, deg, offset, rotation }
  })

  const activeArc = hovered ? arcs.find((a) => a.cat === hovered) : null

  return (
    <div className="flex flex-col md:flex-row items-center gap-10">

      {/* Donut */}
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE} height={SIZE}
          style={{ display: "block" }}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={STROKE}
          />
          {/* Invisible center hit area to reset hover */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R - STROKE}
            fill="transparent"
            style={{ cursor: "default" }}
            onMouseEnter={() => setHovered(null)}
          />

          {arcs.map((arc, i) => {
            const config = categoryConfig[arc.cat]
            const isHovered = hovered === arc.cat
            const isDimmed = hovered !== null && !isHovered

            return (
              <motion.circle
                key={arc.cat}
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                stroke={config.color}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC, strokeWidth: STROKE }}
                animate={{
                  strokeDashoffset: arc.offset,
                  strokeWidth: isHovered ? STROKE_HOVER : STROKE,
                  opacity: isDimmed ? 0.25 : 1,
                }}
                transition={{
                  strokeDashoffset: { delay: i * 0.07 + 0.1, duration: 0.9, ease: "easeOut" },
                  strokeWidth: { duration: 0.2 },
                  opacity: { duration: 0.2 },
                }}
                style={{
                  transformOrigin: `${SIZE / 2}px ${SIZE / 2}px`,
                  transform: `rotate(${arc.rotation - 90}deg)`,
                  filter: isHovered
                    ? `drop-shadow(0 0 12px ${config.color})`
                    : `drop-shadow(0 0 4px ${config.color}60)`,
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHovered(arc.cat)}
              />
            )
          })}
        </svg>

        {/* Center — changes on hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {activeArc ? (
              <motion.div
                key={activeArc.cat}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center"
              >
                <span
                  className="text-3xl font-bold"
                  style={{ color: categoryConfig[activeArc.cat].color }}
                >
                  {activeArc.count}
                </span>
                <span
                  className="text-xs mt-0.5 text-center leading-tight px-4"
                  style={{ color: categoryConfig[activeArc.cat].color + "aa", maxWidth: 110 }}
                >
                  {categoryConfig[activeArc.cat].label}
                </span>
                <span className="text-xs mt-1" style={{ color: "#374151" }}>
                  {Math.round((activeArc.count / total) * 100)}%
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center"
              >
                <span className="text-3xl font-bold text-white">{total}</span>
                <span className="text-xs mt-0.5" style={{ color: "#4b5563" }}>posts</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
        {arcs.map((arc, i) => {
          const config = categoryConfig[arc.cat]
          const pct = Math.round((arc.count / total) * 100)
          const isHovered = hovered === arc.cat
          const isDimmed = hovered !== null && !isHovered

          return (
            <motion.div
              key={arc.cat}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: isDimmed ? 0.35 : 1, x: 0 }}
              transition={{ opacity: { duration: 0.15 }, x: { delay: i * 0.06 + 0.2 } }}
              className="flex items-center gap-2.5 cursor-pointer rounded-lg p-1.5 -m-1.5 transition-colors"
              style={{ background: isHovered ? `${config.color}10` : "transparent" }}
              onMouseEnter={() => setHovered(arc.cat)}
              onMouseLeave={() => setHovered(null)}
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                animate={{ scale: isHovered ? 1.5 : 1 }}
                transition={{ duration: 0.15 }}
                style={{
                  background: config.color,
                  boxShadow: isHovered ? `0 0 10px ${config.color}` : `0 0 5px ${config.color}60`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate" style={{ color: isHovered ? "#f0f0ff" : "#9ca3af" }}>
                    {config.label}
                  </span>
                  <span className="text-xs font-bold shrink-0" style={{ color: config.color }}>
                    {arc.count}
                  </span>
                </div>
                <div className="mt-1 h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: config.color }}
                    animate={{ width: isHovered ? `${pct}%` : `${pct}%`, opacity: isHovered ? 1 : 0.6 }}
                    initial={{ width: 0 }}
                    transition={{ width: { delay: i * 0.06 + 0.4, duration: 0.7, ease: "easeOut" }, opacity: { duration: 0.15 } }}
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
