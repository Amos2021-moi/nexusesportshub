"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Bell,
  BellDot,
  BellRing,
  CheckCircle,
  Trophy,
  Calendar,
  Award,
  X,
  Sparkles,
  Zap,
  Clock,
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
  metadata?: Record<string, any>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.15 },
  },
};

const badgeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
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
      const res = await fetch("/api/notifications");
      const data = await res.json();

      const notificationsArray = data.notifications || [];
      const count = data.unreadCount || 0;

      setNotifications(notificationsArray);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    setMarkingId(notificationId);
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    } finally {
      setMarkingId(null);
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      for (const id of unreadIds) {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id }),
        });
      }
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  }

  const getIcon = (type: string) => {
    const icons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
      RESULT_APPROVED: {
        icon: <CheckCircle className="h-4 w-4" />,
        color: "text-green-400",
        bg: "bg-green-500/10",
      },
      NEW_FIXTURE: {
        icon: <Calendar className="h-4 w-4" />,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      AWARD_EARNED: {
        icon: <Award className="h-4 w-4" />,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
      },
      TOURNAMENT_UPDATE: {
        icon: <Trophy className="h-4 w-4" />,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
      },
      PAYMENT_CONFIRMED: {
        icon: <Check className="h-4 w-4" />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      COMMUNITY_POST: {
        icon: <MessageCircle className="h-4 w-4" />,
        color: "text-pink-400",
        bg: "bg-pink-500/10",
      },
      SYSTEM_ALERT: {
        icon: <Shield className="h-4 w-4" />,
        color: "text-red-400",
        bg: "bg-red-500/10",
      },
      MATCH_REMINDER: {
        icon: <Clock className="h-4 w-4" />,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
      },
      SEASON_UPDATE: {
        icon: <Calendar className="h-4 w-4" />,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
      },
      default: {
        icon: <Bell className="h-4 w-4" />,
        color: "text-gray-400",
        bg: "bg-gray-500/10",
      },
    };
    return icons[type] || icons.default;
  };

  const getTimeAgo = (date: string) => {
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
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const hasUnread = unreadCount > 0;

  if (loading) {
    return (
      <div className="relative">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/5">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
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
        <motion.div
          animate={hasUnread ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: hasUnread ? Infinity : 0, repeatDelay: 3 }}
        >
          {hasUnread ? (
            <BellDot className="h-5 w-5 text-white" />
          ) : (
            <Bell className="h-5 w-5 text-gray-400" />
          )}
        </motion.div>

        <AnimatePresence>
          {hasUnread && (
            <motion.span
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/30"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-gray-800/95 shadow-2xl backdrop-blur-xl sm:w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
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

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <Bell className="h-6 w-6 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No notifications</p>
                  <p className="text-xs text-gray-500">Stay tuned for updates!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notif, index) => {
                    const { icon, color, bg } = getIcon(notif.type);
                    const isUnread = !notif.read;
                    const isMarking = markingId === notif.id;

                    return (
                      <motion.div
                        key={notif.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
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
                          {/* Icon */}
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
                            <span className={color}>{icon}</span>
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-white">
                                {notif.title}
                                {isUnread && (
                                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                )}
                              </p>
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
                            <div className="mt-1 flex items-center gap-3">
                              <span className="text-[10px] text-gray-500">
                                {getTimeAgo(notif.createdAt)}
                              </span>
                              {notif.link && (
                                <span className="text-[10px] text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
                                  Click to view →
                                </span>
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