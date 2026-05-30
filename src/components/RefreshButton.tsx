"use client"

import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Loader2, Sparkles } from "lucide-react"

export type Phase = "idle" | "fetching" | "summarizing"

interface RefreshButtonProps {
  phase: Phase
  onClick: () => void
  lastRefresh: string | null
}

const labels: Record<Phase, string> = {
  idle: "Refresh Feed",
  fetching: "Fetching posts...",
  summarizing: "Summarizing...",
}

export function RefreshButton({ phase, onClick, lastRefresh }: RefreshButtonProps) {
  const isLoading = phase !== "idle"

  return (
    <div className="flex flex-col items-end gap-1.5">
      <motion.button
        onClick={onClick}
        disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.03 } : {}}
        whileTap={!isLoading ? { scale: 0.96 } : {}}
        className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-white overflow-hidden disabled:cursor-not-allowed"
        style={{
          background: isLoading
            ? "rgba(59,130,246,0.15)"
            : "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          border: `1px solid ${isLoading ? "rgba(59,130,246,0.3)" : "rgba(99,102,241,0.5)"}`,
          boxShadow: isLoading ? "none" : "0 0 24px rgba(99,102,241,0.35), 0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        {/* Shimmer sweep when loading */}
        {isLoading && (
          <motion.span
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="relative flex items-center gap-2"
          >
            {phase === "idle"        && <RefreshCw size={14} />}
            {phase === "fetching"    && <Loader2 size={14} className="animate-spin" />}
            {phase === "summarizing" && <Sparkles size={14} />}
            {labels[phase]}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {lastRefresh && (
        <span className="text-xs" style={{ color: "#374151" }}>
          Updated {lastRefresh}
        </span>
      )}
    </div>
  )
}
