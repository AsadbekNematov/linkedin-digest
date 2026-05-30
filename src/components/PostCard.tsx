"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ExternalLink, ChevronDown, ChevronUp, MessageSquare, Heart, Briefcase, Trophy, Newspaper, Lightbulb, User, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type Post, categoryConfig } from "@/lib/mockData"

const iconMap = { Briefcase, Trophy, Newspaper, Lightbulb, User, Hash }

interface PostCardProps {
  post: Post
  index: number
}

export function PostCard({ post, index }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = categoryConfig[post.category]
  const IconComponent = iconMap[config.icon as keyof typeof iconMap] || Hash

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      className="card-dark p-5 flex flex-col gap-3"
    >
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: post.avatarColor }}
        >
          {post.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{post.author}</p>
          <p className="text-xs truncate" style={{ color: "#6b7280" }}>{post.authorTitle}</p>
        </div>
        <span className="text-xs shrink-0" style={{ color: "#4a4a6a" }}>{post.timestamp}</span>
      </div>

      {/* Category badge */}
      <div className="flex items-center gap-2">
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ color: config.color, background: config.bg }}
        >
          <IconComponent size={11} />
          {config.label}
        </span>
      </div>

      {/* AI Summary */}
      <p className="text-sm leading-relaxed" style={{ color: "#c0c0e0" }}>
        {post.summary}
      </p>

      {/* Original text (expandable) */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-xs leading-relaxed rounded-lg p-3"
          style={{ color: "#8888aa", background: "rgba(255,255,255,0.03)", border: "1px solid #1c1c2e" }}
        >
          {post.originalText}
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs" style={{ color: "#4a4a6a" }}>
            <Heart size={11} /> {post.reactions.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "#4a4a6a" }}>
            <MessageSquare size={11} /> {post.comments.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs transition-colors cursor-pointer"
            style={{ color: "#4a4a6a" }}
          >
            {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Full post</>}
          </button>
          <a
            href={post.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors"
            style={{ color: "#3b82f6", background: "rgba(59,130,246,0.1)" }}
          >
            <ExternalLink size={11} /> LinkedIn
          </a>
        </div>
      </div>
    </motion.div>
  )
}
