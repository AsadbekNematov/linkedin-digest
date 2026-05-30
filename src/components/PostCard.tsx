"use client"

import { motion } from "framer-motion"
import {
  MessageSquare, Heart, Flame,
  Briefcase, TrendingUp, Newspaper, Lightbulb, Rocket, Zap,
  BookOpen, Calendar, Trophy, Hash,
} from "lucide-react"
import { type Post, categoryConfig } from "@/lib/mockData"

const iconMap = { Briefcase, TrendingUp, Newspaper, Lightbulb, Rocket, Zap, BookOpen, Calendar, Trophy, Hash }

const HOT_THRESHOLD = 3000

interface PostCardProps {
  post: Post
  index: number
  onOpen: (post: Post) => void
}

export function PostCard({ post, index, onOpen }: PostCardProps) {
  const config = categoryConfig[post.category] ?? categoryConfig["personal_story"]
  const Icon = iconMap[config.icon as keyof typeof iconMap] ?? Hash
  const isHot = post.reactions >= HOT_THRESHOLD

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -5, transition: { duration: 0.18 } }}
      onClick={() => onOpen(post)}
      className="group relative flex flex-col gap-4 p-5 rounded-2xl overflow-hidden cursor-pointer break-inside-avoid"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: isHot
          ? `1px solid ${config.color}50`
          : "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: isHot
          ? `0 0 28px ${config.color}22, 0 4px 24px rgba(0,0,0,0.4)`
          : "0 4px 24px rgba(0,0,0,0.3)",
        marginBottom: "1rem",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(400px circle at 50% 0%, ${config.color}12, transparent 60%)` }}
      />

      {/* Hot glow pulse ring */}
      {isHot && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: `inset 0 0 0 1px ${config.color}40` }}
        />
      )}

      {/* Top accent line */}
      <div
        className="absolute top-0 left-8 right-8 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${config.color}70, transparent)` }}
      />

      {/* Author row */}
      <div className="relative flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
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
        <div className="flex items-center gap-1.5 shrink-0">
          {isHot && (
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md"
              style={{ color: "#f97316", background: "rgba(249,115,22,0.12)" }}
            >
              <Flame size={10} strokeWidth={2.5} /> Hot
            </motion.span>
          )}
          <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{post.timestamp}</span>
        </div>
      </div>

      {/* Category badge */}
      <div className="relative">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}30` }}
        >
          <Icon size={10} strokeWidth={2.5} />
          {config.label}
        </span>
      </div>

      {/* AI Summary */}
      <p className="relative text-sm leading-relaxed" style={{ color: "#c8c8e8" }}>
        {post.summary}
      </p>

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
        <span
          className="text-xs px-2.5 py-1 rounded-lg"
          style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}30` }}
        >
          Read more →
        </span>
      </div>
    </motion.div>
  )
}
