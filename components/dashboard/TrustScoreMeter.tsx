// components/dashboard/TrustScoreMeter.tsx
"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Shield, ShieldCheck, ShieldAlert, TrendingUp, Award, CheckCircle } from "lucide-react";

interface TrustComponent {
  label: string;
  value: number;
  weight: string;
  icon: string;
  color: string;
  bg: string;
}

interface TrustData {
  trustScore: number;
  weightedScore: number;
  rank: number;
  totalPlayers: number;
  tier: string;
  tierColor: string;
  tierBg: string;
  nextTier: string;
  nextTierProgress: number;
  components: TrustComponent[];
  verifiedBadge: boolean;
}

function TrustScoreMeter() {
  const { data, isLoading, error } = useQuery<TrustData>({
    queryKey: ['trust-meter'],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/trust-meter");
      if (!res.ok) throw new Error("Failed to fetch trust data");
      return res.json();
    },
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-500">Loading trust score...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-gray-400">
          <Shield className="h-5 w-5" />
          <span>Trust score not available</span>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.verifiedBadge ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : data.tier === 'Elite' ? (
            <Shield className="h-5 w-5 text-yellow-400" />
          ) : (
            <Shield className="h-5 w-5 text-blue-400" />
          )}
          <span className="font-medium text-white">Trust Score</span>
          {data.verifiedBadge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              ✓ Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(data.weightedScore)}`}>
            {data.weightedScore}
          </span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>

      {/* Tier badge */}
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-xs px-3 py-1 rounded-full ${data.tierBg} ${data.tierColor}`}>
          {data.tier}
        </span>
        <span className="text-xs text-gray-500">
          #{data.rank} of {data.totalPlayers} players
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-700/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.weightedScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(data.weightedScore)}`}
        />
      </div>

      {/* Next tier progress */}
      {data.nextTier !== 'Max Level' && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>Next: {data.nextTier}</span>
          <span>{data.nextTierProgress}%</span>
        </div>
      )}

      {/* Components breakdown */}
      <div className="mt-4 space-y-2">
        {data.components.map((component, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3"
          >
            <span className="text-sm">{component.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{component.label}</span>
                <span className={component.color}>{component.value}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${component.value}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 }}
                  className={`h-full rounded-full ${component.bg}`}
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-500">{component.weight}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default TrustScoreMeter;