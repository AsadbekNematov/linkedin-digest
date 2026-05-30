"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  X, ExternalLink, Heart, MessageSquare,
  Briefcase, TrendingUp, Newspaper, Lightbulb, Rocket, Zap,
  BookOpen, Calendar, Trophy, Hash,
} from "lucide-react"
import { type Post, categoryConfig } from "@/lib/mockData"

const iconMap = { Briefcase, TrendingUp, Newspaper, Lightbulb, Rocket, Zap, BookOpen, Calendar, Trophy, Hash }

interface PostDetailPanelProps {
  post: Post | null
  onClose: () => void
}

export function PostDetailPanel({ post, onClose }: PostDetailPanelProps) {
  return (
    <AnimatePresence>
      {post && (() => {
        const config = categoryConfig[post.category] ?? categoryConfig["personal_story"]
        const Icon = iconMap[config.icon as keyof typeof iconMap] ?? Hash
        return (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
              style={{
                width: "min(480px, 100vw)",
                background: "rgba(10,10,20,0.96)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Accent glow at top */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${config.color}80, transparent)` }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${config.color}15, transparent 70%)` }}
              />

              {/* Header */}
              <div className="relative flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <span
                  className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}30` }}
                >
                  <Icon size={11} strokeWidth={2.5} />
                  {config.label}
                </span>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#6b7280" }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Content */}
              <div className="relative flex-1 overflow-y-auto p-5 flex flex-col gap-6 scrollbar-thin">
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${post.avatarColor}, ${post.avatarColor}99)`,
                      boxShadow: `0 4px 16px ${post.avatarColor}40`,
                    }}
                  >
                    {post.avatarInitials}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{post.author}</p>
                    <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{post.authorTitle}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#374151" }}>{post.timestamp}</p>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="rounded-xl p-4" style={{ background: `${config.color}0d`, border: `1px solid ${config.color}20` }}>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: config.color }}>AI Summary</p>
                  <p className="text-sm leading-relaxed text-white">{post.summary}</p>
                </div>

                {/* Full post */}
                <div>
                  <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: "#374151" }}>Full Post</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#9ca3af" }}>
                    {post.originalText}
                  </p>
                </div>

                {/* Engagement */}
                <div className="flex items-center gap-4 py-4 border-t border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <Heart size={16} style={{ color: "#ec4899" }} />
                    <span className="text-sm font-semibold text-white">{post.reactions.toLocaleString()}</span>
                    <span className="text-xs" style={{ color: "#374151" }}>reactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} style={{ color: "#3b82f6" }} />
                    <span className="text-sm font-semibold text-white">{post.comments.toLocaleString()}</span>
                    <span className="text-xs" style={{ color: "#374151" }}>comments</span>
                  </div>
                </div>

                {/* CTA */}
                <a
                  href={post.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                    boxShadow: `0 4px 20px ${config.color}40`,
                  }}
                >
                  <ExternalLink size={14} />
                  View on LinkedIn
                </a>
              </div>
            </motion.div>
          </>
        )
      })()}
    </AnimatePresence>
  )
}
