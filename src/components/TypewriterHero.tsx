"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const CYCLES = ["at a glance", "this week", "summarized", "just for you", "in seconds"]

export function TypewriterHero() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % CYCLES.length)
    }, 2600)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="text-center py-8"
    >
      <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
        <span className="text-white">Your network,</span>
        <br />
        <span className="inline-flex items-center gap-0" style={{
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="inline-block"
            >
              {CYCLES[index]}
            </motion.span>
          </AnimatePresence>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="ml-1 text-5xl font-light"
            style={{ WebkitTextFillColor: "#8b5cf6" }}
          >
            |
          </motion.span>
        </span>
      </h2>
      <p className="text-base md:text-lg" style={{ color: "#4b5563" }}>
        AI-powered summaries of everything happening in your LinkedIn feed
      </p>
    </motion.div>
  )
}
