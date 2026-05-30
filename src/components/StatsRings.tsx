"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
const GAP = 3

interface StatsRingsProps {
  posts: Post[]
  activeCategory: Category | null
  onSelect: (cat: Category | null) => void
}

function degreesToOffset(degrees: number) {
  return (degrees / 360) * CIRC
}

export function StatsRings({ posts, activeCategory, onSelect }: StatsRingsProps) {
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

  // What to show in center: hover > selected > total
  const focusedCat = hovered ?? activeCategory
  const focusedArc = focusedCat ? arcs.find((a) => a.cat === focusedCat) : null

  return (
    <div
      className="flex flex-col md:flex-row items-center gap-8"
      onMouseLeave={() => setHovered(null)}
    >
      {/* Donut */}
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ display: "block" }}>
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={STROKE}
          />

          {arcs.map((arc, i) => {
            const config = categoryConfig[arc.cat]
            const isHovered  = hovered === arc.cat
            const isSelected = activeCategory === arc.cat
            const isFocused  = isHovered || isSelected
            const isDimmed   = (activeCategory !== null && !isSelected && hovered === null) ||
                               (hovered !== null && !isHovered)

            return (
              <motion.circle
                key={arc.cat}
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                stroke={config.color}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{
                  strokeDashoffset: arc.offset,
                  strokeWidth: isFocused ? STROKE + 4 : STROKE,
                  opacity: isDimmed ? 0.2 : 1,
                }}
                transition={{
                  strokeDashoffset: { delay: i * 0.07 + 0.1, duration: 0.9, ease: "easeOut" },
                  strokeWidth: { duration: 0.15 },
                  opacity: { duration: 0.15 },
                }}
                style={{
                  transformOrigin: `${SIZE / 2}px ${SIZE / 2}px`,
                  transform: `rotate(${arc.rotation - 90}deg)`,
                  filter: isFocused
                    ? `drop-shadow(0 0 7px ${config.color}bb)`
                    : `drop-shadow(0 0 4px ${config.color}55)`,
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHovered(arc.cat)}
                onClick={() => onSelect(isSelected ? null : arc.cat)}
              />
            )
          })}

          {/* Center click-to-clear zone */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R - STROKE - 2}
            fill="transparent"
            style={{ cursor: activeCategory ? "pointer" : "default" }}
            onMouseEnter={() => setHovered(null)}
            onClick={() => onSelect(null)}
          />
        </svg>

        {/* Center label — animates between total and focused category */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {focusedArc ? (
              <motion.div
                key={focusedArc.cat}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center text-center px-3"
              >
                <span className="text-2xl font-bold" style={{ color: categoryConfig[focusedArc.cat].color }}>
                  {focusedArc.count}
                </span>
                <span className="text-[10px] mt-0.5 leading-tight" style={{ color: categoryConfig[focusedArc.cat].color + "99" }}>
                  {categoryConfig[focusedArc.cat].label}
                </span>
                <span className="text-[10px] mt-1" style={{ color: "#4b5563" }}>
                  {Math.round((focusedArc.count / total) * 100)}%
                </span>
                {activeCategory === focusedArc.cat && (
                  <span className="text-[9px] mt-1.5 px-1.5 py-0.5 rounded-full" style={{ background: `${categoryConfig[focusedArc.cat].color}20`, color: categoryConfig[focusedArc.cat].color }}>
                    filtered
                  </span>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
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
          const isHovered  = hovered === arc.cat
          const isSelected = activeCategory === arc.cat
          const isFocused  = isHovered || isSelected
          const isDimmed   = (activeCategory !== null && !isSelected && hovered === null) ||
                             (hovered !== null && !isHovered)

          return (
            <motion.div
              key={arc.cat}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: isDimmed ? 0.3 : 1, x: 0 }}
              transition={{ opacity: { duration: 0.15 }, x: { delay: i * 0.06 + 0.2 } }}
              className="flex items-center gap-2.5 rounded-lg p-1.5 -m-1.5 cursor-pointer"
              style={{ background: isFocused ? `${config.color}0e` : "transparent" }}
              onMouseEnter={() => setHovered(arc.cat)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(isSelected ? null : arc.cat)}
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                animate={{ scale: isFocused ? 1.4 : 1 }}
                transition={{ duration: 0.15 }}
                style={{
                  background: config.color,
                  boxShadow: isFocused ? `0 0 8px ${config.color}` : `0 0 5px ${config.color}60`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate" style={{ color: isFocused ? "#f0f0ff" : "#9ca3af" }}>
                    {config.label}
                  </span>
                  <span className="text-xs font-bold shrink-0" style={{ color: config.color }}>
                    {arc.count}
                  </span>
                </div>
                <div className="mt-1 h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: config.color, opacity: isFocused ? 1 : 0.55 }}
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
