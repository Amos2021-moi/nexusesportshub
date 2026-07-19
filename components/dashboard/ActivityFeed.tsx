// components/dashboard/ActivityFeed.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  Trophy, 
  Calendar, 
  Award, 
  Bell, 
  CheckCircle, 
  Clock, 
  MessageCircle,
  Sparkles,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface ActivityData {
  activities: ActivityItem[];
  hasMore: boolean;
}

function ActivityFeed() {
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error } = useQuery<ActivityData>({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/activity");
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-500">Loading activity...</div>
        </div>
      </div>
    );
  }

  if (error || !data || data.activities.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-gray-400">
          <Activity className="h-5 w-5" />
          <span>No recent activity</span>
        </div>
      </div>
    );
  }

  const displayActivities = showAll ? data.activities : data.activities.slice(0, 4);
  const hasMore = data.activities.length > 4;

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      'RESULT_APPROVED': Trophy,
      'RESULT_SUBMITTED': Clock,
      'FIXTURE_SCHEDULED': Calendar,
      'FIXTURE_COMPLETED': CheckCircle,
      'NEW_FIXTURE': Calendar,
      'AWARD_RECEIVED': Award,
      'SYSTEM': Bell,
      'COMMUNITY': MessageCircle,
    };
    return icons[type] || Sparkles;
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      'RESULT_APPROVED': 'text-emerald-400 bg-emerald-500/20',
      'RESULT_SUBMITTED': 'text-yellow-400 bg-yellow-500/20',
      'FIXTURE_SCHEDULED': 'text-blue-400 bg-blue-500/20',
      'FIXTURE_COMPLETED': 'text-green-400 bg-green-500/20',
      'NEW_FIXTURE': 'text-indigo-400 bg-indigo-500/20',
      'AWARD_RECEIVED': 'text-yellow-400 bg-yellow-500/20',
      'SYSTEM': 'text-purple-400 bg-purple-500/20',
      'COMMUNITY': 'text-pink-400 bg-pink-500/20',
    };
    return colors[type] || 'text-gray-400 bg-gray-500/20';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          <span className="font-medium text-white">Recent Activity</span>
        </div>
        {!showAll && data.activities.length > 0 && (
          <span className="text-xs text-gray-500">{data.activities.length} items</span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <AnimatePresence>
          {displayActivities.map((item, index) => {
            const Icon = getActivityIcon(item.type);
            const colorClass = getActivityColor(item.type);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start gap-3 rounded-xl p-3 transition-all ${
                  !item.read ? 'bg-white/5 border-l-2 border-indigo-400' : ''
                }`}
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{formatTimestamp(item.timestamp)}</p>
                </div>
                {!item.read && (
                  <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-gray-400 transition hover:text-white"
        >
          {showAll ? (
            <>Show Less <ChevronRight className="h-3 w-3 rotate-90" /></>
          ) : (
            <>View All ({data.activities.length}) <ChevronRight className="h-3 w-3" /></>
          )}
        </button>
      )}
    </motion.div>
  );
}

export default ActivityFeed;