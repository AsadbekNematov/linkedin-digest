"use client"

import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Loader2, Sparkles } from "lucide-react"

type Phase = "idle" | "fetching" | "summarizing"

interface RefreshButtonProps {
  phase: Phase
  onClick: () => void
  lastRefresh: string | null
}

const labels: Record<Phase, string> = {
  idle: "Refresh Feed",
  fetching: "Fetching posts...",
  summarizing: "Summarizing with AI...",
}

export function RefreshButton({ phase, onClick, lastRefresh }: RefreshButtonProps) {
  const isLoading = phase !== "idle"

  return (
    <div className="flex flex-col items-end gap-1.5">
      <motion.button
        onClick={onClick}
        disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.97 } : {}}
        className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:cursor-not-allowed overflow-hidden"
        style={{
          background: isLoading
            ? "rgba(59,130,246,0.2)"
            : "linear-gradient(135deg, #3b82f6, #2563eb)",
          color: "#fff",
          border: "1px solid rgba(59,130,246,0.4)",
          boxShadow: isLoading ? "none" : "0 4px 20px rgba(59,130,246,0.3)",
        }}
      >
        {/* shimmer on loading */}
        {isLoading && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {phase === "idle" && <RefreshCw size={14} />}
            {phase === "fetching" && <Loader2 size={14} className="animate-spin" />}
            {phase === "summarizing" && <Sparkles size={14} />}
            {labels[phase]}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {lastRefresh && (
        <span className="text-xs" style={{ color: "#4a4a6a" }}>
          Last refreshed {lastRefresh}
        </span>
      )}
    </div>
  )
}
