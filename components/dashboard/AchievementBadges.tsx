// components/dashboard/AchievementBadges.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Award, Sparkles, ChevronDown, ChevronUp, Lock, Star } from "lucide-react";

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface AchievementsData {
  achievements: Achievement[];
  unlockedCount: number;
  totalAchievements: number;
  progress: number;
}
function AchievementBadges() {
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error } = useQuery<AchievementsData>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-500">Loading achievements...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-gray-400">
          <Award className="h-5 w-5" />
          <span>No achievements yet</span>
        </div>
      </div>
    );
  }

  const displayAchievements = showAll ? data.achievements : data.achievements.slice(0, 4);
  const hasMore = data.achievements.length > 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span className="font-medium text-white">Achievements</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {data.unlockedCount}/{data.totalAchievements}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
            {data.progress}%
          </span>
        </div>
      </div>

      {/* Progress bar for achievements */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-700/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
        />
      </div>

      {/* Badges Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {displayAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className={`relative rounded-xl p-3 text-center transition-all ${
              achievement.unlocked
                ? "border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent"
                : "border border-white/5 bg-white/5 opacity-50"
            }`}
          >
            <div className="text-3xl">{achievement.icon}</div>
            <p className="mt-1 text-[10px] font-medium text-white truncate">
              {achievement.title}
            </p>
            {achievement.unlocked ? (
              <span className="text-[8px] text-green-400">✓ Unlocked</span>
            ) : (
              <span className="text-[8px] text-gray-500">
                {achievement.progress !== undefined && achievement.maxProgress !== undefined ? (
                  `${achievement.progress}/${achievement.maxProgress}`
                ) : (
                  <Lock className="inline h-3 w-3" />
                )}
              </span>
            )}
            {achievement.unlocked && (
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-gray-400 transition hover:text-white"
        >
          {showAll ? (
            <>Show Less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>View All ({data.achievements.length}) <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}

      {/* Achievement stat */}
      {data.unlockedCount === data.totalAchievements && (
        <div className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="text-xs font-medium text-yellow-400">Achievement Hunter! 🎯</span>
        </div>
      )}
    </motion.div>
  );
}
export default AchievementBadges;