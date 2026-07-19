// components/dashboard/LiveMatchClock.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface NextMatchData {
  hasNextMatch: boolean;
  fixtureId: string;
  opponentName: string;
  isHome: boolean;
  scheduledDate: string;
  countdown: {
    days: number;
    hours: number;
    minutes: number;
    totalSeconds: number;
    formatted: string;
    urgencyLabel: string;
    urgencyColor: string;
    urgencyBg: string;
  };
  hasSubmittedResult: boolean;
  status: string;
}

function LiveMatchClock() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLive, setIsLive] = useState(false);

  const { data, isLoading, error } = useQuery<NextMatchData>({
    queryKey: ['next-match'],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/next-match");
      if (!res.ok) throw new Error("Failed to fetch next match");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 0,
  });

  const updateCountdown = useCallback(() => {
    if (!data?.scheduledDate) return;

    const now = new Date().getTime();
    const matchTime = new Date(data.scheduledDate).getTime();
    const diff = Math.max(0, matchTime - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });
    setIsLive(diff < 3600000 && diff > 0); // Within 1 hour
  }, [data]);

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updateCountdown]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-24 flex items-center justify-center">
          <div className="text-gray-500">Loading match data...</div>
        </div>
      </div>
    );
  }

  if (error || !data?.hasNextMatch) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-gray-400">
          <AlertCircle className="h-5 w-5" />
          <span>No upcoming matches scheduled</span>
        </div>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const isMatchToday = days === 0;
  const isMatchSoon = days === 0 && hours < 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl ${
        isLive
          ? "border-green-500/30 bg-green-500/10"
          : isMatchSoon
          ? "border-yellow-500/30 bg-yellow-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      {/* Glow effect */}
      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl ${
        isLive ? "bg-green-500/20" : isMatchSoon ? "bg-yellow-500/20" : "bg-indigo-500/20"
      }`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${isLive ? "text-green-400 animate-pulse" : "text-indigo-400"}`} />
            <span className="font-medium text-white">
              {isLive ? "🔴 LIVE" : isMatchToday ? "Today's Match" : "Next Match"}
            </span>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full ${data.countdown.urgencyBg} ${data.countdown.urgencyColor}`}>
            {data.countdown.urgencyLabel}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">
              vs {data.opponentName}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {data.isHome ? "🏠 Home" : "✈️ Away"} • {new Date(data.scheduledDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mt-4 grid grid-cols-4 gap-2 max-w-xs">
          {[
            { label: "Days", value: days },
            { label: "Hours", value: hours },
            { label: "Minutes", value: minutes },
            { label: "Secs", value: seconds },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={`rounded-xl p-2 ${
                isLive ? "bg-green-500/20" : isMatchSoon ? "bg-yellow-500/20" : "bg-white/10"
              }`}>
                <span className={`text-2xl font-bold tabular-nums ${
                  isLive ? "text-green-400" : isMatchSoon ? "text-yellow-400" : "text-white"
                }`}>
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">{item.label}</span>
            </div>
          ))}
        </div>

        {data.hasSubmittedResult && (
          <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400">
            <span>⏳ Result submitted, waiting for approval</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
export default LiveMatchClock;