"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellDot,
  BellRing,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Calendar,
  Award,
  MessageCircle,
  Users,
  Shield,
  Star,
  Crown,
  Gift,
  Mail,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: number;
  priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

const priorityConfig = {
  CRITICAL: { 
    color: "text-red-400", 
    bg: "bg-red-500/10", 
    border: "border-red-500/20",
    label: "Critical",
    icon: AlertCircle,
    ring: "ring-red-500/30",
  },
  HIGH: { 
    color: "text-orange-400", 
    bg: "bg-orange-500/10", 
    border: "border-orange-500/20",
    label: "High",
    icon: Zap,
    ring: "ring-orange-500/30",
  },
  MEDIUM: { 
    color: "text-yellow-400", 
    bg: "bg-yellow-500/10", 
    border: "border-yellow-500/20",
    label: "Medium",
    icon: Clock,
    ring: "ring-yellow-500/30",
  },
  LOW: { 
    color: "text-gray-400", 
    bg: "bg-gray-500/10", 
    border: "border-gray-500/20",
    label: "Low",
    icon: CheckCircle,
    ring: "ring-gray-500/30",
  },
};

function getIcon(type: string) {
  switch (type) {
    case "MATCH_RESULT_PENDING":
    case "MATCH_RESULT_APPROVED":
    case "MATCH_RESULT_REJECTED":
      return Trophy;
    case "NEW_FIXTURE":
    case "FIXTURE_REMINDER":
      return Calendar;
    case "TOURNAMENT_START":
    case "TOURNAMENT_UPDATE":
    case "TOURNAMENT_COMPLETED":
      return Crown;
    case "AWARD_EARNED":
      return Award;
    case "SEASON_UPDATE":
    case "REGISTRATION_CLOSING":
      return Calendar;
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_FAILED":
      return Gift;
    case "NEWS_PUBLISHED":
      return FileText;
    case "COMMUNITY_REPLY":
    case "COMMUNITY_LIKE":
      return MessageCircle;
    case "SYSTEM_ALERT":
    case "ADMIN_ALERT":
      return Shield;
    default:
      return Bell;
  }
}

function getPriorityLabel(priority: number): string {
  if (priority >= 85) return "Critical";
  if (priority >= 70) return "High";
  if (priority >= 40) return "Medium";
  return "Low";
}

function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diff = now.getTime() - past.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return past.toLocaleDateString();
}

export default function SmartNotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [counts, setCounts] = useState<NotificationCounts>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications/smart?limit=30");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setCounts(data.counts || { critical: 0, high: 0, medium: 0, low: 0, total: 0 });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    setMarkingId(notificationId);
    try {
      await fetch("/api/notifications/smart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    } finally {
      setMarkingId(null);
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/smart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      await fetchNotifications();
      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  const filteredNotifications = filter === "ALL"
    ? notifications
    : notifications.filter(n => n.priorityLevel === filter);

  const hasUnread = unreadCount > 0;

  if (loading) {
    return (
      <div className="relative">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/5">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
        aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ""}`}
      >
        {hasUnread ? (
          <BellDot className="h-5 w-5 text-white" />
        ) : (
          <Bell className="h-5 w-5 text-gray-400" />
        )}

        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-gray-800/95 shadow-2xl backdrop-blur-xl sm:w-[420px]"
          >
            {/* Header */}
            <div className="border-b border-white/10 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    className="flex items-center gap-1 text-xs text-indigo-400 transition-colors hover:text-indigo-300 disabled:opacity-50"
                  >
                    {markingAll ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Mark all read
                  </button>
                )}
              </div>

              {/* Priority Filters */}
              <div className="mt-2 flex gap-1 overflow-x-auto">
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => {
                  const count = p === "ALL" 
                    ? unreadCount 
                    : counts[p.toLowerCase() as keyof NotificationCounts];
                  const isActive = filter === p;
                  const config = priorityConfig[p as keyof typeof priorityConfig];
                  const color = isActive ? config?.color || "text-white" : "text-gray-400";
                  const bg = isActive ? config?.bg || "bg-white/10" : "bg-transparent";

                  return (
                    <button
                      key={p}
                      onClick={() => setFilter(p as any)}
                      className={`flex min-h-[28px] items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${color} ${bg}`}
                    >
                      {p === "ALL" ? "📋 All" : p}
                      {count > 0 && (
                        <span className="rounded-full bg-white/10 px-1.5 text-[8px]">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <Bell className="h-6 w-6 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No notifications</p>
                  <p className="text-xs text-gray-500">Stay tuned for updates!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredNotifications.map((notif, index) => {
                    const Icon = getIcon(notif.type);
                    const config = priorityConfig[notif.priorityLevel];
                    const isUnread = !notif.read;
                    const isMarking = markingId === notif.id;

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.03 }}
                        className={`group border-b border-white/5 transition-colors last:border-0 ${
                          isUnread ? "bg-indigo-500/5" : ""
                        } hover:bg-white/5`}
                      >
                        <div
                          className="flex cursor-pointer items-start gap-3 px-4 py-3"
                          onClick={() => {
                            if (isUnread) markAsRead(notif.id);
                            if (notif.link) {
                              router.push(notif.link);
                              setIsOpen(false);
                            }
                          }}
                        >
                          {/* Priority Indicator */}
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.bg} ${config.ring} ring-1`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-sm font-medium text-white">
                                  {notif.title}
                                </p>
                                {isUnread && (
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                )}
                              </div>
                              {isMarking ? (
                                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                              ) : (
                                isUnread && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notif.id);
                                    }}
                                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                )
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{notif.message}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] text-gray-500">
                                {getTimeAgo(notif.createdAt)}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-gray-600" />
                              <span className={`text-[10px] font-medium ${config.color}`}>
                                {config.label} • {notif.priority}%
                              </span>
                              {notif.reason && (
                                <>
                                  <span className="h-1 w-1 rounded-full bg-gray-600" />
                                  <span className="text-[10px] text-gray-500 line-clamp-1">
                                    💡 {notif.reason}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-white/10 px-4 py-2.5 text-center">
                <Link
                  href="/dashboard/notifications"
                  className="text-xs text-gray-500 transition-colors hover:text-gray-300"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}