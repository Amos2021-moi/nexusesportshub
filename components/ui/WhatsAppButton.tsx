"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  MessageCircle,
  Send,
  Copy,
  Check,
  Sparkles,
  Shield,
  Clock,
  Calendar,
  Users,
  Trophy,
  ExternalLink,
  Phone,
  User,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface WhatsAppButtonProps {
  opponentWhatsApp: string | null;
  opponentWhatsAppVisible: boolean | null;
  opponentName: string;
  fixtureId: string;
  seasonName?: string;
  deadline?: string;
  homePlayer?: string;
  awayPlayer?: string;
  compact?: boolean;
  className?: string;
}

const buttonVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function WhatsAppButton({
  opponentWhatsApp,
  opponentWhatsAppVisible,
  opponentName,
  fixtureId,
  seasonName,
  deadline,
  homePlayer,
  awayPlayer,
  compact = false,
  className = "",
}: WhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Clean WhatsApp number
  let cleanNumber = opponentWhatsApp?.replace(/\s/g, "") || "";
  if (cleanNumber && !cleanNumber.startsWith("+")) {
    cleanNumber = "+" + cleanNumber;
  }

  // Create match details message
  const season = seasonName || "Current Season";
  const matchDeadline = deadline
    ? new Date(deadline).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Season end";

  const message = `Hello! 👋

I'm your opponent for the Nexus Esports match:

🏆 Match: ${homePlayer || "Player 1"} vs ${awayPlayer || "Player 2"}
📅 Season: ${season}
⏰ Deadline: ${matchDeadline}
🆔 Match ID: ${fixtureId}

Let's coordinate a time to play our match.

What time works for you?

After playing, remember to submit the result on the Nexus Esports platform.

Thanks and good luck! 🎮`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl =
    cleanNumber && cleanNumber.length > 5
      ? `https://wa.me/${cleanNumber}?text=${encodedMessage}`
      : null;

  const handleCopyPhone = () => {
    if (cleanNumber) {
      navigator.clipboard.writeText(cleanNumber);
      setCopied(true);
      toast.success("Phone number copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ✅ If opponent doesn't have WhatsApp
  if (!opponentWhatsApp || !opponentWhatsAppVisible || !cleanNumber) {
    return (
      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        className={`text-center ${className}`}
      >
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-700/50 bg-gray-800/40 px-4 py-2.5 text-sm text-gray-400 backdrop-blur-sm">
          <MessageCircle size={16} className="text-gray-500" />
          <span>Contact not available</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Ask them to update their profile with contact info
        </p>
      </motion.div>
    );
  }

  // ✅ Compact version
  if (compact) {
    return (
      <div className={`relative inline-flex items-center gap-2 ${className}`}>
        <a
          href={whatsappUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-700 hover:scale-105"
        >
          <MessageCircle size={14} />
          <span>WhatsApp</span>
        </a>
        <button
          onClick={handleCopyPhone}
          className="inline-flex items-center gap-1 rounded-lg bg-gray-700 px-2 py-1.5 text-xs text-gray-300 transition-all hover:bg-gray-600"
          title="Copy phone number"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      className={`w-full max-w-sm ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Contact Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <Phone className="h-5 w-5 text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              Contact {opponentName}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{cleanNumber}</span>
              <button
                onClick={handleCopyPhone}
                className="text-gray-500 transition-colors hover:text-white"
                title="Copy phone number"
              >
                {copied ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Match Preview */}
        <div className="mb-3 rounded-xl border border-white/5 bg-gray-900/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Match</span>
            </div>
            <span className="text-xs font-medium text-white">
              {homePlayer || "Home"} vs {awayPlayer || "Away"}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-gray-500">{season}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs text-gray-500">{matchDeadline}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Button */}
        <motion.a
          href={whatsappUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="group relative flex min-h-[48px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-green-500/20 transition-all hover:from-green-700 hover:to-emerald-700"
        >
          {/* Animated background glow */}
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10"
          />

          <div className="relative flex items-center gap-2">
            <MessageCircle size={20} />
            <span>Chat on WhatsApp</span>
            <motion.div
              animate={isHovered ? { x: 5 } : { x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={16} />
            </motion.div>
          </div>

          {/* Badge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
            Live
          </div>
        </motion.a>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-green-400" />
            <span className="text-[10px] text-gray-500">End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-yellow-400" />
            <span className="text-[10px] text-gray-500">Quick reply</span>
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white shadow-xl"
            >
              Click to open WhatsApp
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}