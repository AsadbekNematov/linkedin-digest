"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ExternalLink, ChevronDown, ChevronUp, MessageSquare, Heart,
  Briefcase, TrendingUp, Newspaper, Lightbulb, Rocket, Zap,
  BookOpen, Calendar, Trophy, User2, Hash,
} from "lucide-react"
import { type Post, categoryConfig } from "@/lib/mockData"

const iconMap = {
  Briefcase, TrendingUp, Newspaper, Lightbulb, Rocket, Zap,
  BookOpen, Calendar, Trophy, Heart, Hash, User2,
}

interface PostCardProps {
  post: Post
  index: number
}

export function PostCard({ post, index }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = categoryConfig[post.category] ?? categoryConfig["personal_story"]
  const IconComponent = iconMap[config.icon as keyof typeof iconMap] ?? Hash

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col gap-4 p-5 rounded-2xl overflow-hidden cursor-default"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Glow accent on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(400px circle at 50% 0%, ${config.color}12, transparent 60%)`,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${config.color}60, transparent)` }}
      />

      {/* Author row */}
      <div className="relative flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${post.avatarColor}, ${post.avatarColor}99)`,
            boxShadow: `0 4px 12px ${post.avatarColor}40`,
          }}
        >
          {post.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{post.author}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: "#6b7280" }}>{post.authorTitle}</p>
        </div>
        <span className="text-xs shrink-0 tabular-nums" style={{ color: "#374151" }}>{post.timestamp}</span>
      </div>

      {/* Category badge */}
      <div className="relative">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}30` }}
        >
          <IconComponent size={10} strokeWidth={2.5} />
          {config.label}
        </span>
      </div>

      {/* AI Summary */}
      <p className="relative text-sm leading-relaxed" style={{ color: "#c8c8e8" }}>
        {post.summary}
      </p>

      {/* Expanded original text */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="relative text-xs leading-relaxed rounded-xl p-3.5 overflow-hidden"
            style={{
              color: "#6b7280",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {post.originalText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="relative flex items-center justify-between pt-1 mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#374151" }}>
            <Heart size={11} /> {post.reactions.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#374151" }}>
            <MessageSquare size={11} /> {post.comments.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs transition-colors cursor-pointer hover:text-white"
            style={{ color: "#4b5563" }}
          >
            {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Full post</>}
          </button>
          <a
            href={post.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all hover:scale-105"
            style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}30` }}
          >
            <ExternalLink size={10} /> View
          </a>
        </div>
      </div>
    </motion.div>
  )
}
