// components/dashboard/SeasonProgress.tsx
"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Trophy, Users, Clock, CheckCircle, Circle } from "lucide-react";

interface SeasonProgressData {
  hasActiveSeason: boolean;
  seasonName: string;
  seasonId: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
  totalFixtures: number;
  totalPlayers: number;
  isEnrolled: boolean;
  milestones: {
    label: string;
    status: 'completed' | 'active' | 'pending';
  }[];
}

function SeasonProgress() {
  const { data, isLoading, error } = useQuery<SeasonProgressData>({
    queryKey: ['season-progress'],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/season-progress");
      if (!res.ok) throw new Error("Failed to fetch season progress");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-500">Loading season data...</div>
        </div>
      </div>
    );
  }

  if (error || !data?.hasActiveSeason) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-gray-400">
          <Calendar className="h-5 w-5" />
          <span>No active season</span>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    completed: 'bg-emerald-500',
    active: 'bg-yellow-500 animate-pulse',
    pending: 'bg-gray-600',
  };

  const statusLabels: Record<string, string> = {
    completed: '✅',
    active: '●',
    pending: '○',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span className="font-medium text-white">{data.seasonName}</span>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${
          data.status === 'LIVE' ? 'bg-green-500/20 text-green-400' :
          data.status === 'FIXTURE_LOCK' ? 'bg-blue-500/20 text-blue-400' :
          data.status === 'ENDED' ? 'bg-gray-500/20 text-gray-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {data.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{data.daysElapsed} days elapsed</span>
          <span>{data.progress}%</span>
          <span>{data.daysRemaining} days left</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${
              data.progress < 30 ? 'from-blue-500 to-cyan-500' :
              data.progress < 70 ? 'from-yellow-500 to-orange-500' :
              'from-green-500 to-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {data.milestones.map((milestone, index) => (
          <div key={index} className="text-center">
            <div className={`mx-auto h-6 w-6 rounded-full flex items-center justify-center ${
              milestone.status === 'completed' ? 'bg-emerald-500/20' :
              milestone.status === 'active' ? 'bg-yellow-500/20' :
              'bg-gray-700/50'
            }`}>
              <span className="text-xs">
                {milestone.status === 'completed' ? '✅' :
                 milestone.status === 'active' ? '●' : '○'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block truncate">
              {milestone.label}
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-2">
          <Users className="h-4 w-4 text-blue-400" />
          <div>
            <p className="text-xs text-gray-400">Players</p>
            <p className="text-sm font-bold text-white">{data.totalPlayers}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-2">
          <Clock className="h-4 w-4 text-purple-400" />
          <div>
            <p className="text-xs text-gray-400">Fixtures</p>
            <p className="text-sm font-bold text-white">{data.totalFixtures}</p>
          </div>
        </div>
      </div>

      {!data.isEnrolled && (
        <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2 text-center">
          <span className="text-xs text-yellow-400">You are not enrolled in this season</span>
        </div>
      )}
    </motion.div>
  );
}
export default SeasonProgress;