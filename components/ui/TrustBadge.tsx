"use client";

import { CheckCircle, Shield, Clock, EyeOff, Sparkles, Crown, Star, Zap, Award, Medal, UserCheck, Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface TrustBadgeProps {
  type: "verified" | "admin-approved" | "last-active" | "trust-score" | "champion" | "hall-of-fame" | "elite";
  value?: string;
  userId?: string;
  score?: number;
  compact?: boolean;
  showLabel?: boolean;
}

const badgeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function TrustBadge({
  type,
  value,
  userId,
  score,
  compact = false,
  showLabel = true,
}: TrustBadgeProps) {
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === "last-active" && userId) {
      fetchPrivacySetting();
    } else {
      setLoading(false);
    }
  }, [type, userId]);

  async function fetchPrivacySetting() {
    try {
      const res = await fetch("/api/settings?category=privacy&key=showLastSeen");
      if (res.ok) {
        const data = await res.json();
        setShowLastSeen(data.showLastSeen !== undefined ? data.showLastSeen : true);
      }
    } catch (error) {
      console.error("Error fetching privacy setting:", error);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Verified Player Badge
  if (type === "verified") {
    return (
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-2.5 py-1 text-xs font-medium text-blue-300 shadow-lg shadow-blue-500/10 ${
          compact ? "px-2 py-0.5 text-[10px]" : ""
        }`}
      >
        <Shield size={compact ? 10 : 12} className="text-blue-400" />
        <span>{showLabel ? "Verified Player" : "Verified"}</span>
        {!compact && (
          <motion.span
            variants={pulseVariants}
            animate="pulse"
            className="h-1.5 w-1.5 rounded-full bg-blue-400"
          />
        )}
      </motion.div>
    );
  }

  // ✅ Admin Approved Badge
  if (type === "admin-approved") {
    return (
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`inline-flex items-center gap-1.5 rounded-full border border-green-400/20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-2.5 py-1 text-xs font-medium text-green-300 shadow-lg shadow-green-500/10 ${
          compact ? "px-2 py-0.5 text-[10px]" : ""
        }`}
      >
        <CheckCircle size={compact ? 10 : 12} className="text-green-400" />
        <span>{showLabel ? "Admin Approved" : "Approved"}</span>
      </motion.div>
    );
  }

  // ✅ Trust Score Badge
  if (type === "trust-score" && score !== undefined) {
    const getScoreColor = () => {
      if (score >= 80) return "text-green-400 border-green-400/20 bg-green-500/20";
      if (score >= 60) return "text-yellow-400 border-yellow-400/20 bg-yellow-500/20";
      if (score >= 40) return "text-orange-400 border-orange-400/20 bg-orange-500/20";
      return "text-red-400 border-red-400/20 bg-red-500/20";
    };

    const getScoreEmoji = () => {
      if (score >= 80) return "🌟";
      if (score >= 60) return "⭐";
      if (score >= 40) return "💫";
      return "⚡";
    };

    return (
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-lg ${getScoreColor()} ${
          compact ? "px-2 py-0.5 text-[10px]" : ""
        }`}
      >
        <UserCheck size={compact ? 10 : 12} className={getScoreColor().split(" ")[0]} />
        <span>
          {getScoreEmoji()} {score}
        </span>
        {!compact && <span className="text-[10px] opacity-70">Trust Score</span>}
      </motion.div>
    );
  }

  // ✅ Champion Badge
  if (type === "champion") {
    return (
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-2.5 py-1 text-xs font-medium text-yellow-300 shadow-lg shadow-yellow-500/20 ${
          compact ? "px-2 py-0.5 text-[10px]" : ""
        }`}
      >
        <Crown size={compact ? 10 : 12} className="text-yellow-400" />
        <span>{showLabel ? "🏆 Champion" : "Champion"}</span>
      </motion.div>
    );
  }

  // ✅ Hall of Fame Badge
  if (type === "hall-of-fame") {
    return (
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`inline-flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-2.5 py-1 text-xs font-medium text-purple-300 shadow-lg shadow-purple-500/20 ${
          compact ? "px-2 py-0.5 text-[10px]" : ""
        }`}
      >
        <Star size={compact ? 10 : 12} className="text-purple-400" />
        <span>{showLabel ? "🌟 Hall of Fame" : "Hall of Fame"}</span>
      </motion.div>
    );
  }

  // ✅ Elite Badge
  if (type === "elite") {
    return (
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-2.5 py-1 text-xs font-medium text-indigo-300 shadow-lg shadow-indigo-500/20 ${
          compact ? "px-2 py-0.5 text-[10px]" : ""
        }`}
      >
        <Zap size={compact ? 10 : 12} className="text-indigo-400" />
        <span>{showLabel ? "⚡ Elite Player" : "Elite"}</span>
      </motion.div>
    );
  }

  // ✅ Last Active - with privacy check
  if (type === "last-active" && value) {
    if (loading) {
      return (
        <div className="inline-flex h-6 w-16 animate-pulse rounded-full bg-gray-700/50" />
      );
    }

    if (!showLastSeen) {
      return (
        <motion.div
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-500 ${
            compact ? "px-2 py-0.5 text-[10px]" : ""
          }`}
        >
          <EyeOff size={compact ? 10 : 12} />
          <span>Hidden</span>
        </motion.div>
      );
    }

    const days = Math.floor(
      (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)
    );

    let label = "Active";
    let color = "text-green-400 border-green-400/20 bg-green-500/20";
    let emoji = "🟢";

    if (days > 30) {
      label = "Inactive";
      color = "text-red-400 border-red-400/20 bg-red-500/20";
      emoji = "🔴";
    } else if (days > 7) {
      label = "Away";
      color = "text-yellow-400 border-yellow-400/20 bg-yellow-500/20";
      emoji = "🟡";
    } else if (days > 1) {
      label = "Recent";
      color = "text-blue-400 border-blue-400/20 bg-blue-500/20";
      emoji = "🔵";
    }

    return (
      <motion.div
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-lg ${color} ${
          compact ? "px-2 py-0.5 text-[10px]" : ""
        }`}
      >
        <Clock size={compact ? 10 : 12} className={color.split(" ")[0]} />
        <span>
          {emoji} {label}
        </span>
        {!compact && days > 0 && (
          <span className="text-[10px] opacity-70">({days}d)</span>
        )}
      </motion.div>
    );
  }

  return null;
}